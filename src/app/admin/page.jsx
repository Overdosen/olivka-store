'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ShoppingBag, Package, TrendingUp, ArrowRight, AlertTriangle, Receipt } from 'lucide-react';
import { STATUS_MAP, formatMoney, formatDateShort } from '../../lib/admin-constants';
import StatCard from '../../components/admin/ui/StatCard';
import StatusBadge from '../../components/admin/ui/StatusBadge';
import PageHeader from '../../components/admin/ui/PageHeader';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function Dashboard() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState('30d');
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [statusBreakdown, setStatusBreakdown] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
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

        // All orders
        const { data: allOrders } = await supabase
          .from('orders')
          .select('id, order_number, full_name, email, phone, total, status, created_at, items, tracking_number, packaging_cost')
          .order('created_at', { ascending: false });

        const orders = allOrders || [];

        // Products count
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        // Clients count for period
        const { data: profiles } = await supabase
          .from('profiles')
          .select('email, created_at');

        const customerIdentifiers = new Set();

        // Count from registered profiles
        profiles?.forEach(p => {
          if (p.email && new Date(p.created_at) >= periodStart) {
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

        // Stock
        const { data: stockData } = await supabase
          .from('products')
          .select('id, name, stock, image_url, cost_price, sizes')
          .order('stock', { ascending: true });

        const totalUnits = stockData?.reduce((s, p) => s + (p.stock || 0), 0) || 0;

        // Розрахунок «Вартість складу» (Оборотний капітал)
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

        // Динамічний розрахунок собівартості проданих товарів (COGS) та пакування
        let cogsTotal = 0;
        let packagingTotalCost = 0;

        periodOrders.forEach(order => {
          packagingTotalCost += Number(order.packaging_cost || 0);

          if (!Array.isArray(order.items)) return;
          order.items.forEach(item => {
            const qty = Number(item.quantity || item.qty || 1);
            let cost = 0;

            if (item.cost_price !== undefined && item.cost_price !== null) {
              // Пріоритет 1: Собівартість збережена безпосередньо у замовленні
              cost = Number(item.cost_price);
            } else {
              // Пріоритет 2: Історичний пошук у завантаженому stockData
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

        setStats({
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
        });

        // Revenue chart
        const chartData = [];
        if (dateRange === '1y') {
          // Group by calendar months of the current year (January to December)
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
          // Group by hours of today (00:00 to 23:00)
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
          // Group by day
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
        setRevenueData(chartData);

        // Recent orders
        setRecentOrders(orders.slice(0, 5));

        // Top products (by frequency in period orders)
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
        setTopProducts(Object.values(productCounts).sort((a, b) => b.count - a.count).slice(0, 5));

        // Status breakdown (filtered by selected date range)
        const statusCounts = {};
        const periodAllOrders = orders.filter(o => new Date(o.created_at) >= periodStart);
        periodAllOrders.forEach(o => {
          statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
        });
        setStatusBreakdown(
          Object.entries(statusCounts).map(([status, count]) => ({
            status,
            count,
            label: STATUS_MAP[status]?.label || status,
            color: STATUS_MAP[status]?.color || '#71717a',
          }))
        );

        // Low stock alerts
        setLowStock((stockData || []).filter(p => p.stock <= 2 && p.stock >= 0).slice(0, 5));


      } catch (error) {
        console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-stone-200 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-stone-100 rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-stone-100 rounded-lg" />
      </div>
    );
  }

  const chartTitleSuffix = {
    'today': 'сьогодні',
    '7d': '7 днів',
    '30d': '30 днів',
    '90d': '90 днів',
    '1y': 'рік'
  }[dateRange];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Статистика магазину"
      >
        <div className="relative">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-white border border-stone-200 rounded-lg px-3 py-2 text-[14px] font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-300 shadow-sm transition-all cursor-pointer"
          >
            <option value="today">Сьогодні</option>
            <option value="7d">Останні 7 днів</option>
            <option value="30d">Останні 30 днів</option>
            <option value="90d">Останні 90 днів</option>
            <option value="1y">Рік</option>
          </select>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-2 xl:gap-3.5 admin-stagger">
        <StatCard
          label="Виручка"
          value={stats?.periodRevenue || 0}
          prefix="₴"
          icon={TrendingUp}
          className="lg:col-span-1"
        >
          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] font-semibold animate-fade-in">
            <span className="text-stone-500">Чистий прибуток:</span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100 font-bold flex items-center gap-0.5">
              +{formatMoney((stats?.periodRevenue || 0) - (stats?.purchasesTotalCost || 0))} ₴
            </span>
          </div>
        </StatCard>
        <StatCard
          label="Замовлень"
          value={stats?.periodOrders || 0}
          icon={ShoppingBag}
          trend={stats?.periodTrend}
          className="lg:col-span-1"
        />
        <StatCard
          label="Товарів на складі"
          value={stats?.totalUnits || 0}
          suffix="шт"
          icon={Package}
          className="lg:col-span-1"
        >
          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] font-semibold text-stone-500 animate-fade-in">
            <span>Вартість складу:</span>
            <span className="text-stone-800">{formatMoney(stats?.inventoryTotalValue || 0)} ₴</span>
          </div>
        </StatCard>
        <StatCard
          label="Витрати замовлень"
          value={stats?.purchasesTotalCost || 0}
          prefix="₴"
          icon={Receipt}
          accentColor="#dc2626"
          className="lg:col-span-1"
        >
          <div className="mt-3 pt-3 border-t border-stone-100 space-y-1.5 text-[10px] xl:text-[11px] font-semibold animate-fade-in">
            <div className="flex items-center justify-between text-stone-500">
              <span>Собівартість проданих товарів:</span>
              <span className="text-stone-800 whitespace-nowrap">{formatMoney(stats?.cogsTotal || 0)} ₴</span>
            </div>
            <div className="flex items-center justify-between text-stone-500">
              <span>Пакування:</span>
              <span className="text-stone-800 whitespace-nowrap">{formatMoney(stats?.packagingTotalCost || 0)} ₴</span>
            </div>
          </div>
        </StatCard>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg border border-stone-200/80 p-5 md:p-6 shadow-[0_2px_8px_rgba(28,25,23,0.03)] admin-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[15px] font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-stone-400" />
            Динаміка виручки ({chartTitleSuffix})
          </h2>
          <span className="text-sm font-semibold text-stone-500 bg-stone-50 px-3 py-1 rounded-full border border-stone-100">
            {formatMoney(stats?.periodRevenue)} ₴ загалом
          </span>
        </div>
        <div className="h-64 md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#292524" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#292524" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#a8a29e', fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                dy={10}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#a8a29e', fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e7e5e4',
                  fontSize: '13px',
                  fontWeight: 600,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                  padding: '8px 12px'
                }}
                itemStyle={{ color: '#1c1917' }}
                formatter={(value) => [`${formatMoney(value)} ₴`, 'Виручка']}
                labelStyle={{ color: '#78716c', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#292524"
                strokeWidth={3}
                fill="url(#revenueGrad)"
                dot={false}
                activeDot={{ r: 6, fill: '#292524', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 admin-fade-in" style={{ animationDelay: '0.2s' }}>

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-stone-200/80 shadow-[0_2px_8px_rgba(28,25,23,0.03)] overflow-hidden">
          <div className="px-6 py-5 flex items-center justify-between border-b border-stone-100 bg-stone-50/50">
            <h2 className="text-[15px] font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-stone-400" />
              Останні замовлення
            </h2>
            <Link href="/admin/orders" className="text-[13px] font-semibold text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors">
              Всі замовлення <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-stone-50/80 text-[11px] uppercase tracking-wider text-stone-500 font-bold border-b border-stone-100">
                <tr>
                  <th className="px-6 py-5">№ Замовлення</th>
                  <th className="px-6 py-5">Клієнт</th>
                  <th className="px-6 py-5">Дата</th>
                  <th className="px-6 py-5">Статус</th>
                  <th className="px-6 py-5 text-right">Сума</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 text-[14px]">
                {recentOrders.map(order => (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                    className="hover:bg-stone-50/60 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-6">
                      <span className="font-semibold text-stone-900 group-hover:text-blue-600 transition-colors">
                        #{order.order_number}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-stone-600 font-medium">{order.full_name || 'Гість'}</td>
                    <td className="px-6 py-6 text-stone-500">{formatDateShort(order.created_at)}</td>
                    <td className="px-6 py-6">
                      <StatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="px-6 py-6 text-right font-bold text-stone-900">
                      {formatMoney(order.total)} ₴
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-stone-400 text-sm">
                      Замовлень поки немає
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6 md:space-y-8">

          {/* Status breakdown */}
          <div className="bg-white rounded-lg border border-stone-200/80 p-6 shadow-[0_2px_8px_rgba(28,25,23,0.03)]">
            <h2 className="text-[15px] font-bold text-stone-900 tracking-tight mb-5">
              Статуси замовлень ({chartTitleSuffix})
            </h2>
            {statusBreakdown.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {statusBreakdown.sort((a, b) => b.count - a.count).map(item => (
                  <div key={item.status} className="flex items-center justify-between p-3 bg-stone-50/50 border border-stone-100 rounded-lg hover:bg-stone-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[13px] font-semibold text-stone-700">{item.label}</span>
                    </div>
                    <span className="text-[13px] font-bold text-stone-900 tabular-nums bg-white px-2.5 py-0.5 rounded border border-stone-200/40 shadow-sm">{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-stone-400 text-center py-4">Немає даних</p>
            )}
          </div>

          {/* Low Stock Alert */}
          {lowStock.length > 0 && (
            <div className="bg-orange-50/40 rounded-lg border border-orange-200/50 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <div className="flex items-center gap-2 mb-4 relative z-10">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <h2 className="text-[15px] font-bold text-orange-900 tracking-tight">Низький залишок</h2>
              </div>
              <div className="space-y-2.5 relative z-10">
                {lowStock.map(p => (
                  <Link
                    key={p.id}
                    href={`/admin/products/${p.id}`}
                    className="flex items-center justify-between group bg-white border border-orange-100 rounded-lg px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-orange-50/30 hover:border-orange-200/60 transition-all duration-200"
                  >
                    <span className="text-[13px] font-semibold text-orange-900 group-hover:text-orange-950 truncate flex-1 mr-3 transition-colors">{p.name}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md tabular-nums flex-shrink-0 ${p.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                      {p.stock} шт
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Top Products */}
          {topProducts.length > 0 && (
            <div className="bg-white rounded-lg border border-stone-200/80 p-6 shadow-[0_2px_8px_rgba(28,25,23,0.03)]">
              <h2 className="text-[15px] font-bold text-stone-900 tracking-tight mb-5">Топ товарів ({chartTitleSuffix})</h2>
              <div className="space-y-3">
                {topProducts.map((p, i) => {
                  const content = (
                    <div className="flex items-center gap-3 p-3 bg-stone-50/40 border border-stone-100/80 hover:bg-stone-50 rounded-lg transition-colors">
                      <div className="relative w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-stone-200/50">
                        {p.image ? (
                          <Image src={p.image} alt={p.name} fill sizes="40px" className="object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-stone-400" strokeWidth={1.5} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-stone-900 truncate group-hover:text-blue-600 transition-colors" title={p.name}>{p.name}</p>
                        <p className="text-[11px] text-stone-500 font-medium mt-0.5">{p.count} продано</p>
                      </div>
                    </div>
                  );

                  if (p.productId) {
                    return (
                      <Link
                        key={p.name}
                        href={`/admin/products/${p.productId}`}
                        className="block group"
                      >
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <div key={p.name}>
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
