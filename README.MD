# Dodo Payments + Supabase Boilerplate

A complete TypeScript boilerplate for integrating **Dodo Payments** with **Supabase**. Production-ready with comprehensive payment flows, customer management, and webhook handling.

## 🎯 It provides?

This boilerplate provides everything needed for a complete Dodo Payments integration:

- **Customer Creation**: Automatic signup → Supabase profile → Dodo customer creation
- **Payment Processing**: One-time payments, subscriptions, checkout sessions
- **Webhook Handling**: Full management API + Supabase Functions for event processing
- **Database Sync**: Real-time payment and subscription data synchronization
- **Developer Experience**: CLI tools for testing all functionality

## 🏗 Architecture

```
src/
├── auth/           # User authentication & signup
├── config/         # Environment configuration
├── db/             # Supabase database operations
├── payments/       # Payment, product, subscription management
├── webhooks/       # Webhook management & event handling
└── index.ts        # Main CLI interface

supabase/
├── schema.sql               # Database schema
└── functions/dodo-webhook/  # Edge Function for webhooks
```

## 🚀 Quick Start

### 1. Installation

```bash
git clone https://github.com/vanshcodeworks/dodo_payments_boilerplate
cd dodo_payments_boilerplate
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Configure your `.env`:

```env
# Dodo Payments - Get from https://dashboard.dodopayments.com/developer/api-keys
DODO_PAYMENTS_API_KEY=test_mode_key_or_live_mode_key
DODO_PAYMENTS_WEBHOOK_SECRET=your_webhook_secret

# Supabase - Get from your Supabase project
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Server Configuration
PORT=3000
NODE_ENV=development
WEBHOOK_PORT=3001
```

### 3. Database Setup

```bash
# Apply schema to your Supabase project
psql -h db.your-project.supabase.co -U postgres -d postgres -f supabase/schema.sql

# Or via Supabase CLI
supabase db reset
```

### 4. Deploy Webhook Function (Optional)

```bash
supabase functions deploy dodo-webhook
```

## 🎯 Available Commands

### Core Workflows
```bash
npm run dev health              # Verify configuration
npm run dev signup              # User signup + customer creation
npm run dev checkout            # Create checkout session
npm run dev payment             # One-time payment creation
```

### Product & Subscription Management
```bash
npm run dev products            # List products and prices
npm run dev create-product      # Create new product
npm run dev subscriptions      # List subscriptions with filtering
npm run dev create-subscription # Create new subscription
```

### Payment Operations
```bash
npm run dev payments            # List payments with details
npm run dev payments-filter     # Demo advanced filtering options
```

### Webhook Management
```bash
npm run dev webhooks            # List all configured webhooks
npm run dev create-webhook      # Create new webhook
npm run dev webhook-details     # Get webhook details
npm run dev webhook-secret      # Retrieve webhook signing secret
npm run dev webhook             # Test webhook handler
```

## 💻 Core Features

### 1. User Signup with Customer Creation

Automatically creates Supabase user and Dodo customer:

```typescript
import { signup } from './src/auth/signup.js';

const result = await signup({
  email: 'user@example.com',
  fullName: 'John Doe',
  metadata: { source: 'web' }
});

if (result.success) {
  console.log('User ID:', result.data.user.id);
  console.log('Dodo Customer ID:', result.data.dodoCustomerId);
}
```

### 2. Checkout Sessions

Create complete checkout experiences:

```typescript
import { createCheckoutSession } from './src/payments/subscription.js';

const checkout = await createCheckoutSession({
  product_cart: [
    {
      product_id: 'pdt_123',
      quantity: 1
    }
  ],
  customer: {
    name: 'Customer Name',
    email: 'customer@example.com'
  },
  billing_address: {
    country: 'US',
    state: 'CA',
    city: 'San Francisco',
    street: '123 Main St',
    zipcode: '94105'
  },
  return_url: 'https://your-domain.com/success',
  metadata: { order_id: 'order_123' }
});

