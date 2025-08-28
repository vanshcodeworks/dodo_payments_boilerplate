import { config } from './config/index.js';
import { signup } from './auth/signup.js';
import { createCheckoutSession, listProducts, listPrices, createProduct, createSubscription, listSubscriptions, getSubscriptionDetails } from './payments/subscription.js';
import { createOneTimePayment, getPaymentDetails, listPayments, getInvoice, getLineItems } from './payments/payment.js';
import { createCustomer } from './payments/customer.js';
import { handleWebhook } from './webhooks/handler.js';
import { createWebhook, listWebhooks, getWebhookDetails, getWebhookSecret, type EventType } from './webhooks/webhook-management.js';

// Simple CLI interface for testing
async function main() {
  try {
    console.log('🚀 Dodo Payments + Supabase Boilerplate');
    console.log('=====================================');
    
    const command = process.argv[2];
    
    switch (command) {
      case 'signup':
        await testSignup();
        break;
      case 'products':
        await testProducts();
        break;
      case 'create-product':
        await testCreateProduct();
        break;
      case 'subscriptions':
        await testListSubscriptions();
        break;
      case 'create-subscription':
        await testCreateSubscription();
        break;
      case 'subscription':
        await testGetSubscription();
        break;
      case 'payment':
        await testPayment();
        break;
      case 'payments':
        await testListPayments();
        break;
      case 'payments-filter':
        await testAdvancedPaymentFiltering();
        break;
      case 'checkout':
        await testCheckout();
        break;
      case 'webhook':
        await testWebhook();
        break;
      case 'webhooks':
        await testListWebhooks();
        break;
      case 'create-webhook':
        await testCreateWebhook();
        break;
      case 'webhook-details':
        await testGetWebhookDetails();
        break;
      case 'webhook-secret':
        await testGetWebhookSecret();
        break;
      case 'health':
        await healthCheck();
        break;
      default:
        console.log('Available commands:');
        console.log('  npm run dev signup         - Test user signup + customer creation');
        console.log('  npm run dev products       - List available products and prices');
        console.log('  npm run dev create-product - Create a new product');
        console.log('  npm run dev subscriptions  - List subscriptions with filtering');
        console.log('  npm run dev create-subscription - Create a new subscription');
        console.log('  npm run dev subscription   - Get subscription details');
        console.log('  npm run dev payment        - Test one-time payment creation');
        console.log('  npm run dev payments       - List payments and test invoice/line items');
        console.log('  npm run dev payments-filter - Demo advanced payment filtering');
        console.log('  npm run dev checkout       - Create test checkout session');
        console.log('  npm run dev webhook        - Test webhook handler');
        console.log('  npm run dev webhooks       - List all webhooks');
        console.log('  npm run dev create-webhook - Create a new webhook');
        console.log('  npm run dev webhook-details - Get webhook details');
        console.log('  npm run dev webhook-secret - Get webhook signing secret');
        console.log('  npm run dev health         - Check configuration');
    }
  } catch (error) {
    console.error('❌ CLI Error:', error);
    process.exit(1);
  }
}

