import { NextResponse } from 'next/server';

const UKRPOST_API_BASE = 'https://www.ukrposhta.ua/address-classifier-ws';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }

  let bearer = process.env.NEXT_PUBLIC_UKRPOST_BEARER || process.env.UKRPOST_BEARER;
  
  if (!bearer) {
    console.error('[Ukrposhta API Proxy] Bearer token is missing.');
  } else {
    // Clean "Bearer " if user accidentally included it in the env var
    bearer = bearer.replace(/^Bearer\s+/i, '');
  }
  
  // Construct destination URL
  const destinationUrl = new URL(`${UKRPOST_API_BASE}${endpoint}`);
  
  // Forward all query parameters except `endpoint`
  searchParams.forEach((value, key) => {
    if (key !== 'endpoint') {
      destinationUrl.searchParams.append(key, value);
    }
  });

  try {
    const res = await fetch(destinationUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${bearer}`,
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(10000) 
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: 'Ukrposhta returned error', details: text }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Ukrposhta Proxy Error:', error);
    return NextResponse.json({ error: 'Ukrposhta API Error', details: error.message }, { status: 500 });
  }
}
