import { NextResponse } from 'next/server';
import { checkboxService } from '../../../lib/checkbox';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Simple security check
  if (secret !== 'olivka-debug-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Checkbox Debug] Deep status check starting...');
    
    // 1. Authenticate first to get token
    const token = await checkboxService.authenticate();
    const headers = {
      ...checkboxService.getHeaders(),
      'cache-control': 'no-cache',
      'pragma': 'no-cache'
    };

    // 2. Fetch Cashier Profile (/cashier/me)
    const profileRes = await fetch(`${checkboxService.baseUrl}/cashier/me`, { headers, cache: 'no-store' });
    const profile = await profileRes.json();

    // 3. Fetch Cash Register Info (/cash-registers/info)
    const registerRes = await fetch(`${checkboxService.baseUrl}/cash-registers/info`, { headers, cache: 'no-store' });
    const register = await registerRes.json();

    // 4. Fetch Active Shift (/cashier/shift)
    const activeShiftRes = await fetch(`${checkboxService.baseUrl}/cashier/shift`, { headers, cache: 'no-store' });
    let activeShift = null;
    if (activeShiftRes.status === 200) {
      activeShift = await activeShiftRes.json();
    } else if (activeShiftRes.status === 404) {
      activeShift = { message: 'No active shift found (404)' };
    } else {
      activeShift = { error: `HTTP ${activeShiftRes.status}`, text: await activeShiftRes.text() };
    }

    // 5. Test Service's new robust ensureShiftOpened
    console.log('[Test] Testing checkboxService.ensureShiftOpened()...');
    const serviceShift = await checkboxService.ensureShiftOpened();

    // 6. Fetch Recent Shifts List (limit 10)
    const recentRes = await fetch(`${checkboxService.baseUrl}/shifts?limit=10&desc=true`, { headers, cache: 'no-store' });
    const recent = await recentRes.json();

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      service_test: {
        shift_id: serviceShift?.id,
        shift_status: serviceShift?.status
      },
      cashier: {
        id: profile.id,
        name: profile.full_name,
        organization: profile.organization?.title
      },
      cash_register: {
        id: register.id,
        fiscal_number: register.fiscal_number,
        title: register.title,
        has_shift: register.has_shift,
        offline_mode: register.offline_mode
      },
      active_shift: activeShift,
      recent_shifts_summary: recent.entities?.map(s => ({
        id: s.id,
        status: s.status,
        serial: s.serial,
        opened_at: s.opened_at,
        closed_at: s.closed_at
      }))
    });


  } catch (error) {
    console.error('[Checkbox Debug] Deep check failed:', error.message);
    return NextResponse.json({
      status: 'error',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
