import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleWebhook } from '../../../src/webhooks/handler.ts';

serve(async (req) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('dodo-signature') || req.headers.get('x-dodo-signature');
    
    console.log('Webhook received:', {
      method: req.method,
      url: req.url,
      hasSignature: !!signature,
      bodyLength: body.length,
    });

    const result = await handleWebhook(body, signature || undefined);

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Webhook function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