console.log('Checkout URL:', checkout.checkout_url);
```

### 3. Subscription Management

Complete subscription lifecycle:

```typescript
import { 
  createSubscription, 
  listSubscriptions, 
  getSubscriptionDetails 
} from './src/payments/subscription.js';

// Create subscription
const subscription = await createSubscription({
  product_id: 'pdt_recurring_123',
  quantity: 1,
  customer: {
    customer_id: 'cus_123'
  }
});

// List with filtering
const subscriptions = await listSubscriptions({
  status: 'active',
  page_size: 10
});

// Get details
const details = await getSubscriptionDetails('sub_123');
```

### 4. Payment Processing

One-time payments with advanced filtering:

```typescript
import { 
  createOneTimePayment, 
  listPayments, 
  getPaymentDetails 
} from './src/payments/payment.js';

// Create payment
const payment = await createOneTimePayment({
  customer: {
    customer_id: 'cus_123'
  },
  product_cart: [
    {
      product_id: 'pdt_123',
      quantity: 1
    }
  ]
});

// List with filters
const payments = await listPayments({
  status: 'succeeded',
  created_at_gte: '2024-01-01T00:00:00Z',
  page_size: 20
});
```

### 5. Webhook Management

Complete webhook lifecycle management:

```typescript
import { 
  createWebhook, 
  listWebhooks, 
  getWebhookDetails, 
  getWebhookSecret 
} from './src/webhooks/webhook-management.js';

// Create webhook
const webhook = await createWebhook({
  url: 'https://your-domain.com/webhook/dodo',
  description: 'Production webhook',
  filter_types: ['payment.succeeded', 'subscription.active'],
  rate_limit: 100
});

// Get signing secret
const secret = await getWebhookSecret(webhook.id);
```

## 🎣 Webhook Events Handled

The boilerplate processes all Dodo Payments events:

### Payment Events
- `payment.succeeded` - Payment completed successfully
- `payment.failed` - Payment failed
- `payment.processing` - Payment being processed
- `payment.cancelled` - Payment cancelled

### Subscription Events
- `subscription.active` - Subscription activated
- `subscription.cancelled` - Subscription cancelled
- `subscription.renewed` - Billing cycle renewed
- `subscription.plan_changed` - Plan upgrade/downgrade
- `subscription.on_hold` - Subscription paused
- `subscription.expired` - Subscription expired

### Other Events
- `refund.succeeded` / `refund.failed` - Refund processing
- `dispute.*` - Dispute events
- `license_key.created` - License key generation

## 🗄 Database Schema

### Core Tables

```sql
-- User profiles linked to Dodo customers
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  dodo_customer_id TEXT UNIQUE,
  full_name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment event logging
CREATE TABLE public.payment_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payment_id TEXT,
  customer_id TEXT,
  data JSONB NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription tracking
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id TEXT UNIQUE NOT NULL,
  customer_id TEXT NOT NULL,
  status TEXT NOT NULL,
  product_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 Testing Guide

### 1. Health Check
```bash
npm run dev health
```
Verifies all configuration and environment variables.

### 2. End-to-End Flow
```bash
# Complete signup flow
npm run dev signup

# Create and test products
npm run dev create-product
npm run dev products

# Test payments
npm run dev payment
npm run dev payments

# Test subscriptions
npm run dev create-subscription
npm run dev subscriptions

# Test checkout
npm run dev checkout

# Test webhooks
npm run dev webhook
npm run dev webhooks
```

### 3. Webhook Testing

#### Local Development
```bash
# Start webhook server
npm run webhook:dev

# Test webhook endpoint
curl -X POST http://localhost:3001/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"type":"payment.succeeded","data":{"object":{"id":"pay_123"}}}'
```

#### Production (Supabase Functions)
```bash
# Deploy function
supabase functions deploy dodo-webhook

# Set webhook URL in Dodo dashboard to:
# https://your-project.supabase.co/functions/v1/dodo-webhook
```

## 🔧 Configuration Options