async function testSignup() {
  try {
    console.log('\n📝 Testing signup process...');
    
    const email = `test-${Date.now()}@example.com`;
    console.log(`🔄 Creating user: ${email}`);
    
    const result = await signup({
      email,
      fullName: 'Test User',
      metadata: { source: 'cli-test' },
    });
    
    if (result.success) {
      console.log('✅ Signup successful!');
      console.log('📊 Results:');
      console.log(`   User ID: ${result.data?.user.id}`);
      console.log(`   Email: ${result.data?.user.email}`);
      console.log(`   Dodo Customer ID: ${result.data?.dodoCustomerId}`);
      console.log(`   Customer Record ID: ${result.data?.customer.id}`);
    } else {
      console.log('❌ Signup failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Signup test error:', error);
    throw error;
  }
}

async function testProducts() {
  console.log('\n🛍️ Fetching products and prices...');
  
  try {
    const products = await listProducts();
    console.log('Products:', products);
    
    const prices = await listPrices();
    console.log('Prices:', prices);
  } catch (error) {
    console.error('❌ Error fetching products:', error);
  }
}

async function testCreateProduct() {
  console.log('\n📦 Creating a new product...');
  
  try {
    const productData = {
      name: 'Test Product - CLI',
      description: 'A test product created via CLI for demonstration',
      price: {
        type: 'one_time_price' as const,
        price: 2999, // $29.99 USD (in cents)
        currency: 'USD',
        discount: 0, // No discount for this test product
        purchasing_power_parity: false, // Required field
        tax_inclusive: false,
        pay_what_you_want: false,
      },
      tax_category: 'digital_products' as const,
      metadata: {
        source: 'cli_test',
        created_by: 'dodo_boilerplate',
        test: 'true'
      },
      license_key_enabled: false,
    };

    console.log('📋 Creating product with data:', productData);
    
    const newProduct = await createProduct(productData);
    console.log('✅ Product created successfully!');
    console.log('📦 Product details:', newProduct);
    
    console.log('\n💡 You can now use this product ID in payments:');
    console.log(`   Product ID: ${newProduct.product_id}`);
    console.log(`   Price: ${newProduct.price.price / 100} ${newProduct.price.currency}`);
    
  } catch (error) {
    console.error('❌ Error creating product:', error);
  }
}

async function testListSubscriptions() {
  console.log('\n📋 Listing subscriptions...');
  
  try {
    // Test basic listing
    const subscriptions = await listSubscriptions();
    console.log(`📊 Found ${subscriptions.length} subscriptions`);
    
    if (subscriptions.length > 0) {
      console.log('\n📋 Recent subscriptions:');
      subscriptions.slice(0, 3).forEach((sub, index) => {
        console.log(`  ${index + 1}. ${sub.subscription_id}`);
        console.log(`     Status: ${sub.status}`);
        console.log(`     Product: ${sub.product_id}`);
        console.log(`     Customer: ${sub.customer.name} (${sub.customer.email})`);
        console.log(`     Amount: ${sub.recurring_pre_tax_amount / 100} ${sub.currency}`);
        console.log(`     Created: ${new Date(sub.created_at).toLocaleDateString()}`);
        console.log('');
      });
    }
    
    // Test filtered listing
    console.log('\n🔍 Testing filtered listing (active subscriptions only)...');
    const activeSubscriptions = await listSubscriptions({ 
      status: 'active',
      page_size: 5 
    });
    console.log(`📊 Found ${activeSubscriptions.length} active subscriptions`);
    
  } catch (error) {
    console.error('❌ Error listing subscriptions:', error);
  }
}

async function testCreateSubscription() {
  console.log('\n🔄 Creating a new subscription...');
  
  try {
    // First create a recurring product for subscription
    console.log('📦 Creating recurring product for subscription...');
    const recurringProductData = {
      name: 'Monthly Subscription - CLI',
      description: 'A monthly subscription product for testing',
      price: {
        type: 'recurring_price' as const,
        price: 1999, // $19.99 USD (in cents)
        currency: 'USD',
        discount: 0,
        purchasing_power_parity: false,
        tax_inclusive: false,
        pay_what_you_want: false,
        payment_frequency_count: 1, // Bill every 1 month
        payment_frequency_interval: 'Month' as const,
        subscription_period_count: 1, // Duration of 1 month per period
        subscription_period_interval: 'Month' as const,
      },
      tax_category: 'saas' as const,
      metadata: {
        source: 'cli_test',
        created_by: 'dodo_boilerplate',
        test: 'true',
        subscription: 'monthly'
      },
      license_key_enabled: false,
    };
    
    const recurringProduct = await createProduct(recurringProductData);
    console.log(`✅ Recurring product created: ${recurringProduct.product_id}`);
    
    // Create a test customer first
    console.log('👤 Creating test customer...');
    const testEmail = 'subscription@example.com';
    const testName = 'Subscription Customer';
    const testCustomerId = await createCustomer('test-sub-user-id', testEmail, testName);
    console.log(`✅ Customer created: ${testCustomerId}`);
    
    // Create subscription data
    const subscriptionData = {
      product_id: recurringProduct.product_id,
      quantity: 1,
      customer: {
        customer_id: testCustomerId
      },
      billing: {
        country: 'US',
        state: 'CA',
        city: 'San Francisco',
        street: '123 Subscription St',
        zipcode: '94105'
      },
      metadata: {
        test_subscription: 'true',
        source: 'cli_test'
      },
      payment_link: false,
      show_saved_payment_methods: false,
    };
    
    console.log('🔄 Creating subscription...');
    const subscription = await createSubscription(subscriptionData);
    console.log('✅ Subscription created successfully!');
    console.log('📋 Subscription details:', subscription);
    
    console.log('\n💡 Subscription summary:');
    console.log(`   Subscription ID: ${subscription.subscription_id}`);
    console.log(`   Payment ID: ${subscription.payment_id}`);
    console.log(`   Amount: ${subscription.recurring_pre_tax_amount / 100} (recurring)`);
    console.log(`   Customer: ${subscription.customer.name}`);
    
  } catch (error) {
    console.error('❌ Error creating subscription:', error);
  }
}

async function testGetSubscription() {
  console.log('\n🔍 Getting subscription details...');
  
  try {
    // First, list subscriptions to get an ID
    const subscriptions = await listSubscriptions({ page_size: 1 });
    
    if (subscriptions.length === 0) {
      console.log('❌ No subscriptions found. Create a subscription first.');
      return;
    }
    
    const subscriptionId = subscriptions[0]?.subscription_id;
    if (!subscriptionId) {
      console.log('❌ No valid subscription found.');
      return;
    }
    
    console.log(`📋 Fetching details for subscription: ${subscriptionId}`);
    
    const subscription = await getSubscriptionDetails(subscriptionId);
    console.log('✅ Subscription details fetched!');
    console.log('📋 Subscription details:', subscription);
    
    console.log('\n💡 Subscription summary:');
    console.log(`   ID: ${subscription.subscription_id}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Product: ${subscription.product_id}`);
    console.log(`   Customer: ${subscription.customer.name} (${subscription.customer.email})`);
    console.log(`   Amount: ${subscription.recurring_pre_tax_amount / 100} ${subscription.currency}`);
    console.log(`   Created: ${new Date(subscription.created_at).toLocaleDateString()}`);
    console.log(`   Next billing: ${new Date(subscription.next_billing_date).toLocaleDateString()}`);
    
  } catch (error) {
    console.error('❌ Error getting subscription details:', error);
  }
}

async function testCheckout() {
  console.log('\n💳 Creating test checkout session...');
  
  try {
    // First, let's get the first available product to use in checkout
    console.log('🔍 Getting available products...');
    const products = await listProducts();
    
    if (products.length === 0) {
      console.log('⚠️  No products found. Creating a test product first...');
      
      // Create a test product for checkout
      const testProduct = await createProduct({
        name: 'Test Checkout Product',
        description: 'A test product for checkout session testing',
        tax_category: 'saas',
        price: {
          type: 'one_time_price',
          price: 2999, // $29.99
          currency: 'USD',
          discount: 0,
          purchasing_power_parity: false,
          tax_inclusive: false,
          pay_what_you_want: false
        }
      });
      
      console.log('✅ Test product created:', testProduct.product_id);
      
      // Use the newly created product
      const checkoutData = await createCheckoutSession({
        product_cart: [
          {
            product_id: testProduct.product_id,
            quantity: 1
          }
        ],
        customer: {
          name: 'Test Customer',
          email: 'test@example.com'
        },
        billing_address: {
          country: 'US',
          state: 'CA',
          city: 'San Francisco',
          street: '123 Test St',
          zipcode: '94105'
        },
        return_url: 'https://your-domain.com/checkout/success',
        metadata: {
          source: 'cli_test',
          test_checkout: 'true'
        }
      });
      
      console.log('✅ Checkout session created!');
      console.log('   Session ID:', checkoutData.session_id);
      console.log('   Checkout URL:', checkoutData.checkout_url);
      
    } else {
      console.log(`✅ Found ${products.length} products, using the first one`);
      const product = products[0];
      console.log(`📦 Using product: ${product.name} (${product.product_id})`);
      
      const checkoutData = await createCheckoutSession({
        product_cart: [
          {
            product_id: product.product_id,
            quantity: 1
          }
        ],
        customer: {
          name: 'Test Customer',
          email: 'test@example.com'
        },
        billing_address: {
          country: 'US',
          state: 'CA',
          city: 'San Francisco', 
          street: '123 Test St',
          zipcode: '94105'
        },
        return_url: 'https://your-domain.com/checkout/success',
        metadata: {
          source: 'cli_test',
          test_checkout: 'true'
        }
      });
      
      console.log('✅ Checkout session created!');
      console.log('   Session ID:', checkoutData.session_id);
      console.log('   Checkout URL:', checkoutData.checkout_url);
    }
    
  } catch (error) {
    console.error('❌ Error creating checkout:', error);
  }
}

async function testWebhook() {
  console.log('\n🎣 Testing webhook handler...');
  
  const mockEvent = {
    id: 'evt_test_123',
    type: 'subscription.active',
    data: {
      object: {
        id: 'sub_test_123',
        customer: 'cus_test_123',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days
      },
    },
  };
  
  const result = await handleWebhook(JSON.stringify(mockEvent));
  
  if (result.success) {
    console.log('✅ Webhook processed successfully');
  } else {
    console.log('❌ Webhook failed:', result.error);
  }
}

async function healthCheck() {
  try {
    console.log('\n🏥 Health check...');
    console.log('📋 Configuration Status:');
    console.log(`   Config loaded: ${!!config ? '✅' : '❌'}`);
    console.log(`   Dodo API Key: ${config.dodo.apiKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Dodo Webhook Secret: ${config.dodo.webhookSecret ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Supabase URL: ${config.supabase.url ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Supabase Service Key: ${config.supabase.serviceRoleKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Server Port: ${config.server.port}`);
    console.log(`   Webhook Port: ${config.server.webhookPort}`);
    console.log(`   Environment: ${config.server.nodeEnv}`);
    console.log('✅ Health check completed');
  } catch (error) {
    console.error('❌ Health check failed:', error);
    throw error;
  }
}

async function testPayment() {
  try {
    console.log('\n💳 Testing payment creation...');
    
    // First, get available products
    const products = await listProducts();
    if (products.length === 0) {
      console.log('❌ No products found. Create a product first.');
      return;
    }
    
    const product = products[0];
    console.log(`📦 Using product: ${product.name} (${product.product_id})`);
    
    // Create a test customer first
    console.log('👤 Creating test customer...');
    const testEmail = 'test@example.com';
    const testName = 'Test Customer';
    const testCustomerId = await createCustomer('test-user-id', testEmail, testName);
    console.log(`✅ Customer created: ${testCustomerId}`);
    
    // Create payment data
    const paymentData = {
      customer: {
        customer_id: testCustomerId
      },
      product_cart: [
        {
          product_id: product.product_id,
          quantity: 1
        }
      ],
      billing: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        zipcode: '12345',
        country: 'US'
      },
      metadata: {
        test_payment: 'true',
        source: 'cli_test'
      }
    };
    
    console.log('🚀 Creating payment...');
    const payment = await createOneTimePayment(paymentData);
    console.log('✅ Payment created successfully!');
    console.log('📋 Payment details:', payment);
    
    // Try to get payment details
    console.log('\n🔍 Fetching payment details...');
    const details = await getPaymentDetails(payment.payment_id);
    console.log('✅ Payment details fetched:', details);
    
  } catch (error) {
    console.error('❌ Error testing payment:', error instanceof Error ? error.message : String(error));
  }
}

