import { NextResponse } from 'next/server';
import { supabase, supabaseService } from './supabase';

export async function requireAdmin(request) {
  if (!supabaseService) {
    console.error('[admin-auth] supabaseService is not initialized');
    return {
      error: NextResponse.json({ error: 'Service unavailable' }, { status: 503 }),
    };
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);

  if (userError || !userData?.user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabaseService
    .from('profiles')
    .select('id, is_admin')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profileError) {
    console.error('[admin-auth] Profile lookup failed:', profileError.message);
    return {
      error: NextResponse.json({ error: 'Authorization check failed' }, { status: 500 }),
    };
  }

  if (!profile?.is_admin) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { user: userData.user, profile };
}