### Payment Filtering
```typescript
const payments = await listPayments({
  status: 'succeeded',
  created_at_gte: '2024-01-01T00:00:00Z',
  created_at_lte: '2024-12-31T23:59:59Z',
  page_size: 50,
  page_number: 0
});
```

### Subscription Filtering
```typescript
const subscriptions = await listSubscriptions({
  status: 'active',
  customer_id: 'cus_123',
  page_size: 25
});
```

### Webhook Configuration
```typescript
const webhook = await createWebhook({
  url: 'https://your-domain.com/webhook',
  description: 'Production webhook',
  disabled: false,
  filter_types: ['payment.succeeded', 'subscription.active'],
  rate_limit: 100, // requests per second
  metadata: {
    environment: 'production',
    version: '1.0'
  }
});
```

## 🔒 Security Features

- **Webhook Signature Verification**: Automatic signature validation
- **Row Level Security**: Supabase RLS policies on all tables
- **Environment Validation**: Configuration health checks
- **SQL Injection Prevention**: Parameterized queries
- **API Key Management**: Secure environment variable handling

## 🚀 Deployment

### Supabase Functions
```bash
# Deploy webhook handler
supabase functions deploy dodo-webhook

# Set environment variables in Supabase dashboard
DODO_PAYMENTS_API_KEY=your_key
DODO_PAYMENTS_WEBHOOK_SECRET=your_secret
```

### Other Platforms
Works with any Node.js platform:
- Vercel
- Netlify Functions
- AWS Lambda
- Railway
- Heroku

## 📈 Advanced Usage

### Custom Event Handling
```typescript
import { handleWebhook } from './src/webhooks/handler.js';

// In your webhook endpoint
export async function POST(request: Request) {
  const signature = request.headers.get('dodo-signature');
  const body = await request.text();
  
  const result = await handleWebhook(body, signature);
  
  if (result.success) {
    return new Response('OK', { status: 200 });
  } else {
    return new Response('Error', { status: 400 });
  }
}
```

### Database Integration
```typescript
import { supabase } from './src/db/client.js';

// Custom query with payment data
const { data: payments } = await supabase
  .from('payment_events')
  .select('*')
  .eq('event_type', 'payment.succeeded')
  .order('created_at', { ascending: false });
```

## 🐛 Troubleshooting

### Common Issues

**"Invalid API key"**
- Verify `DODO_PAYMENTS_API_KEY` in `.env`
- Ensure correct environment (test/live) key

**"Supabase connection failed"**
- Check `SUPABASE_URL` and service key
- Verify database schema is applied

**"Webhook signature failed"**
- Confirm `DODO_PAYMENTS_WEBHOOK_SECRET` matches dashboard
- Check webhook payload format

**"Customer not found"**
- Ensure signup completed successfully
- Verify customer exists in database

### Debug Mode
Set `NODE_ENV=development` for detailed logging.

### Health Diagnostics
```bash
npm run dev health
```
Shows complete system status and configuration validation.

## 📊 API Coverage

### ✅ Complete Implementation
- **Authentication**: User signup with Supabase profile creation
- **Customer Management**: Dodo customer creation with metadata sync
- **Products**: Create, list products with pricing
- **Payments**: One-time payments with advanced filtering
- **Subscriptions**: Full lifecycle management
- **Checkout**: Complete checkout session creation
- **Webhooks**: Management API + event processing
- **Database**: Real-time sync with proper typing

### 🔄 Event Processing
- All Dodo payment events supported
- Automatic database synchronization
- Error handling and retry logic
- Signature verification

## 📝 Time Investment

**Estimated Development Time**: ~40 hours
- Core payment integration: 12 hours
- Webhook management: 8 hours
- Database schema & sync: 6 hours
- CLI tooling: 8 hours
- Testing & documentation: 6 hours

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request

## 📄 License

MIT License - Free for commercial and personal use.

## 📞 Support

- **Issues**: Create GitHub issue for bugs
- **Questions**: Use GitHub Discussions

---

**Built with ❤️ for developers who need payment integration that just works.**

This boilerplate provides everything needed for production-ready payment processing with Dodo Payments and Supabase integration.