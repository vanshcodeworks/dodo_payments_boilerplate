import { config } from '../config/index.js';

// Helper function to get the correct base URL
function getBaseUrl(): string {
  if (config.dodo.apiKey.startsWith('test_')) {
    return 'https://test.dodopayments.com';
  } else if (config.dodo.apiKey.startsWith('live_')) {
    return 'https://live.dodopayments.com';
  } else {
    return 'https://test.dodopayments.com';
  }
}

export interface PaymentMethodTypes {
  credit?: boolean;
  debit?: boolean;
  upi_collect?: boolean;
  upi_intent?: boolean;
  apple_pay?: boolean;
  cashapp?: boolean;
  google_pay?: boolean;
  multibanco?: boolean;
  bancontact_card?: boolean;
  eps?: boolean;
  ideal?: boolean;
  przelewy24?: boolean;
  affirm?: boolean;
  klarna?: boolean;
  sepa?: boolean;
  ach?: boolean;
  amazon_pay?: boolean;
  afterpay_clearpay?: boolean;
}

export interface BillingAddress {
  street: string;
  city: string;
  state: string;
  zipcode: string | number; // Can be string or number
  country: string; // Two-letter ISO country code (ISO 3166-1 alpha-2)
}

export interface ProductCartItem {
  product_id: string;
  quantity: number;
  amount?: number; // Amount the customer pays if pay_what_you_want is enabled
}

export interface CreatePaymentData {
  customer: {
    customer_id?: string; // For existing customers
    name?: string; // For new customers
    email?: string; // For new customers
    phone_number?: string; // For new customers
  };
  product_cart: ProductCartItem[];
  billing: BillingAddress;
  allowed_payment_method_types?: string[]; // List of allowed payment methods
  billing_currency?: string; // Currency code
  discount_code?: string;
  metadata?: Record<string, string>;
  payment_link?: boolean; // Whether to generate a payment link
  return_url?: string; // Optional URL to redirect after payment
  show_saved_payment_methods?: boolean; // Display saved payment methods
  tax_id?: string; // Tax ID for B2B payments
}

export interface PaymentResponse {
  payment_id: string;
  total_amount: number; // Total amount in smallest currency unit (e.g. cents)
  client_secret: string; // Client secret used to load Dodo checkout SDK
  customer: {
    customer_id: string;
    name: string;
    email: string;
  };
  currency?: string;
  status?: 'succeeded' | 'failed' | 'cancelled' | 'processing' | 'requires_customer_action' | 
           'requires_merchant_action' | 'requires_payment_method' | 'requires_confirmation' | 
           'requires_capture' | 'partially_captured' | 'partially_captured_and_capturable';
  payment_method?: string | null;
  payment_method_type?: string | null;
  created_at?: string;
  subscription_id?: string | null;
  brand_id?: string;
  digital_products_delivered?: boolean;
  metadata: Record<string, string>;
  payment_link?: string | null; // Optional URL to a hosted payment page
  product_cart?: ProductCartItem[] | null;
  discount_id?: string | null;
  expires_on?: string | null; // Expiry timestamp of the payment link
}

export interface PaymentListResponse {
  items: PaymentResponse[];
}

/**
 * Create a one-time payment
 * Based on API: POST Create One Time Payment
 */
export async function createOneTimePayment(paymentData: CreatePaymentData): Promise<PaymentResponse> {
  try {
    const baseUrl = getBaseUrl();
    const endpoint = '/payments';
    
    console.log(`💳 Creating one-time payment at: ${baseUrl}${endpoint}`);
    console.log(`📦 Payment data:`, paymentData);
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.dodo.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    console.log(`📊 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorDetails;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = await response.text();
        }
      } else {
        errorDetails = await response.text();
      }
      
      console.error(`❌ Payment creation error:`, errorDetails);
      throw new Error(`Dodo API error (${response.status}): ${JSON.stringify(errorDetails)}`);
    }

    const payment = await response.json();
    console.log(`✅ Payment created successfully:`, payment);
    return payment;
  } catch (error) {
    console.error('Error creating one-time payment:', error);
    throw error;
  }
}

/**
 * Get payment details by payment ID
 * Based on API: GET Get Payment Detail
 */
export async function getPaymentDetails(paymentId: string): Promise<PaymentResponse> {
  try {
    const baseUrl = getBaseUrl();
    const endpoint = `/payments/${paymentId}`;
    
    console.log(`🔍 Fetching payment details from: ${baseUrl}${endpoint}`);
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.dodo.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`📊 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorDetails;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = await response.text();
        }
      } else {
        errorDetails = await response.text();
      }
      
      console.error(`❌ Error fetching payment details:`, errorDetails);
      throw new Error(`Dodo API error (${response.status}): ${JSON.stringify(errorDetails)}`);
    }

    const payment = await response.json();
    console.log(`✅ Payment details fetched:`, payment);
    return payment;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw error;
  }
}

