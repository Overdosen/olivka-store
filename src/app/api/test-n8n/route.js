import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const testRoutesEnabled = process.env.NODE_ENV !== 'production' || process.env.TEST_ROUTES_ENABLED === '1';
  const expectedSecret = process.env.OLIVKA_DEBUG_SECRET || (process.env.NODE_ENV !== 'production' ? 'olivka-debug-2024' : null);

  if (!testRoutesEnabled) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;

  console.log('[Test n8n] Webhook URL:', webhookUrl);

  if (!webhookUrl) {
    return NextResponse.json({ error: 'Webhook URL missing' }, { status: 400 });
  }

  try {
    const testPayload = {
      source: 'test_route',
      timestamp: new Date().toISOString(),
      message: 'This is a diagnostic test from Store Olivka',
      debug_info: {
        environment: process.env.NODE_ENV,
        vercel_region: process.env.VERCEL_REGION || 'local'
      }
    };

    console.log('[Test n8n] Sending payload to n8n...');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });

    const responseText = await response.text();
    console.log('[Test n8n] Response status:', response.status);
    console.log('[Test n8n] Response body:', responseText);

    return NextResponse.json({
      status: 'success',
      webhook_url: webhookUrl,
      n8n_response_status: response.status,
      n8n_response_body: responseText
    });

  } catch (error) {
    console.error('[Test n8n] Error:', error.message);
    return NextResponse.json({
      status: 'error',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