async function testListPayments() {
  try {
    console.log('\n📋 Testing payment listing with updated API filters...');
    
    // Test basic listing with page size
    const payments = await listPayments({ page_size: 10 });
    console.log(`✅ Found ${payments.length} payments`);
    
    if (payments.length > 0) {
      console.log('📄 Recent payments:');
      payments.forEach((payment, index) => {
        const amount = payment.total_amount;
        const customerInfo = payment.customer ? `${payment.customer.name} (${payment.customer.email})` : 'N/A';
        console.log(`  ${index + 1}. ${payment.payment_id}`);
        console.log(`     Status: ${payment.status || 'unknown'}`);
        console.log(`     Amount: ${amount} ${payment.currency || 'USD'}`);
        console.log(`     Customer: ${customerInfo}`);
        console.log(`     Created: ${payment.created_at || 'N/A'}`);
        if (payment.digital_products_delivered !== undefined) {
          console.log(`     Digital Products: ${payment.digital_products_delivered ? 'Delivered' : 'Pending'}`);
        }
        console.log('');
      });
      
      // Test filtering by status
      if (payments.some(p => p.status)) {
        console.log('\n🔍 Testing status filter (failed payments)...');
        try {
          const failedPayments = await listPayments({ 
            status: 'failed',
            page_size: 5 
          });
          console.log(`✅ Found ${failedPayments.length} failed payments`);
        } catch (error) {
          console.log('⚠️  Status filtering failed:', error instanceof Error ? error.message : String(error));
        }
      }
      
      // Test getting invoice for first payment
      const firstPayment = payments[0];
      if (firstPayment?.payment_id) {
        try {
          console.log('\n📄 Testing invoice retrieval...');
          const invoice = await getInvoice(firstPayment.payment_id);
          console.log('✅ Invoice retrieved:', invoice);
        } catch (error) {
          console.log('⚠️  Invoice not available:', error instanceof Error ? error.message : String(error));
        }
        
        try {
          console.log('\n📋 Testing line items retrieval...');
          const lineItems = await getLineItems(firstPayment.payment_id);
          console.log('✅ Line items retrieved:', lineItems);
        } catch (error) {
          console.log('⚠️  Line items not available:', error instanceof Error ? error.message : String(error));
        }
      }
    } else {
      console.log('💡 No payments found. Try creating a payment first with: npm run dev payment');
    }
    
  } catch (error) {
    console.error('❌ Error listing payments:', error instanceof Error ? error.message : String(error));
  }
}

