'use server';

import { supabase, supabaseService } from '../../lib/supabase';

const dbClient = supabaseService || supabase;

export async function getPaginatedProducts({ page, perPage = 20, searchTerm = '', statusFilter = 'all', categoryFilter = 'all', sortKey = 'created_at', sortDirection = 'desc' }) {
  try {
    let query = dbClient
      .from('products')
      .select(`*, categories (name)`, { count: 'exact' });

    // Filter by status
    if (statusFilter === 'active') {
      query = query.eq('is_published', true);
    } else if (statusFilter === 'inactive') {
      query = query.eq('is_published', false);
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      query = query.eq('category_id', categoryFilter);
    }

    // Search filter
    if (searchTerm && searchTerm.trim()) {
      const q = `%${searchTerm.trim()}%`;
      query = query.or(`name.ilike.${q},sku.ilike.${q}`);
    }

    // Sorting
    let finalSortKey = sortKey;
    if (sortKey === 'category') {
      finalSortKey = 'category_id';
    }
    
    // cost_price is special as we sort it by the base column cost_price
    query = query.order(finalSortKey, { ascending: sortDirection === 'asc' });

    // Pagination range
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      products: data || [],
      totalCount: count || 0,
    };
  } catch (error) {
    console.error('getPaginatedProducts server action error:', error);
    throw error;
  }
}

export async function getSoldProductsStats(soldDateFilter) {
  try {
    let dateLimit = null;
    if (soldDateFilter !== 'all') {
      const now = new Date();
      if (soldDateFilter === 'today') {
        dateLimit = new Date(now.setHours(0, 0, 0, 0));
      } else {
        const days = soldDateFilter === '7d' ? 7 : soldDateFilter === '90d' ? 90 : 30;
        dateLimit = new Date(now.setDate(now.getDate() - days));
      }
    }

    // Fetch orders for the period
    let ordersQuery = dbClient
      .from('orders')
      .select('id, items, status, created_at, order_number');
      
    if (dateLimit) {
      ordersQuery = ordersQuery.gte('created_at', dateLimit.toISOString());
    }

    const { data: orders, error: ordersError } = await ordersQuery;
    if (ordersError) throw ordersError;

    // Extract sold product IDs
    const soldProductIds = new Set();
    const validOrders = (orders || []).filter(order => {
      if (['cancelled', 'returned', 'payment_error', 'pending_payment'].includes(order.status)) return false;
      if (!Array.isArray(order.items)) return false;
      return true;
    });

    validOrders.forEach(order => {
      order.items.forEach(item => {
        const prodId = item.product_id || item.id;
        if (prodId) soldProductIds.add(prodId);
      });
    });

    // Fetch details for sold products only
    let productsMap = {};
    if (soldProductIds.size > 0) {
      const { data: products, error: productsError } = await dbClient
        .from('products')
        .select('id, cost_price, sizes, category_id, categories (name)')
        .in('id', Array.from(soldProductIds));

      if (productsError) throw productsError;

      (products || []).forEach(p => {
        productsMap[p.id] = p;
      });
    }

    const getPurchasePrice = (product) => {
      if (!product) return 0;
      if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
        const prices = product.sizes
          .map(s => Number(s.cost_price))
          .filter(p => !isNaN(p) && p > 0);
        if (prices.length > 0) {
          return Math.max(...prices);
        }
      }
      return Number(product.cost_price || 0);
    };

    const soldMap = {};

    validOrders.forEach(order => {
      order.items.forEach(item => {
        const prodId = item.product_id || item.id;
        if (!prodId) return;

        const name = item.name || item.title || 'Без назви';
        const sku = item.sku || '';
        const size = item.size || null;
        const qty = Number(item.quantity || item.qty || 1);
        const price = Number(item.price || 0);
        const image = item.image_url || '';

        const key = prodId;

        if (!soldMap[key]) {
          const catalogProd = productsMap[prodId];
          const currentCostPrice = catalogProd ? getPurchasePrice(catalogProd) : Number(item.cost_price || 0);

          soldMap[key] = {
            id: prodId,
            name,
            sku,
            image_url: image,
            totalQuantity: 0,
            totalRevenue: 0,
            sizes: {},
            lastSold: order.created_at,
            costPrice: currentCostPrice,
            categoryName: catalogProd?.categories?.name || '',
            categoryId: catalogProd?.category_id || null,
            isDeleted: !catalogProd,
          };
        }

        const record = soldMap[key];
        record.totalQuantity += qty;
        record.totalRevenue += qty * price;

        const sizeKey = size || 'Без розміру';
        record.sizes[sizeKey] = (record.sizes[sizeKey] || 0) + qty;

        if (new Date(order.created_at) > new Date(record.lastSold)) {
          record.lastSold = order.created_at;
        }
      });
    });

    return Object.values(soldMap);
  } catch (error) {
    console.error('getSoldProductsStats server action error:', error);
    throw error;
  }
}
