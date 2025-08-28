import { config } from '../config/index.js';

// Subscription types and interfaces
export interface CreateSubscriptionData {
  product_id: string;
  quantity: number;
  customer: {
    customer_id: string;
  } | {
    name: string;
    email: string;
    phone_number?: string | null;
  };
  billing: {
    country: string;
    state: string;
    city: string;
    street: string;
    zipcode: string;
  };
  addons?: {
    addon_id: string;
    quantity: number;
  }[];
  allowed_payment_method_types?: string[];
  billing_currency?: string | null;
  discount_code?: string | null;
  metadata?: Record<string, string>;
  on_demand?: {
    mandate_only: boolean;
    adaptive_currency_fees_inclusive?: boolean | null;
    product_currency?: string | null;
    product_description?: string | null;
    product_price?: number | null;
  } | null;
  payment_link?: boolean | null;
  return_url?: string | null;
  show_saved_payment_methods?: boolean;
  tax_id?: string | null;
  trial_period_days?: number | null;
}

export interface SubscriptionResponse {
  subscription_id: string;
  recurring_pre_tax_amount: number;
  tax_inclusive: boolean;
  currency: string;
  status: 'pending' | 'active' | 'on_hold' | 'cancelled' | 'failed' | 'expired';
  created_at: string;
  product_id: string;
  quantity: number;
  trial_period_days: number;
  subscription_period_interval: 'Day' | 'Week' | 'Month' | 'Year';
  payment_frequency_interval: 'Day' | 'Week' | 'Month' | 'Year';
  subscription_period_count: number;
  payment_frequency_count: number;
  next_billing_date: string;
  previous_billing_date: string;
  customer: {
    customer_id: string;
    name: string;
    email: string;
  };
  metadata: Record<string, string>;
  cancel_at_next_billing_date: boolean;
  billing: {
    country: string;
    state: string;
    city: string;
    street: string;
    zipcode: string;
  };
  on_demand: boolean;
  addons: {
    addon_id: string;
    quantity: number;
  }[];
  cancelled_at?: string | null;
  discount_cycles_remaining?: number | null;
  discount_id?: string | null;
  expires_at?: string | null;
}

export interface CreateSubscriptionResponse {
  subscription_id: string;
  recurring_pre_tax_amount: number;
  customer: {
    customer_id: string;
    name: string;
    email: string;
  };
  metadata: Record<string, string>;
  addons: {
    addon_id: string;
    quantity: number;
  }[];
  payment_id: string;
  client_secret?: string | null;
  discount_id?: string | null;
  expires_on?: string | null;
  payment_link?: string | null;
}

export interface SubscriptionFilters {
  created_at_gte?: string; // ISO date-time
  created_at_lte?: string; // ISO date-time
  page_size?: number; // max 100, default 10
  page_number?: number; // default 0
  customer_id?: string;
  status?: 'pending' | 'active' | 'on_hold' | 'cancelled' | 'failed' | 'expired';
  brand_id?: string;
}

export interface CreateProductData {
  name?: string;
  description?: string;
  price: {
    type: 'one_time_price';
    price: number; // Amount in smallest currency unit (cents)
    currency: string;
    discount: number; // Required by API
    purchasing_power_parity: boolean; // Required by API
    tax_inclusive: boolean; // Required by API
    pay_what_you_want: boolean; // Required by API
    suggested_price?: number;
  } | {
    type: 'recurring_price';
    price: number; // Amount in smallest currency unit (cents)
    currency: string;
    discount: number; // Required by API
    purchasing_power_parity: boolean; // Required by API
    tax_inclusive: boolean; // Required by API
    pay_what_you_want: boolean; // Required by API
    suggested_price?: number;
    payment_frequency_count: number; // Required for recurring
    payment_frequency_interval: 'Day' | 'Week' | 'Month' | 'Year'; // Required for recurring
    subscription_period_count: number; // Required for recurring
    subscription_period_interval: 'Day' | 'Week' | 'Month' | 'Year'; // Required for recurring
  };
  tax_category: 'digital_products' | 'saas' | 'e_book' | 'edtech';
  metadata?: Record<string, string>;
  license_key_enabled?: boolean;
}

export interface ProductResponse {
  product_id: string;
  business_id: string;
  brand_id: string;
  name?: string;
  description?: string;
  image: string | null;
  created_at: string;
  updated_at: string;
  is_recurring: boolean;
  tax_category: string;
  price: {
    type: 'one_time_price' | 'recurring_price';
    price: number;
    currency: string;
    tax_inclusive: boolean;
    discount: number;
    purchasing_power_parity: boolean;
    pay_what_you_want: boolean;
    suggested_price: number | null;
  };
  license_key_enabled: boolean;
  license_key_activations_limit: number | null;
  license_key_duration: number | null;
  license_key_activation_message: string | null;
  addons: any | null;
  digital_product_delivery: any | null;
  metadata: Record<string, string>;
}

