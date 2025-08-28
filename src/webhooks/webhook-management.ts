import { config } from '../config/index.js';

// Get the base URL for API calls
function getBaseUrl(): string {
  const apiKey = config.dodo.apiKey;
  if (apiKey && apiKey.startsWith('test_')) {
    return 'https://test.dodopayments.com';
  } else if (apiKey && apiKey.startsWith('live_')) {
    return 'https://live.dodopayments.com';
  } else {
    console.warn('⚠️ Unknown API key format, defaulting to test endpoint');
    return 'https://test.dodopayments.com';
  }
}

// Event types supported by Dodo Payments webhooks
export type EventType = 
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.processing'
  | 'payment.cancelled'
  | 'refund.succeeded'
  | 'refund.failed'
  | 'dispute.opened'
  | 'dispute.expired'
  | 'dispute.accepted'
  | 'dispute.cancelled'
  | 'dispute.challenged'
  | 'dispute.won'
  | 'dispute.lost'
  | 'subscription.active'
  | 'subscription.renewed'
  | 'subscription.on_hold'
  | 'subscription.cancelled'
  | 'subscription.failed'
  | 'subscription.expired'
  | 'subscription.plan_changed'
  | 'license_key.created';

// Interface for creating a new webhook
export interface CreateWebhookData {
  url: string;
  description?: string | null;
  disabled?: boolean | null;
  filter_types?: EventType[];
  headers?: Record<string, string> | null;
  idempotency_key?: string | null;
  metadata?: Record<string, string> | null;
  rate_limit?: number | null;
}

// Interface for webhook details response
export interface WebhookDetails {
  id: string;
  url: string;
  description: string;
  disabled?: boolean | null;
  filter_types?: string[] | null;
  metadata: Record<string, string>;
  rate_limit?: number | null;
  created_at: string;
  updated_at: string;
}

// Interface for listing webhooks response
export interface ListWebhooksResponse {
  data: WebhookDetails[];
  done: boolean;
  iterator?: string | null;
  prev_iterator?: string | null;
}

// Interface for webhook secret response
export interface WebhookSecretResponse {
  secret: string;
}

// Interface for listing webhooks parameters
export interface ListWebhooksParams {
  limit?: number | null;
  iterator?: string | null;
}

/**
 * Create a new webhook for the business
 */
export async function createWebhook(webhookData: CreateWebhookData): Promise<WebhookDetails> {
  try {
    const baseUrl = getBaseUrl();
    const endpoint = '/webhooks';
    
    console.log(`🔗 Creating webhook at: ${baseUrl}${endpoint}`);
    console.log(`📋 Webhook data:`, webhookData);

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.dodo.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
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
      
      console.error(`❌ Webhook creation error:`, errorDetails);
      throw new Error(`Dodo API error (${response.status}): ${JSON.stringify(errorDetails)}`);
    }

    const webhook: WebhookDetails = await response.json();
    console.log(`✅ Webhook created successfully:`, webhook);
    return webhook;
  } catch (error) {
    console.error('Error creating webhook:', error);
    throw error;
  }
}

/**
 * List all webhooks for the business
 */
export async function listWebhooks(params?: ListWebhooksParams): Promise<ListWebhooksResponse> {
  try {
    const baseUrl = getBaseUrl();
    const endpoint = '/webhooks';
    
    // Build query parameters
    const searchParams = new URLSearchParams();
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }
    if (params?.iterator) {
      searchParams.append('iterator', params.iterator);
    }
    
    const queryString = searchParams.toString();
    const fullUrl = queryString ? `${baseUrl}${endpoint}?${queryString}` : `${baseUrl}${endpoint}`;
    
    console.log(`🔍 Fetching webhooks from: ${fullUrl}`);

    const response = await fetch(fullUrl, {
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
      
      console.error(`❌ Webhook list error:`, errorDetails);
      throw new Error(`Dodo API error (${response.status}): ${JSON.stringify(errorDetails)}`);
    }

    const webhooks: ListWebhooksResponse = await response.json();
    console.log(`✅ Webhooks fetched:`, webhooks);
    return webhooks;
  } catch (error) {
    console.error('Error listing webhooks:', error);
    throw error;
  }
}

/**
 * Get detailed information about a specific webhook
 */
export async function getWebhookDetails(webhookId: string): Promise<WebhookDetails> {
  try {
    const baseUrl = getBaseUrl();
    const endpoint = `/webhooks/${webhookId}`;
    
    console.log(`🔍 Fetching webhook details from: ${baseUrl}${endpoint}`);

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
      
      console.error(`❌ Webhook details error:`, errorDetails);
      throw new Error(`Dodo API error (${response.status}): ${JSON.stringify(errorDetails)}`);
    }

    const webhook: WebhookDetails = await response.json();
    console.log(`✅ Webhook details fetched:`, webhook);
    return webhook;
  } catch (error) {
    console.error('Error getting webhook details:', error);
    throw error;
  }
}

/**
 * Get the signing key for a specific webhook
 */
export async function getWebhookSecret(webhookId: string): Promise<WebhookSecretResponse> {
  try {
    const baseUrl = getBaseUrl();
    const endpoint = `/webhooks/${webhookId}/secret`;
    
    console.log(`🔑 Fetching webhook secret from: ${baseUrl}${endpoint}`);

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
      
      console.error(`❌ Webhook secret error:`, errorDetails);
      throw new Error(`Dodo API error (${response.status}): ${JSON.stringify(errorDetails)}`);
    }

    const secret: WebhookSecretResponse = await response.json();
    console.log(`✅ Webhook secret fetched successfully`);
    // Don't log the actual secret for security
    return secret;
  } catch (error) {
    console.error('Error getting webhook secret:', error);
    throw error;
  }
}
