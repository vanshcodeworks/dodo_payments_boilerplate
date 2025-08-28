import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

// Create Supabase clients
export const supabase = createClient(config.supabase.url, config.supabase.anonKey);
export const adminSupabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

// Database operations
export async function saveUser(email: string, fullName?: string) {
  const { data, error } = await adminSupabase
    .from('users')
    .insert({ email, full_name: fullName })
    .select('*')
    .single();
  
  if (error) throw new Error(`Failed to save user: ${error.message}`);
  return data;
}

export async function saveCustomerId(userId: string, externalId: string) {
  const { data, error } = await adminSupabase
    .from('users')
    .update({ dodo_customer_id: externalId })
    .eq('id', userId)
    .select('*')
    .single();
  
  if (error) throw new Error(`Failed to save customer ID: ${error.message}`);
  return data;
}

export async function saveCustomer(customerData: {
  user_id: string;
  dodo_customer_id: string;
  email: string;
  full_name?: string;
  phone?: string;
  metadata?: any;
}) {
  const { data, error } = await adminSupabase
    .from('customers')
    .insert(customerData)
    .select('*')
    .single();
  
  if (error) throw new Error(`Failed to save customer: ${error.message}`);
  return data;
}

export async function saveSubscription(subscriptionData: {
  user_id: string;
  customer_id: string;
  dodo_subscription_id: string;
  product_id: string;
  price_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end?: boolean;
  metadata?: any;
}) {
  const { data, error } = await adminSupabase
    .from('subscriptions')
    .insert(subscriptionData)
    .select('*')
    .single();
  
  if (error) throw new Error(`Failed to save subscription: ${error.message}`);
  return data;
}

export async function updateSubscription(dodoSubscriptionId: string, updates: {
  status?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  metadata?: any;
}) {
  const { data, error } = await adminSupabase
    .from('subscriptions')
    .update(updates)
    .eq('dodo_subscription_id', dodoSubscriptionId)
    .select('*')
    .single();
  
  if (error) throw new Error(`Failed to update subscription: ${error.message}`);
  return data;
}

export async function getCustomerByUserId(userId: string) {
  const { data, error } = await adminSupabase
    .from('customers')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    throw new Error(`Failed to get customer: ${error.message}`);
  }
  return data;
}

export async function getCustomerByDodoId(dodoCustomerId: string) {
  const { data, error } = await adminSupabase
    .from('customers')
    .select('*')
    .eq('dodo_customer_id', dodoCustomerId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get customer: ${error.message}`);
  }
  return data;
}

export async function logPaymentEvent(eventData: {
  event_type: string;
  event_data: any;
  dodo_event_id?: string;
  processed?: boolean;
  error_message?: string;
}) {
  const { data, error } = await adminSupabase
    .from('payment_events')
    .insert({
      ...eventData,
      processed: eventData.processed || false,
      retry_count: 0,
    })
    .select('*')
    .single();
  
  if (error) throw new Error(`Failed to log event: ${error.message}`);
  return data;
}

export async function markEventProcessed(eventId: string) {
  const { data, error } = await adminSupabase
    .from('payment_events')
    .update({
      processed: true,
      processed_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .select('*')
    .single();
  
  if (error) throw new Error(`Failed to mark event as processed: ${error.message}`);
  return data;
}

// Payment-specific database operations
export async function savePaymentEvent(eventData: {
  payment_id: string;
  event_type: string;
  status: string;
  amount: number;
  currency: string;
  customer_id: string | null;
  dodo_customer_id: string | null;
  failure_reason?: string;
  metadata?: Record<string, any>;
  processed_at: string;
}) {
  const { data, error } = await adminSupabase
    .from('payment_events')
    .insert({
      event_type: eventData.event_type,
      event_data: {
        payment_id: eventData.payment_id,
        status: eventData.status,
        amount: eventData.amount,
        currency: eventData.currency,
        customer_id: eventData.customer_id,
        dodo_customer_id: eventData.dodo_customer_id,
        failure_reason: eventData.failure_reason,
        metadata: eventData.metadata || {},
      },
      dodo_event_id: eventData.payment_id, // Use payment_id as event identifier
      processed: true,
      processed_at: eventData.processed_at,
    })
    .select('*')
    .single();
  
  if (error) throw new Error(`Failed to save payment event: ${error.message}`);
  return data;
}

export async function updatePaymentStatus(paymentId: string, status: string) {
  // First, try to update existing payment record
  const { data: existingPayment, error: findError } = await adminSupabase
    .from('payments')
    .select('id')
    .eq('dodo_payment_id', paymentId)
    .single();
  
  if (findError && findError.code !== 'PGRST116') {
    throw new Error(`Failed to find payment: ${findError.message}`);
  }
  
  if (existingPayment) {
    // Update existing payment
    const { data, error } = await adminSupabase
      .from('payments')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('dodo_payment_id', paymentId)
      .select('*')
      .single();
    
    if (error) throw new Error(`Failed to update payment status: ${error.message}`);
    return data;
  } else {
    // Create new payment record with minimal info
    const { data, error } = await adminSupabase
      .from('payments')
      .insert({
        dodo_payment_id: paymentId,
        status,
        amount: 0, // Will be updated when we get full payment details
        currency: 'USD',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();
    
    if (error) throw new Error(`Failed to create payment record: ${error.message}`);
    return data;
  }
}

export async function savePayment(paymentData: {
  dodo_payment_id: string;
  customer_id?: string | null;
  dodo_customer_id?: string | null;
  amount: number;
  currency: string;
  status: string;
  product_ids?: string[];
  metadata?: Record<string, any>;
}) {
  const { data, error } = await adminSupabase
    .from('payments')
    .insert({
      ...paymentData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  
  if (error) throw new Error(`Failed to save payment: ${error.message}`);
  return data;
}

export async function getPaymentByDodoId(dodoPaymentId: string) {
  const { data, error } = await adminSupabase
    .from('payments')
    .select('*')
    .eq('dodo_payment_id', dodoPaymentId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get payment: ${error.message}`);
  }
  return data;
}

export async function listPaymentsByCustomer(customerId: string, limit: number = 50) {
  const { data, error } = await adminSupabase
    .from('payments')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw new Error(`Failed to list payments: ${error.message}`);
  return data || [];
}