// Helper function to get the correct base URL
function getBaseUrl(): string {
  if (config.dodo.apiKey.startsWith('test_')) {
    return 'https://test.dodopayments.com';
  } else if (config.dodo.apiKey.startsWith('live_')) {
    return 'https://live.dodopayments.com';
  } else {
    // Default to test for unknown key formats
    return 'https://test.dodopayments.com';
  }
}

export async function createSubscription(subscriptionData: CreateSubscriptionData): Promise<CreateSubscriptionResponse> {
  try {
    const baseUrl = getBaseUrl();
    const endpoint = '/subscriptions';
    
    console.log(`� Creating subscription at: ${baseUrl}${endpoint}`);
    console.log(`📦 Subscription data:`, subscriptionData);
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.dodo.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData),
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
      
      console.error(`❌ Subscription creation error:`, errorDetails);
      throw new Error(`Dodo API error (${response.status}): ${JSON.stringify(errorDetails)}`);
    }

    const subscription = await response.json();
    console.log(`✅ Subscription created successfully:`, subscription);
    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

// Alias for backward compatibility
export async function getSubscription(subscriptionId: string): Promise<SubscriptionResponse> {
  return getSubscriptionDetails(subscriptionId);
}

export async function cancelSubscription(subscriptionId: string): Promise<any> {
  try {
    const response = await fetch(`${getBaseUrl()}/v1/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.dodo.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Dodo API error: ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

// New interfaces for checkout sessions
export interface CreateCheckoutSessionData {
  product_cart: {
    product_id: string;
    quantity: number;
    amount?: number | null; // For pay_what_you_want products
    addons?: {
      addon_id: string;
      quantity: number;
    }[] | null;
  }[];
  allowed_payment_method_types?: ('credit' | 'debit' | 'upi_collect' | 'upi_intent' | 'apple_pay' | 'cashapp' | 'google_pay' | 'multibanco' | 'bancontact_card' | 'eps' | 'ideal' | 'przelewy24' | 'affirm' | 'klarna' | 'sepa' | 'ach' | 'amazon_pay' | 'afterpay_clearpay')[] | null;
  billing_address?: {
    country: string; // ISO country code alpha2
    city?: string | null;
    state?: string | null;
    street?: string | null;
    zipcode?: string | null;
  } | null;
  billing_currency?: string | null;
  confirm?: boolean;
  customer?: {
    customer_id: string;
  } | {
    name: string;
    email: string;
    phone_number?: string | null;
  } | null;
  customization?: {
    show_on_demand_tag?: boolean;
    show_order_details?: boolean;
    theme?: 'dark' | 'light' | 'system';
  };
  discount_code?: string | null;
  feature_flags?: {
    allow_currency_selection?: boolean;
    allow_discount_code?: boolean;
    allow_phone_number_collection?: boolean;
    allow_tax_id?: boolean;
    always_create_new_customer?: boolean;
  };
  metadata?: Record<string, string> | null;
  return_url?: string | null;
  show_saved_payment_methods?: boolean;
  subscription_data?: {
    trial_period_days?: number | null;
    on_demand?: {
      mandate_only: boolean;
      adaptive_currency_fees_inclusive?: boolean | null;
      product_currency?: string | null;
      product_description?: string | null;
      product_price?: number | null;
    } | null;
  } | null;
}

export interface CheckoutSessionResponse {
  session_id: string;
  checkout_url: string;
}

export async function createCheckoutSession(data: CreateCheckoutSessionData): Promise<CheckoutSessionResponse> {
  try {
    const baseUrl = getBaseUrl();
    const endpoint = '/checkouts';  // Correct endpoint from OpenAPI spec
    
    console.log(`🔍 Creating checkout session at: ${baseUrl}${endpoint}`);
    
    // Ensure required fields and defaults
    const body: CreateCheckoutSessionData = {
      ...data,
      confirm: data.confirm !== undefined ? data.confirm : true,
      allowed_payment_method_types: data.allowed_payment_method_types || ['credit', 'debit'],
      customization: {
        show_on_demand_tag: true,
        show_order_details: true,
        theme: 'system',
        ...data.customization
      },
      feature_flags: {
        allow_currency_selection: true,
        allow_discount_code: true,
        allow_phone_number_collection: true,
        allow_tax_id: true,
        always_create_new_customer: false,
        ...data.feature_flags
      },
      show_saved_payment_methods: data.show_saved_payment_methods !== undefined ? data.show_saved_payment_methods : true,
      return_url: data.return_url || 'https://your-domain.com/checkout/success',
      metadata: data.metadata || { source: 'cli_test' }
    };

    console.log(`📦 Request body:`, body);

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.dodo.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
      
      console.error(`❌ Checkout session error:`, errorDetails);
      throw new Error(`Dodo API error (${response.status}): ${JSON.stringify(errorDetails)}`);
    }

    const sessionData: CheckoutSessionResponse = await response.json();
    console.log(`✅ Checkout session created:`, sessionData);
    return sessionData;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function listProducts(): Promise<any[]> {
  try {
    // Based on official docs: GET List Products
    const baseUrl = 'https://test.dodopayments.com';
    const endpoint = '/products';
    
    console.log(`🔍 Fetching products from: ${baseUrl}${endpoint}`);
    
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
      
      console.error(`❌ Products list error:`, errorDetails);
      throw new Error(`Dodo API error (${response.status}): ${JSON.stringify(errorDetails)}`);
    }

    const result = await response.json();
    console.log(`✅ Products fetched:`, result);
    // The API returns { items: [...] } format
    return result.items || result.data || result || [];
  } catch (error) {
    console.error('Error listing products:', error);
    throw error;
  }
}

export async function listPrices(productId?: string): Promise<any[]> {
  try {
    // Note: Based on the API response, pricing seems to be embedded in products
    // Let's get products and extract pricing information
    console.log(`🏷️ Extracting pricing from products...`);
    
    const products = await listProducts();
    
    if (productId) {
      // Filter by specific product
      const product = products.find((p: any) => p.product_id === productId);
      if (product) {
        console.log(`✅ Found pricing for product ${productId}:`, {
          product_id: product.product_id,
          price: product.price,
          currency: product.currency,
          is_recurring: product.is_recurring,
          price_detail: product.price_detail
        });
        
        return [{
          product_id: product.product_id,
          price: product.price,
          currency: product.currency,
          is_recurring: product.is_recurring,
          price_detail: product.price_detail
        }];
      } else {
        console.log(`❌ Product ${productId} not found`);
        return [];
      }
    } else {
      // Return pricing for all products
      const prices = products.map((product: any) => ({
        product_id: product.product_id,
        price: product.price,
        currency: product.currency,
        is_recurring: product.is_recurring,
        price_detail: product.price_detail
      }));
      
      console.log(`✅ Extracted pricing for ${prices.length} products:`, prices);
      return prices;
    }
  } catch (error) {
    console.error('Error listing prices:', error);
    throw error;
  }
}

/**
 * Create a new product
 * Based on API: POST Create Product
 */
export async function createProduct(productData: CreateProductData): Promise<ProductResponse> {
  try {
    const baseUrl = getBaseUrl();
    const endpoint = '/products';
    
    console.log(`📦 Creating product at: ${baseUrl}${endpoint}`);
    console.log(`📋 Product data:`, productData);
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.dodo.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
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
      
      console.error(`❌ Product creation error:`, errorDetails);
      throw new Error(`Dodo API error (${response.status}): ${JSON.stringify(errorDetails)}`);
    }

    const product = await response.json();
    console.log(`✅ Product created successfully:`, product);
    return product;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

/**
 * List subscriptions with filtering
 * Based on API: GET /subscriptions
 */
export async function listSubscriptions(filters: SubscriptionFilters = {}): Promise<SubscriptionResponse[]> {
  try {
    const baseUrl = getBaseUrl();
    const endpoint = '/subscriptions';
    
    // Build query parameters
    const params = new URLSearchParams();
    if (filters.created_at_gte) params.append('created_at_gte', filters.created_at_gte);
    if (filters.created_at_lte) params.append('created_at_lte', filters.created_at_lte);
    if (filters.page_size !== undefined) params.append('page_size', filters.page_size.toString());
    if (filters.page_number !== undefined) params.append('page_number', filters.page_number.toString());
    if (filters.customer_id) params.append('customer_id', filters.customer_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.brand_id) params.append('brand_id', filters.brand_id);
    
    const queryString = params.toString();
    const url = queryString ? `${baseUrl}${endpoint}?${queryString}` : `${baseUrl}${endpoint}`;
    
    console.log(`🔍 Fetching subscriptions from: ${url}`);
    
    const response = await fetch(url, {
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
      
      console.error(`❌ Error fetching subscriptions:`, errorDetails);
      throw new Error(`Dodo API error (${response.status}): ${JSON.stringify(errorDetails)}`);
    }

    const result = await response.json();
    console.log(`✅ Subscriptions fetched:`, result);
    
    return result.items || [];
  } catch (error) {
    console.error('Error listing subscriptions:', error);
    throw error;
  }
}

/**
 * Get subscription details by ID
 * Based on API: GET /subscriptions/{subscription_id}
 */
export async function getSubscriptionDetails(subscriptionId: string): Promise<SubscriptionResponse> {
  try {
    const baseUrl = getBaseUrl();
    const endpoint = `/subscriptions/${subscriptionId}`;
    
    console.log(`🔍 Fetching subscription details from: ${baseUrl}${endpoint}`);
    
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
      
      console.error(`❌ Error fetching subscription details:`, errorDetails);
      throw new Error(`Dodo API error (${response.status}): ${JSON.stringify(errorDetails)}`);
    }

    const subscription = await response.json();
    console.log(`✅ Subscription details fetched:`, subscription);
    return subscription;
  } catch (error) {
    console.error('Error getting subscription details:', error);
    throw error;
  }
}
