// Supabase Database Types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
  dodo_customer_id?: string;
}

export interface Customer {
  id: string;
  user_id: string;
  dodo_customer_id: string;
  email: string;
  full_name?: string;
  phone?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  customer_id: string;
  dodo_subscription_id: string;
  product_id: string;
  price_id: string;
  status: 'active' | 'canceled' | 'incomplete' | 'past_due' | 'paused' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaymentEvent {
  id: string;
  event_type: string;
  event_data: Record<string, any>;
  dodo_event_id?: string;
  processed: boolean;
  processed_at?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
}

// Dodo Payments Types
export interface DodoCustomer {
  customer_id: string;
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, any>;
}

export interface DodoSubscription {
  subscription_id: string;
  customer_id: string;
  product_id: string;
  price_id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
}

export interface DodoWebhookEvent {
  id: string;
  object: string;
  api_version: string;
  created: number;
  type: string;
  data: {
    object: any;
    previous_attributes?: any;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateUserRequest {
  email: string;
  full_name?: string;
  phone?: string;
  metadata?: Record<string, any>;
}

export interface CreateSubscriptionRequest {
  user_id: string;
  product_id: string;
  price_id: string;
  metadata?: Record<string, any>;
}

// Configuration Types
export interface Config {
  dodo: {
    apiKey: string;
    webhookSecret: string;
  };
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  server: {
    port: number;
    webhookPort: number;
    nodeEnv: string;
  };
}
