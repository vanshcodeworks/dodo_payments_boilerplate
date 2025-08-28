import { DodoPayments } from 'dodopayments';
import { config } from '../config/index.js';
import type {
  DodoCustomer,
  DodoSubscription,
  ApiResponse,
  CreateUserRequest,
  CreateSubscriptionRequest,
} from '../types/index.js';

export class DodoPaymentsService {
  private dodo: any;

  constructor() {
    // Initialize DodoPayments with just the API key as a string
    // Based on the module inspection, it appears to accept just the API key directly
    try {
      this.dodo = new (DodoPayments as any)(config.dodo.apiKey);
    } catch (error) {
      // Fallback: try with options object
      this.dodo = new (DodoPayments as any)({ apiKey: config.dodo.apiKey });
    }
  }

  // Customer operations
  async createCustomer(userData: CreateUserRequest): Promise<ApiResponse<DodoCustomer>> {
    try {
      const customerData = {
        email: userData.email,
        name: userData.full_name || userData.email.split('@')[0],
        metadata: userData.metadata || {},
      };

      const customer = await this.dodo.customers.create(customerData);
      
      return {
        success: true,
        data: {
          customer_id: customer.customer_id || customer.id || '',
          email: customer.email || userData.email,
          name: customer.name || customer.full_name || '',
          phone: customer.phone || '',
          metadata: customer.metadata || {},
        },
      };
    } catch (error: any) {
      console.error('Error creating Dodo customer:', error);
      return {
        success: false,
        error: error.message || 'Failed to create customer in Dodo Payments',
      };
    }
  }

  async getCustomer(customerId: string): Promise<ApiResponse<DodoCustomer>> {
    try {
      const customer = await this.dodo.customers.retrieve(customerId);
      
      return {
        success: true,
        data: {
          customer_id: customer.customer_id || customer.id || customerId,
          email: customer.email || '',
          name: customer.name || customer.full_name || '',
          phone: customer.phone || '',
          metadata: customer.metadata || {},
        },
      };
    } catch (error: any) {
      console.error('Error fetching Dodo customer:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch customer from Dodo Payments',
      };
    }
  }

  async updateCustomer(customerId: string, updateData: Partial<DodoCustomer>): Promise<ApiResponse<DodoCustomer>> {
    try {
      const updateParams: any = {};
      if (updateData.name) updateParams.name = updateData.name;
      if (updateData.metadata) updateParams.metadata = updateData.metadata;
      
      const customer = await this.dodo.customers.update(customerId, updateParams);
      
      return {
        success: true,
        data: {
          customer_id: customer.customer_id || customer.id || customerId,
          email: customer.email || '',
          name: customer.name || customer.full_name || '',
          phone: customer.phone || '',
          metadata: customer.metadata || {},
        },
      };
    } catch (error: any) {
      console.error('Error updating Dodo customer:', error);
      return {
        success: false,
        error: error.message || 'Failed to update customer in Dodo Payments',
      };
    }
  }

  // Subscription operations
  async createSubscription(subscriptionData: CreateSubscriptionRequest & { customer_id: string }): Promise<ApiResponse<DodoSubscription>> {
    try {
      const subData = {
        customer: subscriptionData.customer_id,
        price: subscriptionData.price_id,
        metadata: subscriptionData.metadata || {},
      };
      
      const subscription = await this.dodo.subscriptions.create(subData);
      
      return {
        success: true,
        data: {
          subscription_id: subscription.subscription_id || subscription.id || '',
          customer_id: subscription.customer_id || subscription.customer || subscriptionData.customer_id,
          product_id: subscription.product_id || subscriptionData.product_id || '',
          price_id: subscription.price_id || subscriptionData.price_id,
          status: subscription.status || 'active',
          current_period_start: subscription.current_period_start || Math.floor(Date.now() / 1000),
          current_period_end: subscription.current_period_end || Math.floor(Date.now() / 1000) + 2592000,
          cancel_at_period_end: subscription.cancel_at_period_end || false,
        },
      };
    } catch (error: any) {
      console.error('Error creating Dodo subscription:', error);
      return {
        success: false,
        error: error.message || 'Failed to create subscription in Dodo Payments',
      };
    }
  }

  async getSubscription(subscriptionId: string): Promise<ApiResponse<DodoSubscription>> {
    try {
      const subscription = await this.dodo.subscriptions.retrieve(subscriptionId);
      
      return {
        success: true,
        data: {
          subscription_id: subscription.subscription_id || subscription.id || subscriptionId,
          customer_id: subscription.customer_id || subscription.customer || '',
          product_id: subscription.product_id || '',
          price_id: subscription.price_id || '',
          status: subscription.status || 'active',
          current_period_start: subscription.current_period_start || Math.floor(Date.now() / 1000),
          current_period_end: subscription.current_period_end || Math.floor(Date.now() / 1000) + 2592000,
          cancel_at_period_end: subscription.cancel_at_period_end || false,
        },
      };
    } catch (error: any) {
      console.error('Error fetching Dodo subscription:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch subscription from Dodo Payments',
      };
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<ApiResponse<DodoSubscription>> {
    try {
      const subscription = await this.dodo.subscriptions.cancel(subscriptionId);
      
      return {
        success: true,
        data: {
          subscription_id: subscription.subscription_id || subscription.id || subscriptionId,
          customer_id: subscription.customer_id || subscription.customer || '',
          product_id: subscription.product_id || '',
          price_id: subscription.price_id || '',
          status: subscription.status || 'canceled',
          current_period_start: subscription.current_period_start || Math.floor(Date.now() / 1000),
          current_period_end: subscription.current_period_end || Math.floor(Date.now() / 1000) + 2592000,
          cancel_at_period_end: subscription.cancel_at_period_end || true,
        },
      };
    } catch (error: any) {
      console.error('Error canceling Dodo subscription:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel subscription in Dodo Payments',
      };
    }
  }

  // Product and Price operations
  async listProducts(): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.dodo.products.list();
      const products = response.data || response || [];
      return { success: true, data: products };
    } catch (error: any) {
      console.error('Error listing Dodo products:', error);
      return {
        success: false,
        error: error.message || 'Failed to list products from Dodo Payments',
      };
    }
  }

  async listPrices(productId?: string): Promise<ApiResponse<any[]>> {
    try {
      const params = productId ? { product: productId } : {};
      const response = await this.dodo.prices.list(params);
      const prices = response.data || response || [];
      return { success: true, data: prices };
    } catch (error: any) {
      console.error('Error listing Dodo prices:', error);
      return {
        success: false,
        error: error.message || 'Failed to list prices from Dodo Payments',
      };
    }
  }

  // Payment operations
  async createPaymentIntent(amount: number, currency = 'USD', customerId?: string): Promise<ApiResponse<any>> {
    try {
      const params: any = {
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
      };
      
      if (customerId) {
        params.customer = customerId;
      }
      
      const paymentIntent = await this.dodo.paymentIntents.create(params);
      
      return { success: true, data: paymentIntent };
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      return {
        success: false,
        error: error.message || 'Failed to create payment intent',
      };
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      // Try to list products as a health check
      const response = await this.dodo.products.list({ limit: 1 });
      return true;
    } catch (error) {
      console.error('Dodo Payments health check failed:', error);
      return false;
    }
  }
}

export const dodoPaymentsService = new DodoPaymentsService();
