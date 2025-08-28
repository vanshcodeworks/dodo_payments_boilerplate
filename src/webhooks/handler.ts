import crypto from 'crypto';
import { config } from '../config/index.js';
import { 
  logPaymentEvent, 
  markEventProcessed, 
  getCustomerByDodoId, 
  saveSubscription, 
  updateSubscription 
} from '../db/client.js';
import { processPaymentWebhook } from '../payments/payment-handlers.js';

// Webhook signature verification
function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!config.dodo.webhookSecret) {
    console.warn('⚠️ No webhook secret configured, skipping signature verification');
    return true; // Allow in development
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', config.dodo.webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature.replace('sha256=', ''), 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('❌ Error verifying signature:', error);
    return false;
  }
}

// Main webhook handler function
export async function handleWebhook(body: string, signature?: string) {
  try {
    console.log('🎣 Webhook received');

    // Verify signature if provided
    if (signature && !verifyWebhookSignature(body, signature)) {
      console.error('❌ Invalid webhook signature');
      return { success: false, error: 'Invalid signature' };
    }

    const event = JSON.parse(body);
    console.log('📋 Event type:', event.type);

    // Log the event
    const eventLog = await logPaymentEvent({
      event_type: event.type,
      event_data: event,
      dodo_event_id: event.id,
    });

    // Process the event based on type
    let result;
    switch (event.type) {
      // Payment Events - Use new comprehensive payment handlers
      case 'payment.succeeded':
      case 'payment.completed':
      case 'payment.failed':
      case 'payment.declined':
      case 'payment.processing':
      case 'payment.pending':
      case 'payment.cancelled':
        result = await processPaymentWebhook(event);
        break;

      // Subscription Events
      case 'subscription.active':
        result = await handleSubscriptionActive(event);
        break;
      case 'subscription.on_hold':
        result = await handleSubscriptionOnHold(event);
        break;
      case 'subscription.renewed':
        result = await handleSubscriptionRenewed(event);
        break;
      case 'subscription.plan_changed':
        result = await handleSubscriptionPlanChanged(event);
        break;
      case 'subscription.cancelled':
        result = await handleSubscriptionCancelled(event);
        break;
      case 'subscription.failed':
        result = await handleSubscriptionFailed(event);
        break;
      case 'subscription.expired':
        result = await handleSubscriptionExpired(event);
        break;

      // Refund Events
      case 'refund.succeeded':
        result = await handleRefundSucceeded(event);
        break;
      case 'refund.failed':
        result = await handleRefundFailed(event);
        break;

      // Dispute Events
      case 'dispute.opened':
      case 'dispute.expired':
      case 'dispute.accepted':
      case 'dispute.cancelled':
      case 'dispute.challenged':
      case 'dispute.won':
      case 'dispute.lost':
        result = await handleDisputeEvent(event);
        break;

      // License Key Events
      case 'license_key.created':
        result = await handleLicenseKeyCreated(event);
        break;

      default:
        console.log('⚠️ Unhandled event type:', event.type);
        result = { success: true, message: 'Event logged but not processed' };
    }

    // Mark event as processed
    await markEventProcessed(eventLog.id);

    console.log('✅ Webhook processed successfully');
    return { success: true, ...result };

  } catch (error) {
    console.error('❌ Webhook processing failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Event handlers
async function handlePaymentSucceeded(event: any) {
  console.log('💰 Payment succeeded:', event.data.object.id);
  // Add custom logic here
  return { message: 'Payment success recorded' };
}

async function handlePaymentFailed(event: any) {
  console.log('💸 Payment failed:', event.data.object.id);
  // Add custom logic here
  return { message: 'Payment failure recorded' };
}

async function handlePaymentProcessing(event: any) {
  console.log('⏳ Payment processing:', event.data.object.id);
  return { message: 'Payment processing status recorded' };
}

async function handlePaymentCancelled(event: any) {
  console.log('🚫 Payment cancelled:', event.data.object.id);
  return { message: 'Payment cancellation recorded' };
}

async function handleSubscriptionActive(event: any) {
  const subscription = event.data.object;
  console.log('🎉 Subscription activated:', subscription.id);

  try {
    // Find customer by Dodo customer ID
    const customer = await getCustomerByDodoId(subscription.customer);
    
    if (!customer) {
      console.error('Customer not found for subscription:', subscription.id);
      return { message: 'Customer not found' };
    }

    // Save or update subscription
    await saveSubscription({
      user_id: customer.user_id,
      customer_id: customer.id,
      dodo_subscription_id: subscription.id,
      product_id: subscription.product || '',
      price_id: subscription.price || '',
      status: 'active',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      metadata: subscription.metadata || {},
    });

    return { message: 'Subscription activated and saved' };
  } catch (error) {
    console.error('Error handling subscription activation:', error);
    return { message: 'Error processing subscription activation' };
  }
}

async function handleSubscriptionOnHold(event: any) {
  const subscription = event.data.object;
  console.log('⏸️ Subscription on hold:', subscription.id);
  
  await updateSubscription(subscription.id, { status: 'on_hold' });
  return { message: 'Subscription marked as on hold' };
}

async function handleSubscriptionRenewed(event: any) {
  const subscription = event.data.object;
  console.log('🔄 Subscription renewed:', subscription.id);
  
  await updateSubscription(subscription.id, {
    status: 'active',
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  });
  return { message: 'Subscription renewal recorded' };
}

async function handleSubscriptionPlanChanged(event: any) {
  const subscription = event.data.object;
  console.log('📝 Subscription plan changed:', subscription.id);
  
  await updateSubscription(subscription.id, {
    status: subscription.status,
    metadata: subscription.metadata || {},
  });
  return { message: 'Subscription plan change recorded' };
}

async function handleSubscriptionCancelled(event: any) {
  const subscription = event.data.object;
  console.log('❌ Subscription cancelled:', subscription.id);
  
  await updateSubscription(subscription.id, {
    status: 'cancelled',
    cancel_at_period_end: true,
  });
  return { message: 'Subscription cancellation recorded' };
}

async function handleSubscriptionFailed(event: any) {
  const subscription = event.data.object;
  console.log('💥 Subscription failed:', subscription.id);
  
  await updateSubscription(subscription.id, { status: 'failed' });
  return { message: 'Subscription failure recorded' };
}

async function handleSubscriptionExpired(event: any) {
  const subscription = event.data.object;
  console.log('⌛ Subscription expired:', subscription.id);
  
  await updateSubscription(subscription.id, { status: 'expired' });
  return { message: 'Subscription expiration recorded' };
}

async function handleRefundSucceeded(event: any) {
  console.log('💰 Refund succeeded:', event.data.object.id);
  return { message: 'Refund success recorded' };
}

async function handleRefundFailed(event: any) {
  console.log('💸 Refund failed:', event.data.object.id);
  return { message: 'Refund failure recorded' };
}

async function handleDisputeEvent(event: any) {
  console.log('⚖️ Dispute event:', event.type, event.data.object.id);
  return { message: `Dispute ${event.type} recorded` };
}

async function handleLicenseKeyCreated(event: any) {
  console.log('🔑 License key created:', event.data.object.id);
  return { message: 'License key creation recorded' };
}
