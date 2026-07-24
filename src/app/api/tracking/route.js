import { NextResponse } from 'next/server';
import { UAParser } from 'ua-parser-js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { event, data } = body;

    // Get headers
    const userAgent = request.headers.get('user-agent') || '';
    const country = request.headers.get('x-vercel-ip-country') || 'Unknown';
    const city = request.headers.get('x-vercel-ip-city') || 'Unknown';

    // Parse User Agent
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    
    // Determine Device type more simply (Desktop vs Mobile)
    const deviceType = result.device.type === 'mobile' || result.device.type === 'tablet' ? 'Mobile' : 'Desktop';
    const osName = result.os.name || 'Unknown';

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      country,
      city,
      deviceType,
      osName,
      data
    };

    const webhookUrl = process.env.N8N_TRACKING_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('N8N_TRACKING_WEBHOOK_URL is not set');
      return NextResponse.json({ success: false, error: 'Webhook URL not configured' }, { status: 500 });
    }

    // Send to n8n
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('Failed to send to n8n:', response.status);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tracking error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