async function testAdvancedPaymentFiltering() {
  try {
    console.log('\n🔍 Testing advanced payment filtering options...');
    
    // Test filtering by different statuses
    const statuses = ['succeeded', 'failed', 'processing', 'cancelled'] as const;
    
    for (const status of statuses) {
      try {
        console.log(`\n📊 Filtering payments by status: ${status}`);
        const filteredPayments = await listPayments({ 
          status,
          page_size: 5
        });
        console.log(`✅ Found ${filteredPayments.length} ${status} payments`);
      } catch (error) {
        console.log(`⚠️  Error filtering ${status} payments:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    // Test date-based filtering (last 30 days)
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      console.log('\n📅 Filtering payments from last 30 days...');
      const recentPayments = await listPayments({
        created_at_gte: thirtyDaysAgo.toISOString(),
        page_size: 10
      });
      console.log(`✅ Found ${recentPayments.length} payments in the last 30 days`);
    } catch (error) {
      console.log('⚠️  Error filtering by date:', error instanceof Error ? error.message : String(error));
    }
    
    // Test pagination
    try {
      console.log('\n📄 Testing pagination...');
      const page1 = await listPayments({ page_size: 2, page_number: 0 });
      console.log(`✅ Page 1: ${page1.length} payments`);
      
      if (page1.length === 2) {
        const page2 = await listPayments({ page_size: 2, page_number: 1 });
        console.log(`✅ Page 2: ${page2.length} payments`);
      }
    } catch (error) {
      console.log('⚠️  Error testing pagination:', error instanceof Error ? error.message : String(error));
    }
    
    console.log('\n💡 Try these CLI commands to test different filters:');
    console.log('  npm run dev payments        - List recent payments');
    console.log('  npm run dev payments-filter - Advanced filtering demo');
    
  } catch (error) {
    console.error('❌ Error in advanced payment filtering:', error instanceof Error ? error.message : String(error));
  }
}

// Webhook Management Test Functions
async function testListWebhooks() {
  console.log('\n🔗 Listing all webhooks...');
  
  try {
    const webhooks = await listWebhooks();
    console.log(`✅ Found ${webhooks.data.length} webhooks:`);
    
    if (webhooks.data.length === 0) {
      console.log('💡 No webhooks found. Create a webhook first with: npm run dev create-webhook');
    } else {
      webhooks.data.forEach((webhook, index) => {
        console.log(`\n${index + 1}. ${webhook.id}`);
        console.log(`   URL: ${webhook.url}`);
        console.log(`   Description: ${webhook.description}`);
        console.log(`   Status: ${webhook.disabled ? 'Disabled' : 'Active'}`);
        console.log(`   Events: ${webhook.filter_types?.length ? webhook.filter_types.join(', ') : 'All events'}`);
        console.log(`   Rate Limit: ${webhook.rate_limit || 'No limit'}`);
        console.log(`   Created: ${new Date(webhook.created_at).toLocaleDateString()}`);
      });
      
      if (!webhooks.done && webhooks.iterator) {
        console.log(`\n📄 More webhooks available (iterator: ${webhooks.iterator})`);
      }
    }
  } catch (error) {
    console.error('❌ Error listing webhooks:', error);
  }
}

async function testCreateWebhook() {
  console.log('\n🔗 Creating a new webhook...');
  
  try {
    const webhookData = {
      url: 'https://your-domain.com/webhook/dodo',
      description: 'Test webhook created via CLI',
      disabled: false,
      filter_types: ['payment.succeeded', 'payment.failed', 'subscription.active', 'subscription.cancelled'] as EventType[],
      metadata: {
        source: 'cli_test',
        created_by: 'dodo_boilerplate',
        environment: 'test'
      },
      rate_limit: 10 // 10 requests per second
    };
    
    console.log('📋 Creating webhook with data:', webhookData);
    
    const webhook = await createWebhook(webhookData);
    
    console.log('✅ Webhook created successfully!');
    console.log(`   ID: ${webhook.id}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   Description: ${webhook.description}`);
    console.log(`   Status: ${webhook.disabled ? 'Disabled' : 'Active'}`);
    console.log(`   Events: ${webhook.filter_types?.join(', ') || 'All events'}`);
    console.log(`   Created: ${new Date(webhook.created_at).toLocaleDateString()}`);
    
    console.log('\n💡 Next steps:');
    console.log(`   - Get webhook secret: npm run dev webhook-secret "${webhook.id}"`);
    console.log(`   - View details: npm run dev webhook-details "${webhook.id}"`);
    console.log(`   - Update your webhook endpoint to handle Dodo events`);
    
  } catch (error) {
    console.error('❌ Error creating webhook:', error);
  }
}

async function testGetWebhookDetails() {
  console.log('\n🔍 Getting webhook details...');
  
  try {
    const webhookId = process.argv[3];
    
    if (!webhookId) {
      // Get the first webhook ID from the list
      console.log('🔍 No webhook ID provided, getting the first available webhook...');
      const webhooks = await listWebhooks({ limit: 1 });
      
      if (webhooks.data.length === 0) {
        console.log('💡 No webhooks found. Create a webhook first with: npm run dev create-webhook');
        return;
      }
      
      const firstWebhook = webhooks.data[0];
      if (!firstWebhook) {
        console.log('💡 No webhooks found. Create a webhook first with: npm run dev create-webhook');
        return;
      }
      
      console.log(`📋 Using webhook: ${firstWebhook.id}`);
      
      const webhook = await getWebhookDetails(firstWebhook.id);
      displayWebhookDetails(webhook);
    } else {
      console.log(`📋 Fetching details for webhook: ${webhookId}`);
      const webhook = await getWebhookDetails(webhookId);
      displayWebhookDetails(webhook);
    }
  } catch (error) {
    console.error('❌ Error getting webhook details:', error);
  }
}

async function testGetWebhookSecret() {
  console.log('\n🔑 Getting webhook signing secret...');
  
  try {
    const webhookId = process.argv[3];
    
    if (!webhookId) {
      // Get the first webhook ID from the list
      console.log('🔍 No webhook ID provided, getting the first available webhook...');
      const webhooks = await listWebhooks({ limit: 1 });
      
      if (webhooks.data.length === 0) {
        console.log('💡 No webhooks found. Create a webhook first with: npm run dev create-webhook');
        return;
      }
      
      const firstWebhook = webhooks.data[0];
      if (!firstWebhook) {
        console.log('💡 No webhooks found. Create a webhook first with: npm run dev create-webhook');
        return;
      }
      
      console.log(`📋 Using webhook: ${firstWebhook.id}`);
      
      const secret = await getWebhookSecret(firstWebhook.id);
      displayWebhookSecret(secret);
    } else {
      console.log(`📋 Fetching secret for webhook: ${webhookId}`);
      const secret = await getWebhookSecret(webhookId);
      displayWebhookSecret(secret);
    }
  } catch (error) {
    console.error('❌ Error getting webhook secret:', error);
  }
}

function displayWebhookDetails(webhook: any) {
  console.log('✅ Webhook details fetched!');
  console.log(`📋 Webhook details:`);
  console.log(`   ID: ${webhook.id}`);
  console.log(`   URL: ${webhook.url}`);
  console.log(`   Description: ${webhook.description}`);
  console.log(`   Status: ${webhook.disabled ? '🔴 Disabled' : '🟢 Active'}`);
  console.log(`   Events: ${webhook.filter_types?.length ? webhook.filter_types.join(', ') : 'All events'}`);
  console.log(`   Rate Limit: ${webhook.rate_limit ? `${webhook.rate_limit}/sec` : 'No limit'}`);
  console.log(`   Created: ${new Date(webhook.created_at).toLocaleDateString()}`);
  console.log(`   Updated: ${new Date(webhook.updated_at).toLocaleDateString()}`);
  
  if (webhook.metadata && Object.keys(webhook.metadata).length > 0) {
    console.log(`   Metadata:`, webhook.metadata);
  }
}

function displayWebhookSecret(secret: any) {
  console.log('✅ Webhook secret retrieved!');
  console.log(`🔑 Signing Secret: ${secret.secret}`);
  console.log('\n💡 Security Notes:');
  console.log('   - Store this secret securely in your environment variables');
  console.log('   - Use this secret to verify webhook signatures');
  console.log('   - Never expose this secret in client-side code');
  console.log('   - Set this as DODO_PAYMENTS_WEBHOOK_SECRET in your .env file');
  
  console.log('\n📝 Usage example:');
  console.log(`   DODO_PAYMENTS_WEBHOOK_SECRET="${secret.secret}"`);
}

// Export functions for external use
export {
  signup,
  createCheckoutSession,
  listProducts,
  listPrices,
  createProduct,
  createCustomer,
  createSubscription,
  listSubscriptions,
  getSubscriptionDetails,
  createOneTimePayment,
  getPaymentDetails,
  listPayments,
  handleWebhook,
  createWebhook,
  listWebhooks,
  getWebhookDetails,
  getWebhookSecret,
  config,
};

// Run CLI if called directly
const scriptPath = process.argv[1];
if (scriptPath && (scriptPath.endsWith('index.ts') || scriptPath.includes('src/index.ts'))) {
  main().catch((error) => {
    console.error('❌ Fatal Error:', error);
    process.exit(1);
  });
}