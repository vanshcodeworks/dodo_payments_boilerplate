import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenvConfig();

// Environment validation schema
const envSchema = z.object({
  // Dodo Payments
  DODO_PAYMENTS_API_KEY: z.string().min(1, 'Dodo Payments API key is required'),
  DODO_PAYMENTS_WEBHOOK_SECRET: z.string().optional(),
  
  // Supabase
  SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
  
  // Server
  PORT: z.string().optional().default('3000'),
  NODE_ENV: z.string().optional().default('development'),
  WEBHOOK_PORT: z.string().optional().default('3001'),
});

// Validate environment variables
const env = envSchema.parse(process.env);

export const config = {
  dodo: {
    apiKey: env.DODO_PAYMENTS_API_KEY,
    webhookSecret: env.DODO_PAYMENTS_WEBHOOK_SECRET,
  },
  supabase: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },
  server: {
    port: parseInt(env.PORT),
    webhookPort: parseInt(env.WEBHOOK_PORT),
    nodeEnv: env.NODE_ENV,
  },
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
};

export default config;
