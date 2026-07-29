'use server';

import { supabase, supabaseService } from '../../lib/supabase';

const dbClient = supabaseService || supabase;

export async function getOrderStatusCounts() {
  try {
    const { data, error } = await dbClient.rpc('get_order_status_counts');

    if (error) {
      console.warn('RPC failed, falling back to basic count:', error);
      // Fallback just in case RPC is not applied everywhere
      const fallback = await dbClient.from('orders').select('status');
      if (fallback.error) throw fallback.error;
      const counts = { all: fallback.data.length };
      fallback.data.forEach(o => {
        counts[o.status] = (counts[o.status] || 0) + 1;
      });
      return counts;
    }

    let total = 0;
    const counts = { all: 0 };
    data.forEach(row => {
      counts[row.status] = Number(row.count);
      total += Number(row.count);
    });
    counts.all = total;

    return counts;
  } catch (error) {
    console.error('getOrderStatusCounts server action error:', error);
    throw error;
  }
}

export async function getPaginatedOrders({ page, perPage = 20, statusFilter = 'all', search = '', sortKey = 'created_at', sortDirection = 'desc' }) {
  try {
    let query = dbClient
      .from('orders')
      .select('*', { count: 'exact' });

    // Status filter
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    // Search filter
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      const isNum = !isNaN(Number(search.trim()));
      let orConditions = `full_name.ilike.${q},email.ilike.${q},phone.ilike.${q},tracking_number.ilike.${q}`;
      
      if (isNum) {
        orConditions += `,order_number.eq.${Number(search.trim())}`;
      }
      
      query = query.or(orConditions);
    }

    // Sorting
    query = query.order(sortKey, { ascending: sortDirection === 'asc' });

    // Pagination range
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      orders: data || [],
      totalCount: count || 0,
    };
  } catch (error) {
    console.error('getPaginatedOrders server action error:', error);
    throw error;
  }
}
