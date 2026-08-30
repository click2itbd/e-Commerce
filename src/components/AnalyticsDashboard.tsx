import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { 
  Users, DollarSign, ShoppingBag, Activity, TrendingUp, TrendingDown, 
  Calendar, AlertCircle, Server, Globe, Download, PieChart as PieIcon, 
  ArrowUpRight, ArrowDownRight, Layers, Percent, Wallet, FileText, RefreshCw,
  CheckCircle2, ArrowRight
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { Order, Product, Customer, Transaction } from '../types';

interface AnalyticsDashboardProps {
  orders?: Order[];
  products?: Product[];
  customers?: Customer[];
  transactions?: Transaction[];
}

const CATEGORY_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  orders: initialOrders = [], 
  products: initialProducts = [], 
  customers: initialCustomers = [], 
  transactions: initialTransactions = [] 
}) => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [loading, setLoading] = useState(false);

  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'this_month' | '1y' | 'all'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'table'>('overview');

  // Sync initial props or fetch live from Firestore
  useEffect(() => {
    if (initialOrders.length > 0) setOrders(initialOrders);
    if (initialProducts.length > 0) setProducts(initialProducts);
    if (initialCustomers.length > 0) setCustomers(initialCustomers);
    if (initialTransactions.length > 0) setTransactions(initialTransactions);
  }, [initialOrders, initialProducts, initialCustomers, initialTransactions]);

  const handleRefreshLive = async () => {
    setLoading(true);
    try {
      const [ordersSnap, productsSnap, txSnap] = await Promise.all([
        getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(500))),
        getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(500))),
        getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(500))),
      ]);

      setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      setProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      setTransactions(txSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    } catch (err) {
      console.error('Analytics live refresh error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Product cost map for fast lookup
  const productCostMap = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach(p => {
      const cost = Number((p as any).costPrice || (p as any).purchasePrice || (p as any).buyingPrice || 0);
      map.set(p.id, cost);
    });
    return map;
  }, [products]);

  // Filter timeframe dates
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    let start = new Date();

    if (timeframe === '7d') {
      start.setDate(now.getDate() - 7);
    } else if (timeframe === '30d') {
      start.setDate(now.getDate() - 30);
    } else if (timeframe === '90d') {
      start.setDate(now.getDate() - 90);
    } else if (timeframe === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    } else if (timeframe === '1y') {
      start.setFullYear(now.getFullYear() - 1);
    } else {
      start = new Date(2020, 0, 1);
    }
    start.setHours(0, 0, 0, 0);

    return { startDate: start, endDate: end };
  }, [timeframe]);

  // Processed Orders in timeframe
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (!o.createdAt) return false;
      const orderDate = new Date(o.createdAt);
      if (orderDate < startDate || orderDate > endDate) return false;
      if (o.status === 'cancelled') return false;
      return true;
    });
  }, [orders, startDate, endDate]);

  // Processed Expenses in timeframe
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (!t.date && !(t as any).createdAt) return false;
      const txDate = new Date(t.date || (t as any).createdAt);
      if (txDate < startDate || txDate > endDate) return false;
      return true;
    });
  }, [transactions, startDate, endDate]);

  // Comprehensive Real Financial Breakdown
  const financialMetrics = useMemo(() => {
    let totalRevenue = 0;
    let hardwareRevenue = 0;
    let hostingRevenue = 0;
    let domainRevenue = 0;
    let servicesRevenue = 0;

    let hardwareCOGS = 0;
    let hostingUpstreamCost = 0;
    let domainUpstreamCost = 0;

    filteredOrders.forEach(order => {
      const orderTotal = Number(order.total) || 0;
      totalRevenue += orderTotal;

      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          const itemPrice = (Number(item.price) || 0) * (Number(item.quantity) || 1);
          const itemType = (item as any).itemType || '';
          const itemCat = ((item as any).category || '').toLowerCase();

          if (itemType === 'hosting' || itemCat.includes('hosting')) {
            hostingRevenue += itemPrice;
            const planSlug = ((item as any).planSlug || item.id || '').toLowerCase();
            const monthlyUpstream = planSlug.includes('premium') ? 300 : planSlug.includes('pro') ? 180 : planSlug.includes('standard') ? 100 : 40;
            hostingUpstreamCost += monthlyUpstream * (Number(item.quantity) || 1);
          } else if (itemType === 'domain' || itemType === 'domain_renewal' || itemType === 'domain_transfer' || itemCat.includes('domain')) {
            domainRevenue += itemPrice;
            const wholesaleDomainCost = 1150 * (Number((item as any).termYears) || 1) * (Number(item.quantity) || 1);
            domainUpstreamCost += Math.min(wholesaleDomainCost, itemPrice * 0.92);
          } else if (itemCat.includes('service') || itemCat.includes('repair')) {
            servicesRevenue += itemPrice;
          } else {
            hardwareRevenue += itemPrice;
            const savedCostPrice = (item as any).costPrice;
            const knownCost = (savedCostPrice !== undefined && savedCostPrice !== null && savedCostPrice > 0)
              ? Number(savedCostPrice)
              : (productCostMap.get(item.id) || Number((item as any).purchasePrice) || (itemPrice * 0.82));
            hardwareCOGS += knownCost * (Number(item.quantity) || 1);
          }
        });
      } else {
        hardwareRevenue += orderTotal;
        hardwareCOGS += (order as any).totalCost || (orderTotal * 0.82);
      }
    });

    // Add manual income transactions
    const manualIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    totalRevenue += manualIncome;

    // Operational expenses
    const operationalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const totalDirectCost = hardwareCOGS + hostingUpstreamCost + domainUpstreamCost;
    const grossProfit = totalRevenue - totalDirectCost;
    const netProfit = grossProfit - operationalExpenses;
    const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      hardwareRevenue,
      hostingRevenue,
      domainRevenue,
      servicesRevenue,
      hardwareCOGS,
      hostingUpstreamCost,
      domainUpstreamCost,
      totalDirectCost,
      operationalExpenses,
      grossProfit,
      netProfit,
      netMarginPercent,
      grossMarginPercent,
      orderCount: filteredOrders.length,
      averageOrderValue: filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0,
      profitPerOrder: filteredOrders.length > 0 ? netProfit / filteredOrders.length : 0,
    };
  }, [filteredOrders, filteredTransactions, productCostMap]);

  // Periodic Chart Data (Daily / Monthly buckets)
  const chartData = useMemo(() => {
    const dataMap = new Map<string, { dateStr: string; label: string; revenue: number; cogs: number; expense: number; profit: number }>();

    const current = new Date(startDate);
    const step = timeframe === '1y' || timeframe === 'all' ? 'month' : 'day';

    while (current <= endDate) {
      const key = step === 'month' 
        ? `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
        : current.toISOString().split('T')[0];

      const label = step === 'month'
        ? current.toLocaleDateString('default', { month: 'short', year: '2-digit' })
        : current.toLocaleDateString('default', { month: 'short', day: 'numeric' });

      if (!dataMap.has(key)) {
        dataMap.set(key, { dateStr: key, label, revenue: 0, cogs: 0, expense: 0, profit: 0 });
      }

      if (step === 'month') {
        current.setMonth(current.getMonth() + 1);
      } else {
        current.setDate(current.getDate() + 1);
      }
    }

    filteredOrders.forEach(o => {
      if (!o.createdAt) return;
      const d = new Date(o.createdAt);
      const key = step === 'month' 
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : d.toISOString().split('T')[0];

      const entry = dataMap.get(key);
      if (entry) {
        const rev = Number(o.total) || 0;
        entry.revenue += rev;
        
        let cost = 0;
        if (o.items && o.items.length > 0) {
          o.items.forEach(i => {
            const iType = (i as any).itemType || '';
            const iQty = Number(i.quantity) || 1;
            if (iType === 'hosting') {
              cost += 100 * iQty;
            } else if (iType === 'domain' || iType === 'domain_renewal') {
              cost += 1150 * iQty;
            } else {
              const savedCostPrice = (i as any).costPrice;
              const knownCost = (savedCostPrice !== undefined && savedCostPrice !== null && savedCostPrice > 0)
                ? Number(savedCostPrice)
                : (productCostMap.get(i.id) || Number(i.price) * 0.8);
              cost += knownCost * iQty;
            }
          });
        } else {
          cost = (o as any).totalCost || (rev * 0.8);
        }
        entry.cogs += cost;
      }
    });

    filteredTransactions.forEach(t => {
      const dateVal = t.date || (t as any).createdAt;
      if (!dateVal) return;
      const d = new Date(dateVal);
      const key = step === 'month' 
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : d.toISOString().split('T')[0];

      const entry = dataMap.get(key);
      if (entry) {
        const amt = Number(t.amount) || 0;
        if (t.type === 'expense') {
          entry.expense += amt;
        } else if (t.type === 'income') {
          entry.revenue += amt;
        }
      }
    });

    return Array.from(dataMap.values()).map(item => ({
      ...item,
      profit: Math.round(item.revenue - item.cogs - item.expense),
      revenue: Math.round(item.revenue),
      cogs: Math.round(item.cogs),
      expense: Math.round(item.expense),
    }));
  }, [filteredOrders, filteredTransactions, startDate, endDate, timeframe, productCostMap]);

  // Category Distribution
  const categoryDistribution = useMemo(() => {
    const data = [
      { name: 'Hardware & E-Commerce', value: Math.round(financialMetrics.hardwareRevenue) },
      { name: 'cPanel Hosting', value: Math.round(financialMetrics.hostingRevenue) },
      { name: 'Domain Registrations', value: Math.round(financialMetrics.domainRevenue) },
      { name: 'Services & IT', value: Math.round(financialMetrics.servicesRevenue) },
    ].filter(d => d.value > 0);

    return data.length > 0 ? data : [
      { name: 'Hardware & E-Commerce', value: 0 },
      { name: 'cPanel Hosting', value: 0 },
      { name: 'Domain Registrations', value: 0 },
    ];
  }, [financialMetrics]);

  // Export Analytics to CSV
  const handleExportCSV = () => {
    const headers = ['Period', 'Gross Revenue (BDT)', 'Product COGS (BDT)', 'Operational Expense (BDT)', 'Net Profit (BDT)'];
    const rows = chartData.map(d => [
      d.label,
      d.revenue,
      d.cogs,
      d.expense,
      d.profit
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CLICK2IT_Profit_Analytics_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Profit & Margin Analytics</h2>
              <p className="text-xs text-gray-500 mt-0.5">Live Dynamic P&L, Upstream Wholesale Margins & Expense Tracking</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
            <Calendar size={15} className="text-gray-500 ml-1.5" />
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 cursor-pointer outline-none pr-3"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="this_month">This Month</option>
              <option value="90d">Last Quarter (90d)</option>
              <option value="1y">Last Year (365d)</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <button
            onClick={handleRefreshLive}
            disabled={loading}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs flex items-center gap-2 transition disabled:opacity-50"
            title="Refresh Live Data from Database"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Sync Real-time
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-sm shadow-emerald-200"
            title="Download CSV report"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards: Net Profit, Revenue, COGS, Margin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gross Revenue</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">{formatCurrency(financialMetrics.totalRevenue)}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-blue-600 font-semibold">
            <ShoppingBag size={13} />
            <span>{financialMetrics.orderCount} Orders Completed</span>
          </div>
        </div>

        {/* Total Cost & OpEx */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Costs & Expenses</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">
            {formatCurrency(financialMetrics.totalDirectCost + financialMetrics.operationalExpenses)}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span>COGS: {formatCurrency(financialMetrics.hardwareCOGS)}</span>
            <span>•</span>
            <span>OpEx: {formatCurrency(financialMetrics.operationalExpenses)}</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Net Profit</span>
            <div className={cn(
              "p-2 rounded-xl",
              financialMetrics.netProfit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            )}>
              {financialMetrics.netProfit >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            </div>
          </div>
          <p className={cn(
            "text-2xl font-black",
            financialMetrics.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"
          )}>
            {formatCurrency(financialMetrics.netProfit)}
          </p>
          <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-gray-600">
            <span>Avg Profit/Order: </span>
            <span className="font-bold text-gray-900">{formatCurrency(financialMetrics.profitPerOrder)}</span>
          </div>
        </div>

        {/* Net Profit Margin % */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Net Profit Margin</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">
            {financialMetrics.netMarginPercent.toFixed(1)}%
          </p>
          <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 font-semibold">
            <span>Gross Margin: {financialMetrics.grossMarginPercent.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Revenue Streams Breakdown Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mb-1">
            <ShoppingBag size={14} className="text-blue-500" />
            Hardware & PC Sales
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(financialMetrics.hardwareRevenue)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Est. Cost: {formatCurrency(financialMetrics.hardwareCOGS)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mb-1">
            <Server size={14} className="text-emerald-500" />
            cPanel Hosting
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(financialMetrics.hostingRevenue)}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
            Profit: {formatCurrency(financialMetrics.hostingRevenue - financialMetrics.hostingUpstreamCost)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mb-1">
            <Globe size={14} className="text-purple-500" />
            Domain Sales
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(financialMetrics.domainRevenue)}</p>
          <p className="text-[11px] text-purple-600 font-medium mt-0.5">
            Profit: {formatCurrency(financialMetrics.domainRevenue - financialMetrics.domainUpstreamCost)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mb-1">
            <Layers size={14} className="text-amber-500" />
            OpEx & Salaries
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(financialMetrics.operationalExpenses)}</p>
          <p className="text-[11px] text-amber-600 font-medium mt-0.5">Operating Overhead</p>
        </div>
      </div>

      {/* Main Charts: Profit & Loss Trend + Revenue Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Revenue, Costs & Net Profit Trend</h3>
              <p className="text-xs text-gray-500 mt-0.5">Real-time daily/monthly financial trajectory</p>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={250} minWidth={0}>
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} tickFormatter={(v) => `৳${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} dx={-5} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <RechartsTooltip 
                  formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, '']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '15px' }} />
                <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="cogs" name="Costs & COGS" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
                <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Stream Donut Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Revenue Stream Share</h3>
            <p className="text-xs text-gray-500 mt-0.5">Distribution across business categories</p>
          </div>

          <div className="h-64 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%" minHeight={250} minWidth={0}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={88}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, 'Share']}
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            {categoryDistribution.map((cat, idx) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} />
                  <span className="text-gray-600 font-medium">{cat.name}</span>
                </div>
                <span className="font-bold text-gray-900">
                  {financialMetrics.totalRevenue > 0 
                    ? `${((cat.value / financialMetrics.totalRevenue) * 100).toFixed(0)}%` 
                    : '0%'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Breakdown Bar Chart: Performance Over Period */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Revenue vs Net Profit Breakdown</h3>
            <p className="text-xs text-gray-500 mt-0.5">Direct comparison across periods</p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%" minHeight={250} minWidth={0}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} tickFormatter={(v) => `৳${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} dx={-5} />
              <RechartsTooltip 
                formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, '']}
                cursor={{ fill: '#F9FAFB' }}
                contentStyle={{ borderRadius: '10px', border: '1px solid #E5E7EB', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '15px' }} />
              <Bar dataKey="revenue" name="Total Revenue" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={32} />
              <Bar dataKey="profit" name="Net Real Profit" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed P&L Breakdown Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Periodic P&L Performance Breakdown</h3>
            <p className="text-xs text-gray-500 mt-0.5">Granular summary of revenues, costs, and profit per period</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
            Live Ledger Synced
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-6">Period</th>
                <th className="py-3.5 px-6">Gross Revenue</th>
                <th className="py-3.5 px-6">Product COGS</th>
                <th className="py-3.5 px-6">OpEx Expenses</th>
                <th className="py-3.5 px-6">Net Profit</th>
                <th className="py-3.5 px-6 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {chartData.filter(d => d.revenue > 0 || d.expense > 0).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
                    No transactions or orders recorded in this selected timeframe.
                  </td>
                </tr>
              ) : (
                chartData.filter(d => d.revenue > 0 || d.expense > 0).map((row, idx) => {
                  const margin = row.revenue > 0 ? (row.profit / row.revenue) * 100 : 0;
                  return (
                    <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-6 font-bold text-gray-900">{row.label}</td>
                      <td className="py-3.5 px-6 text-blue-600 font-semibold">{formatCurrency(row.revenue)}</td>
                      <td className="py-3.5 px-6 text-gray-600">{formatCurrency(row.cogs)}</td>
                      <td className="py-3.5 px-6 text-purple-600">{formatCurrency(row.expense)}</td>
                      <td className={cn(
                        "py-3.5 px-6 font-bold",
                        row.profit >= 0 ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {formatCurrency(row.profit)}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-bold",
                          margin >= 20 ? "bg-emerald-50 text-emerald-700" :
                          margin > 0 ? "bg-blue-50 text-blue-700" :
                          "bg-rose-50 text-rose-700"
                        )}>
                          {margin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default AnalyticsDashboard;
