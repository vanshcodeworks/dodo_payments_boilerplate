import { config } from '../config/index.js';

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

// Simple Dodo Payments customer functions
export async function createCustomer(userId: string, email: string, name?: string): Promise<string> {
  try {
    // Based on official docs: POST https://test.dodopayments.com/customers
    const baseUrl = 'https://test.dodopayments.com';
    const endpoint = '/customers';
    
    console.log(`🔍 Using official endpoint: ${baseUrl}${endpoint}`);
    console.log(`🔑 API Key prefix: ${config.dodo.apiKey.substring(0, 10)}...`);
    
    const requestBody = {
      email,
      name: name || email.split('@')[0],
      // Note: Adding phone_number as null since it's in the API spec
      phone_number: null
    };
    
    console.log(`📦 Request body:`, requestBody);
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.dodo.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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
      
      console.error(`❌ API Error:`, errorDetails);
      throw new Error(`Dodo API error (${response.status}): ${JSON.stringify(errorDetails)}`);
    }

    const customer = await response.json();
    console.log(`✅ Customer created successfully:`, customer);
    
    // Based on the API docs, the response includes customer_id
    return customer.customer_id;
  } catch (error) {
    console.error('Error creating Dodo customer:', error);
    throw error;
  }
}

export async function getCustomer(customerId: string): Promise<any> {
  try {
    // Based on official docs pattern, should be GET /customers/{id}
    const baseUrl = 'https://test.dodopayments.com';
    const endpoint = `/customers/${customerId}`;
    
    console.log(`🔍 Fetching customer from: ${baseUrl}${endpoint}`);
    
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
      
      console.error(`❌ Error fetching customer:`, errorDetails);
      throw new Error(`Dodo API error (${response.status}): ${JSON.stringify(errorDetails)}`);
    }

    const customer = await response.json();
    console.log(`✅ Customer fetched:`, customer);
    return customer;
  } catch (error) {
    console.error('Error fetching Dodo customer:', error);
    throw error;
  }
}

export async function updateCustomer(customerId: string, data: { name?: string; phone_number?: string | null }): Promise<any> {
  try {
    // Based on official docs: PATCH /customers/{id}
    const baseUrl = 'https://test.dodopayments.com';
    const endpoint = `/customers/${customerId}`;
    
    console.log(`🔍 Updating customer at: ${baseUrl}${endpoint}`);
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${config.dodo.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
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
      
      console.error(`❌ Error updating customer:`, errorDetails);
      throw new Error(`Dodo API error (${response.status}): ${JSON.stringify(errorDetails)}`);
    }

    const customer = await response.json();
    console.log(`✅ Customer updated:`, customer);
    return customer;
  } catch (error) {
    console.error('Error updating Dodo customer:', error);
    throw error;
  }
}
