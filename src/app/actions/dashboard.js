'use server';

import { supabase, supabaseService } from '../../lib/supabase';
import { STATUS_MAP } from '../../lib/admin-constants';

const dbClient = supabaseService || supabase;

export async function getDashboardStats(dateRange) {
  try {
    let periodStart = new Date();
    let prevPeriodStart = new Date();

    if (dateRange === 'today') {
      periodStart.setHours(0, 0, 0, 0);
      prevPeriodStart = new Date(periodStart);
      prevPeriodStart.setDate(prevPeriodStart.getDate() - 1);
    } else if (dateRange === '1y') {
      periodStart = new Date(periodStart.getFullYear(), 0, 1, 0, 0, 0, 0);
      prevPeriodStart = new Date(periodStart.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
    } else {
      const rangeMap = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
      };
      const days = rangeMap[dateRange] || 30;
      periodStart.setHours(0, 0, 0, 0);
      periodStart.setDate(periodStart.getDate() - (days - 1));

      prevPeriodStart = new Date(periodStart);
      prevPeriodStart.setDate(prevPeriodStart.getDate() - days);
    }

    // Fetch all dashboard data in parallel to reduce database roundtrip times
    const [
      ordersRes,
      recentOrdersRes,
      productsCountRes,
      profilesRes,
      stockDataRes
    ] = await Promise.all([
      dbClient
        .from('orders')
        .select('id, order_number, full_name, email, phone, total, status, created_at, items, tracking_number, packaging_cost')
        .gte('created_at', prevPeriodStart.toISOString())
        .order('created_at', { ascending: false }),

      dbClient
        .from('orders')
        .select('id, order_number, full_name, email, phone, total, status, created_at, items, tracking_number, packaging_cost')
        .order('created_at', { ascending: false })
        .limit(5),

      dbClient
        .from('products')
        .select('*', { count: 'exact', head: true }),

      dbClient
        .from('profiles')
        .select('email, created_at')
        .gte('created_at', periodStart.toISOString()),

      dbClient
        .from('products')
        .select('id, name, stock, cost_price, sizes')
        .order('stock', { ascending: true })
    ]);

    if (ordersRes.error) throw ordersRes.error;
    if (recentOrdersRes.error) throw recentOrdersRes.error;
    if (productsCountRes.error) throw productsCountRes.error;
    if (profilesRes.error) throw profilesRes.error;
    if (stockDataRes.error) throw stockDataRes.error;

    const orders = ordersRes.data || [];
    const recentOrders = recentOrdersRes.data || [];
    const productsCount = productsCountRes.count || 0;
    const profiles = profilesRes.data || [];
    const stockData = stockDataRes.data || [];

    const customerIdentifiers = new Set();

    // Count from registered profiles
    profiles?.forEach(p => {
      if (p.email) {
        customerIdentifiers.add(p.email.toLowerCase());
      }
    });

    // Also count unique customers from the orders in this period (using email, or phone if email is missing)
    const periodOrdersForClients = orders.filter(o => new Date(o.created_at) >= periodStart);
    periodOrdersForClients.forEach(o => {
      if (o.email) {
        customerIdentifiers.add(o.email.toLowerCase());
      } else if (o.phone) {
        customerIdentifiers.add(o.phone.trim());
      }
    });

    const totalUnits = stockData?.reduce((s, p) => s + (p.stock || 0), 0) || 0;

    // Calculate total inventory value
    let inventoryTotalValue = 0;
    if (stockData) {
      stockData.forEach(p => {
        if (Array.isArray(p.sizes) && p.sizes.length > 0) {
          p.sizes.forEach(size => {
            const qty = Number(size.quantity || 0);
            const cost = Number(size.cost_price !== undefined && size.cost_price !== null ? size.cost_price : (p.cost_price || 0));
            inventoryTotalValue += qty * cost;
          });
        } else {
          const qty = Number(p.stock || 0);
          const cost = Number(p.cost_price || 0);
          inventoryTotalValue += qty * cost;
        }
      });
    }

    // Period revenue
    const periodOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= periodStart && !['cancelled', 'returned', 'payment_error', 'pending_payment'].includes(o.status);
    });
    const periodRevenue = periodOrders.reduce((s, o) => s + (o.total || 0), 0);

    // Previous period comparison
    const currentOrdersCount = orders.filter(o => new Date(o.created_at) >= periodStart).length;
    const prevOrdersCount = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= prevPeriodStart && d < periodStart;
    }).length;
    const periodTrend = prevOrdersCount > 0
      ? Math.round(((currentOrdersCount - prevOrdersCount) / prevOrdersCount) * 100)
      : null;

    // COGS and packaging
    let cogsTotal = 0;
    let packagingTotalCost = 0;

    periodOrders.forEach(order => {
      packagingTotalCost += Number(order.packaging_cost || 0);

      if (!Array.isArray(order.items)) return;
      order.items.forEach(item => {
        const qty = Number(item.quantity || item.qty || 1);
        let cost = 0;

        if (item.cost_price !== undefined && item.cost_price !== null) {
          cost = Number(item.cost_price);
        } else {
          const prodId = item.product_id || item.id;
          const product = stockData?.find(p => p.id === prodId);
          if (product) {
            if (item.size && Array.isArray(product.sizes) && product.sizes.length > 0) {
              const sizeObj = product.sizes.find(s => s.name === item.size);
              if (sizeObj && sizeObj.cost_price !== undefined && sizeObj.cost_price !== null) {
                cost = Number(sizeObj.cost_price);
              } else {
                cost = Number(product.cost_price || 0);
              }
            } else {
              cost = Number(product.cost_price || 0);
            }
          }
        }

        cogsTotal += qty * cost;
      });
    });

    const purchasesTotalCost = cogsTotal + packagingTotalCost;

    const stats = {
      periodRevenue,
      periodOrders: periodOrders.length,
      totalClients: customerIdentifiers.size,
      totalUnits,
      currentOrdersCount,
      periodTrend,
      totalProducts: productsCount || 0,
      purchasesTotalCost,
      inventoryTotalValue,
      packagingTotalCost,
      cogsTotal,
    };

    // Revenue chart
    const chartData = [];
    if (dateRange === '1y') {
      const currentYear = new Date().getFullYear();
      const monthMap = {};
      const monthsOrder = [];

      for (let month = 0; month < 12; month++) {
        const d = new Date(currentYear, month, 1);
        const key = `${currentYear}-${String(month + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('uk-UA', { month: 'short' }).replace('.', '');
        const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);

        monthMap[key] = {
          date: key,
          revenue: 0,
          orders: 0,
          label: capitalizedLabel
        };
        monthsOrder.push(key);
      }

      periodOrders.forEach(o => {
        const d = new Date(o.created_at);
        if (d.getFullYear() === currentYear) {
          const key = `${currentYear}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (monthMap[key]) {
            monthMap[key].revenue += o.total || 0;
            monthMap[key].orders += 1;
          }
        }
      });

      monthsOrder.forEach(key => {
        chartData.push(monthMap[key]);
      });
    } else if (dateRange === 'today') {
      const hourlyMap = {};
      const hoursOrder = [];
      const todayStr = new Date().toISOString().slice(0, 10);

      for (let hour = 0; hour < 24; hour++) {
        const key = `${todayStr}-${String(hour).padStart(2, '0')}`;
        const label = `${String(hour).padStart(2, '0')}:00`;

        hourlyMap[key] = {
          date: key,
          revenue: 0,
          orders: 0,
          label: label
        };
        hoursOrder.push(key);
      }

      periodOrders.forEach(o => {
        const d = new Date(o.created_at);
        const hourKey = `${todayStr}-${String(d.getHours()).padStart(2, '0')}`;
        if (hourlyMap[hourKey]) {
          hourlyMap[hourKey].revenue += o.total || 0;
          hourlyMap[hourKey].orders += 1;
        }
      });

      hoursOrder.forEach(key => {
        chartData.push(hourlyMap[key]);
      });
    } else {
      const dailyMap = {};
      const rangeMap = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
      };
      const days = rangeMap[dateRange] || 30;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        dailyMap[key] = {
          date: key,
          revenue: 0,
          orders: 0,
          label: d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }).replace('.', '')
        };
      }
      periodOrders.forEach(o => {
        const key = new Date(o.created_at).toISOString().slice(0, 10);
        if (dailyMap[key]) {
          dailyMap[key].revenue += o.total || 0;
          dailyMap[key].orders += 1;
        }
      });
      chartData.push(...Object.values(dailyMap));
    }

    // Top products
    const productCounts = {};
    periodOrders.forEach(o => {
      if (!Array.isArray(o.items)) return;
      o.items.forEach(item => {
        const name = item.name || item.title || 'Без назви';
        const productId = item.product_id || item.id;
        if (!productCounts[name]) {
          productCounts[name] = {
            name,
            count: 0,
            revenue: 0,
            image: item.image_url || item.image || '',
            productId: productId
          };
        }
        productCounts[name].count += item.quantity || 1;
        productCounts[name].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });
    const topProducts = Object.values(productCounts).sort((a, b) => b.count - a.count).slice(0, 5);

    // Status breakdown
    const statusCounts = {};
    const periodAllOrders = orders.filter(o => new Date(o.created_at) >= periodStart);
    periodAllOrders.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      label: STATUS_MAP[status]?.label || status,
      color: STATUS_MAP[status]?.color || '#71717a',
    }));

    // Low stock alerts
    const lowStock = (stockData || []).filter(p => p.stock <= 2 && p.stock >= 0).slice(0, 5);

    return {
      stats,
      revenueData: chartData,
      recentOrders,
      topProducts,
      statusBreakdown,
      lowStock
    };
  } catch (error) {
    console.error('getDashboardStats server action error:', error);
    throw error;
  }
}