export interface PaymentFilters {
  created_at_gte?: string; // Get events after this created time (ISO date-time)
  created_at_lte?: string; // Get events created before this time (ISO date-time)
  page_size?: number; // Page size default is 10 max is 100
  page_number?: number; // Page number default is 0
  customer_id?: string; // Filter by customer id
  subscription_id?: string; // Filter by subscription id
  status?: 'succeeded' | 'failed' | 'cancelled' | 'processing' | 'requires_customer_action' | 
           'requires_merchant_action' | 'requires_payment_method' | 'requires_confirmation' | 
           'requires_capture' | 'partially_captured' | 'partially_captured_and_capturable';
  brand_id?: string; // Filter by Brand id
}

/**
 * List all payments with optional filters
 * Based on API: GET List Payments
 */
export async function listPayments(filters?: PaymentFilters): Promise<PaymentResponse[]> {
  try {
    const baseUrl = getBaseUrl();
    let endpoint = '/payments';
    
    // Add query parameters if filters provided
    if (filters) {
      const params = new URLSearchParams();
      if (filters.created_at_gte) params.append('created_at_gte', filters.created_at_gte);
      if (filters.created_at_lte) params.append('created_at_lte', filters.created_at_lte);
      if (filters.page_size) params.append('page_size', filters.page_size.toString());
      if (filters.page_number) params.append('page_number', filters.page_number.toString());
      if (filters.customer_id) params.append('customer_id', filters.customer_id);
      if (filters.subscription_id) params.append('subscription_id', filters.subscription_id);
      if (filters.status) params.append('status', filters.status);
      if (filters.brand_id) params.append('brand_id', filters.brand_id);
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
    }
    
    console.log(`📋 Listing payments from: ${baseUrl}${endpoint}`);
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.dodo.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`📊 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorDetails;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = await response.text();
        }
      } else {
        errorDetails = await response.text();
      }
      
      console.error(`❌ Error listing payments:`, errorDetails);
      throw new Error(`Dodo API error (${response.status}): ${JSON.stringify(errorDetails)}`);
    }

    const result = await response.json();
    console.log(`✅ Payments fetched:`, result);
    
    // Handle different response formats
    return result.items || result.data || result || [];
  } catch (error) {
    console.error('Error listing payments:', error);
    throw error;
  }
}

/**
 * Get invoice details for a payment
 * Based on API: GET Get Invoice
 */
export async function getInvoice(paymentId: string): Promise<any> {
  try {
    const baseUrl = getBaseUrl();
    // Try different possible endpoint paths for invoice
    const possiblePaths = [
      `/payments/${paymentId}/invoice`,
      `/invoices/${paymentId}`,
      `/payments/${paymentId}/receipt`,
      `/invoice/${paymentId}`
    ];
    
    for (const endpoint of possiblePaths) {
      console.log(`📄 Trying invoice endpoint: ${baseUrl}${endpoint}`);
      
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.dodo.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`📊 Response status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const invoice = await response.json();
        console.log(`✅ Invoice fetched from ${endpoint}:`, invoice);
        return invoice;
      } else if (response.status !== 404) {
        // Not a 404, might be the right endpoint with different error
        let errorDetails;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          try {
            errorDetails = await response.json();
          } catch {
            errorDetails = await response.text();
          }
        } else {
          errorDetails = await response.text();
        }
        
        console.error(`❌ Error with invoice endpoint ${endpoint}:`, errorDetails);
        throw new Error(`Dodo API error (${response.status}): ${JSON.stringify(errorDetails)}`);
      }
    }
    
    // All endpoints returned 404
    throw new Error('Invoice endpoint not found - all paths returned 404');
  } catch (error) {
    console.error('Error fetching invoice:', error);
    throw error;
  }
}

/**
 * Get line items for a payment
 * Based on API: GET Retrieve Line Items
 */
export async function getLineItems(paymentId: string): Promise<any[]> {
  try {
    const baseUrl = getBaseUrl();
    const endpoint = `/payments/${paymentId}/line_items`;
    
    console.log(`📋 Fetching line items from: ${baseUrl}${endpoint}`);
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.dodo.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`📊 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorDetails;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = await response.text();
        }
      } else {
        errorDetails = await response.text();
      }
      
      console.error(`❌ Error fetching line items:`, errorDetails);
      throw new Error(`Dodo API error (${response.status}): ${JSON.stringify(errorDetails)}`);
    }

    const result = await response.json();
    console.log(`✅ Line items fetched:`, result);
    
    // Handle different response formats
    return result.items || result.data || result || [];
  } catch (error) {
    console.error('Error fetching line items:', error);
    throw error;
  }
}
