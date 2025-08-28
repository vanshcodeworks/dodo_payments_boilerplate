import { saveUser, saveCustomer, saveCustomerId } from '../db/client.js';
import { createCustomer } from '../payments/customer.js';

export interface SignupData {
  email: string;
  fullName?: string;
  phone?: string;
  metadata?: any;
}

export async function signup(userData: SignupData) {
  try {
    console.log('🚀 Starting signup process for:', userData.email);

    // 1. Create user in Supabase
    console.log('📝 Creating user in Supabase...');
    const user = await saveUser(userData.email, userData.fullName);
    console.log('✅ User created with ID:', user.id);

    // 2. Create customer in Dodo Payments (without metadata - not supported in customer API)
    console.log('💳 Creating customer in Dodo Payments...');
    const dodoCustomerId = await createCustomer(user.id, userData.email, userData.fullName);
    console.log('✅ Dodo customer created with ID:', dodoCustomerId);

    // 3. Save Dodo customer ID in user record
    console.log('🔗 Linking Dodo customer ID to user...');
    await saveCustomerId(user.id, dodoCustomerId);

    // 4. Save full customer record
    console.log('💾 Saving customer record...');
    const customer = await saveCustomer({
      user_id: user.id,
      dodo_customer_id: dodoCustomerId,
      email: userData.email,
      ...(userData.fullName && { full_name: userData.fullName }),
      ...(userData.phone && { phone: userData.phone }),
      ...(userData.metadata && { metadata: userData.metadata }),
    });

    console.log('🎉 Signup completed successfully!');
    
    return {
      success: true,
      data: {
        user,
        customer,
        dodoCustomerId,
      },
    };
  } catch (error) {
    console.error('❌ Signup failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Signup failed',
    };
  }
}

export async function getSignupStatus(userId: string) {
  try {
    // This could be expanded to check signup completion status
    const { getCustomerByUserId } = await import('../db/client.js');
    const customer = await getCustomerByUserId(userId);
    
    return {
      hasCustomer: !!customer,
      customerId: customer?.dodo_customer_id,
    };
  } catch (error) {
    console.error('Error checking signup status:', error);
    return {
      hasCustomer: false,
      customerId: null,
    };
  }
}
