import { NextResponse } from 'next/server';
import { supabaseService } from '../../../../../lib/supabase';

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing order id' }, { status: 400 });
    }

    if (!supabaseService) {
      console.error('[delete-order] supabaseService not initialized');
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const { error } = await supabaseService.from('orders').delete().eq('id', id);

    if (error) {
      console.error('[delete-order] Error deleting order:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[delete-order] Internal Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
