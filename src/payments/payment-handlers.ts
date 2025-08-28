import { savePaymentEvent, updatePaymentStatus, getCustomerByDodoId } from '../db/client.js';
import { getPaymentDetails } from './payment.js';

export interface PaymentEventData {
  payment_id: string;
  status: 'succeeded' | 'failed' | 'pending' | 'cancelled';
  amount?: number;
  currency?: string;
  customer_id?: string;
  failure_reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Handle successful payment
 * This is typically called from webhook handlers
 */
export async function handlePaymentSuccess(eventData: PaymentEventData): Promise<void> {
  try {
    console.log('🎉 Processing payment success:', eventData.payment_id);
    
    // 1. Get full payment details from Dodo
    const paymentDetails = await getPaymentDetails(eventData.payment_id);
    
    // 2. Find the customer in our database
    let customer = null;
    if (paymentDetails.customer?.customer_id) {
      customer = await getCustomerByDodoId(paymentDetails.customer.customer_id);
    }
    
    // 3. Update payment status in our database
    await updatePaymentStatus(eventData.payment_id, 'succeeded');
    
    // 4. Save the payment success event
    await savePaymentEvent({
      payment_id: eventData.payment_id,
      event_type: 'payment.succeeded',
      status: 'succeeded',
      amount: paymentDetails.total_amount,
      currency: paymentDetails.currency || 'USD',
      customer_id: customer?.id || null,
      dodo_customer_id: paymentDetails.customer?.customer_id,
      metadata: paymentDetails.metadata || {},
      processed_at: new Date().toISOString(),
    });
    
    console.log('✅ Payment success handled successfully');
    
    // 5. Trigger any post-payment actions
    await handlePostPaymentActions(paymentDetails, customer);
    
  } catch (error) {
    console.error('❌ Error handling payment success:', error);
    throw error;
  }
}

/**
 * Handle failed payment
 * This is typically called from webhook handlers
 */
export async function handlePaymentFailure(eventData: PaymentEventData): Promise<void> {
  try {
    console.log('❌ Processing payment failure:', eventData.payment_id);
    
    // 1. Get full payment details from Dodo (if available)
    let paymentDetails = null;
    try {
      paymentDetails = await getPaymentDetails(eventData.payment_id);
    } catch (error) {
      console.log('⚠️  Could not fetch payment details for failed payment, using event data');
    }
    
    // 2. Find the customer in our database
    let customer = null;
    const customerId = paymentDetails?.customer?.customer_id || eventData.customer_id;
    if (customerId) {
      customer = await getCustomerByDodoId(customerId);
    }
    
    // 3. Update payment status in our database
    await updatePaymentStatus(eventData.payment_id, 'failed');
    
    // 4. Save the payment failure event
    await savePaymentEvent({
      payment_id: eventData.payment_id,
      event_type: 'payment.failed',
      status: 'failed',
      amount: paymentDetails?.total_amount || eventData.amount || 0,
      currency: paymentDetails?.currency || eventData.currency || 'USD',
      customer_id: customer?.id || null,
      dodo_customer_id: customerId || null,
      failure_reason: eventData.failure_reason || 'Unknown error',
      metadata: paymentDetails?.metadata || eventData.metadata || {},
      processed_at: new Date().toISOString(),
    });
    
    console.log('✅ Payment failure handled successfully');
    
    // 5. Trigger any post-failure actions (notifications, retries, etc.)
    await handlePostPaymentFailureActions(eventData, customer);
    
  } catch (error) {
    console.error('❌ Error handling payment failure:', error);
    throw error;
  }
}

/**
 * Handle payment status updates (pending, cancelled, etc.)
 */
export async function handlePaymentStatusUpdate(eventData: PaymentEventData): Promise<void> {
  try {
    console.log(`📊 Processing payment status update: ${eventData.payment_id} -> ${eventData.status}`);
    
    // 1. Update payment status in our database
    await updatePaymentStatus(eventData.payment_id, eventData.status);
    
    // 2. Save the status update event
    await savePaymentEvent({
      payment_id: eventData.payment_id,
      event_type: `payment.${eventData.status}`,
      status: eventData.status,
      amount: eventData.amount || 0,
      currency: eventData.currency || 'USD',
      customer_id: null, // Will be populated if we find the customer
      dodo_customer_id: eventData.customer_id || null,
      metadata: eventData.metadata || {},
      processed_at: new Date().toISOString(),
    });
    
    console.log('✅ Payment status update handled successfully');
    
  } catch (error) {
    console.error('❌ Error handling payment status update:', error);
    throw error;
  }
}

/**
 * Actions to perform after successful payment
 * Customize this based on your business logic
 */
async function handlePostPaymentActions(paymentDetails: any, customer: any): Promise<void> {
  try {
    console.log('🎯 Executing post-payment actions...');
    
    // Example actions you might want to implement:
    
    // 1. Send confirmation email
    // await sendPaymentConfirmationEmail(customer, paymentDetails);
    
    // 2. Provision product access
    // await provisionProductAccess(customer, paymentDetails.product_cart);
    
    // 3. Update customer status
    // if (customer) {
    //   await updateCustomerStatus(customer.id, 'active');
    // }
    
    // 4. Trigger external integrations
    // await triggerExternalWebhook(paymentDetails);
    
    console.log('✅ Post-payment actions completed');
    
  } catch (error) {
    console.error('❌ Error in post-payment actions:', error);
    // Don't throw error here - payment was successful, this is just cleanup
  }
}

/**
 * Actions to perform after failed payment
 * Customize this based on your business logic
 */
async function handlePostPaymentFailureActions(eventData: PaymentEventData, customer: any): Promise<void> {
  try {
    console.log('🔧 Executing post-payment failure actions...');
    
    // Example actions you might want to implement:
    
    // 1. Send failure notification email
    // await sendPaymentFailureEmail(customer, eventData);
    
    // 2. Log for support team
    // await createSupportTicket(eventData);
    
    // 3. Update customer status
    // if (customer) {
    //   await updateCustomerStatus(customer.id, 'payment_failed');
    // }
    
    // 4. Trigger retry logic (if appropriate)
    // await schedulePaymentRetry(eventData);
    
    console.log('✅ Post-payment failure actions completed');
    
  } catch (error) {
    console.error('❌ Error in post-payment failure actions:', error);
    // Don't throw error here - this is just cleanup/notification logic
  }
}

/**
 * Comprehensive payment processing orchestrator
 * Use this to handle all payment-related webhook events
 */
export async function processPaymentWebhook(webhookEvent: any): Promise<void> {
  try {
    const { type, data } = webhookEvent;
    const paymentData = data.object;
    
    console.log(`🎣 Processing payment webhook: ${type}`);
    
    const eventData: PaymentEventData = {
      payment_id: paymentData.payment_id || paymentData.id,
      status: paymentData.status,
      amount: paymentData.amount,
      currency: paymentData.currency,
      customer_id: paymentData.customer_id,
      failure_reason: paymentData.failure_reason,
      metadata: paymentData.metadata || {},
    };
    
    switch (type) {
      case 'payment.succeeded':
      case 'payment.completed':
        await handlePaymentSuccess(eventData);
        break;
        
      case 'payment.failed':
      case 'payment.declined':
        await handlePaymentFailure(eventData);
        break;
        
      case 'payment.pending':
        eventData.status = 'pending';
        await handlePaymentStatusUpdate(eventData);
        break;
        
      case 'payment.cancelled':
        eventData.status = 'cancelled';
        await handlePaymentStatusUpdate(eventData);
        break;
        
      default:
        console.log(`⚠️  Unhandled payment webhook type: ${type}`);
        // Still save the event for audit purposes
        await savePaymentEvent({
          payment_id: eventData.payment_id,
          event_type: type,
          status: eventData.status || 'unknown',
          amount: eventData.amount || 0,
          currency: eventData.currency || 'USD',
          customer_id: null,
          dodo_customer_id: eventData.customer_id || null,
          metadata: eventData.metadata || {},
          processed_at: new Date().toISOString(),
        });
    }
    
    console.log('✅ Payment webhook processed successfully');
    
  } catch (error) {
    console.error('❌ Error processing payment webhook:', error);
    throw error;
  }
}
