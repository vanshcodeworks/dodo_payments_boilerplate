import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';
import type {
  User,
  Customer,
  Subscription,
  PaymentEvent,
  CreateUserRequest,
  ApiResponse,
} from '../types/index.js';

export class SupabaseService {
  private client: SupabaseClient;
  private adminClient: SupabaseClient;

  constructor() {
    // Public client (with anon key)
    this.client = createClient(config.supabase.url, config.supabase.anonKey);
    
    // Admin client (with service role key) for server-side operations
    this.adminClient = createClient(config.supabase.url, config.supabase.serviceRoleKey);
  }

  // User operations
  async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await this.adminClient
        .from('users')
        .insert({
          email: userData.email,
          full_name: userData.full_name,
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error creating user:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: 'Failed to create user' };
    }
  }

  async getUserById(userId: string): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await this.adminClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching user:', error);
      return { success: false, error: 'Failed to fetch user' };
    }
  }

  async updateUserDodoCustomerId(userId: string, dodoCustomerId: string): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await this.adminClient
        .from('users')
        .update({ dodo_customer_id: dodoCustomerId })
        .eq('id', userId)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating user:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: 'Failed to update user' };
    }
  }

  // Customer operations
  async createCustomer(customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Customer>> {
    try {
      const { data, error } = await this.adminClient
        .from('customers')
        .insert(customerData)
        .select('*')
        .single();

      if (error) {
        console.error('Error creating customer:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating customer:', error);
      return { success: false, error: 'Failed to create customer' };
    }
  }

  async getCustomerByUserId(userId: string): Promise<ApiResponse<Customer>> {
    try {
      const { data, error } = await this.adminClient
        .from('customers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching customer:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching customer:', error);
      return { success: false, error: 'Failed to fetch customer' };
    }
  }

  async getCustomerByDodoId(dodoCustomerId: string): Promise<ApiResponse<Customer>> {
    try {
      const { data, error } = await this.adminClient
        .from('customers')
        .select('*')
        .eq('dodo_customer_id', dodoCustomerId)
        .single();

      if (error) {
        console.error('Error fetching customer by Dodo ID:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching customer by Dodo ID:', error);
      return { success: false, error: 'Failed to fetch customer' };
    }
  }

  // Subscription operations
  async createSubscription(subscriptionData: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Subscription>> {
    try {
      const { data, error } = await this.adminClient
        .from('subscriptions')
        .insert(subscriptionData)
        .select('*')
        .single();

      if (error) {
        console.error('Error creating subscription:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating subscription:', error);
      return { success: false, error: 'Failed to create subscription' };
    }
  }

  async updateSubscription(subscriptionId: string, updates: Partial<Subscription>): Promise<ApiResponse<Subscription>> {
    try {
      const { data, error } = await this.adminClient
        .from('subscriptions')
        .update(updates)
        .eq('dodo_subscription_id', subscriptionId)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating subscription:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating subscription:', error);
      return { success: false, error: 'Failed to update subscription' };
    }
  }

  async getSubscriptionsByUserId(userId: string): Promise<ApiResponse<Subscription[]>> {
    try {
      const { data, error } = await this.adminClient
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching subscriptions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return { success: false, error: 'Failed to fetch subscriptions' };
    }
  }

  // Payment events operations
  async createPaymentEvent(eventData: Omit<PaymentEvent, 'id' | 'created_at'>): Promise<ApiResponse<PaymentEvent>> {
    try {
      const { data, error } = await this.adminClient
        .from('payment_events')
        .insert(eventData)
        .select('*')
        .single();

      if (error) {
        console.error('Error creating payment event:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating payment event:', error);
      return { success: false, error: 'Failed to create payment event' };
    }
  }

  async markEventAsProcessed(eventId: string): Promise<ApiResponse<PaymentEvent>> {
    try {
      const { data, error } = await this.adminClient
        .from('payment_events')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
        })
        .eq('id', eventId)
        .select('*')
        .single();

      if (error) {
        console.error('Error marking event as processed:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error marking event as processed:', error);
      return { success: false, error: 'Failed to mark event as processed' };
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.adminClient
        .from('users')
        .select('count')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export const supabaseService = new SupabaseService();
