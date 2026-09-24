import React, { useMemo } from 'react';
import { Product, Order, Customer } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { useSettings } from '../../context/SettingsContext';
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface EcommerceOverviewProps {
  products: Product[];
  orders: Order[];
  setActiveTab: (tab: string) => void;
}

export const EcommerceOverview: React.FC<EcommerceOverviewProps> = ({
  products,
  orders,
  setActiveTab
}) => {
  const { settings } = useSettings();

  // Filter ONLY e-commerce and pc-build orders
  const storeOrders = useMemo(() => {
    return orders.filter(o => {
      const type = o.type;
      const isDomain = type === 'domain' || o.domain || o.items?.some((i: any) => i.itemType === 'domain');
      const isHosting = type === 'hosting' || o.hostingServiceId || o.items?.some((i: any) => i.itemType === 'hosting');
      const isERP = o.saleSource === 'in_store' || o.type === 'quotation' || o.type === 'challan';
      return !isDomain && !isHosting && !isERP; // Exclude hosting, domain, and ERP orders
    });
  }, [orders]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayOrders = storeOrders.filter(o => new Date(o.createdAt) >= today);
    const monthOrders = storeOrders.filter(o => new Date(o.createdAt) >= thisMonth);

    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    const pendingOrders = storeOrders.filter(o => o.status === 'pending');
    
    const pcBuildOrders = storeOrders.filter(o => 
      o.type === 'pc_build' || o.type === 'pc_builder' || o.isPCBuild || o.items?.some((i: any) => i.isPCBuild)
    );

    return {
      todayRevenue,
      monthRevenue,
      todayOrders: todayOrders.length,
      monthOrders: monthOrders.length,
      pendingOrders: pendingOrders.length,
      pcBuildOrders: pcBuildOrders.length,
      totalProducts: products.length,
      lowStock: products.filter(p => p.stock <= (p.lowStockThreshold || 5)).length
    };
  }, [storeOrders, products]);

  // Generate chart data for last 7 days
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayOrders = storeOrders.filter(o => o.createdAt?.startsWith(dateStr));
      
      data.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
        orders: dayOrders.length
      });
    }
    return data;
  }, [storeOrders]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Store Overview</h2>
          <p className="text-gray-500 text-sm mt-1">Track your e-commerce and PC build performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Today's Revenue</p>
                <h3 className="text-3xl font-bold text-gray-900">{formatCurrency(stats.todayRevenue, settings)}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <DollarSign size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">From {stats.todayOrders} orders today</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Pending Orders</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.pendingOrders}</h3>
              </div>
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                <ShoppingCart size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <button onClick={() => setActiveTab('orders')} className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                View orders <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">PC Build Orders</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.pcBuildOrders}</h3>
              </div>
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                <Cpu size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">Total lifetime builds</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Low Stock Alerts</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.lowStock}</h3>
              </div>
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <button onClick={() => setActiveTab('inventory')} className="text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1">
                Manage inventory <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Trend (Last 7 Days)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280' }} 
                  tickFormatter={(value) => `${value >= 1000 ? (value / 1000) + 'k' : value}`}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [formatCurrency(value, settings), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent Store Orders</h3>
            <button onClick={() => setActiveTab('orders')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
          </div>
          <div className="space-y-4">
            {storeOrders.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer" onClick={() => setActiveTab('orders')}>
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <ShoppingCart size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{order.customerName}</p>
                  <p className="text-xs text-gray-500">{order.documentNumber || order.id.substring(0,8)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(order.total || 0, settings)}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
            {storeOrders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No orders found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
