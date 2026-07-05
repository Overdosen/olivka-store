'use client';

import { useEffect, useState } from 'react';
import { getDashboardStats } from '../actions/dashboard';
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
        setLoading(true);
        const data = await getDashboardStats(dateRange);
        setStats(data.stats);
        setRevenueData(data.revenueData);
        setRecentOrders(data.recentOrders);
        setTopProducts(data.topProducts);
        setStatusBreakdown(data.statusBreakdown);
        setLowStock(data.lowStock);
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
