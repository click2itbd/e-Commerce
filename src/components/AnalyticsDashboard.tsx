import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
  Wrench,
  Users, DollarSign, ShoppingBag, Activity, TrendingUp, TrendingDown, 
  Calendar, AlertCircle, Server, Globe, Download, PieChart as PieIcon, 
  ArrowUpRight, ArrowDownRight, Layers, Percent, Wallet, FileText, RefreshCw,
  CheckCircle2, ArrowRight, User, X, Search, Award, Sparkles, ChevronDown, ChevronUp,
  Package, Truck, Clock, CreditCard, ArrowDownLeft
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { Order, Product, Customer, Transaction, ServiceRecord } from '../types';

interface AnalyticsDashboardProps {
  orders?: Order[];
  products?: Product[];
  customers?: Customer[];
  transactions?: Transaction[];
  serviceRecords?: ServiceRecord[];
  vendors?: any[];
  purchases?: any[];
}

const CATEGORY_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  orders: initialOrders = [], 
  products: initialProducts = [], 
  customers: initialCustomers = [], 
  transactions: initialTransactions = [],
  serviceRecords = [],
  vendors: initialVendors = [],
  purchases: initialPurchases = []
}) => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [vendors, setVendors] = useState<any[]>(initialVendors);
  const [purchases, setPurchases] = useState<any[]>(initialPurchases);
  const [loading, setLoading] = useState(false);

  const [timeframe, setTimeframe] = useState<'today' | 'yesterday' | '7d' | '30d' | '90d' | 'this_month' | '1y' | 'all'>('30d');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'by_customer' | 'daily_pulse'>('overview');
  const [showServiceDiagnostic, setShowServiceDiagnostic] = useState<boolean>(false);

  // Daily Business Pulse state
  const [dailySelectedDate, setDailySelectedDate] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [dailyDetailTab, setDailyDetailTab] = useState<'sales' | 'purchases' | 'cashflow'>('sales');

  // Sync initial props or fetch live from Firestore
  useEffect(() => {
    if (initialOrders.length > 0) setOrders(initialOrders);
    if (initialProducts.length > 0) setProducts(initialProducts);
    if (initialCustomers.length > 0) setCustomers(initialCustomers);
    if (initialTransactions.length > 0) setTransactions(initialTransactions);
    if (initialVendors.length > 0) setVendors(initialVendors);
    if (initialPurchases.length > 0) setPurchases(initialPurchases);
  }, [initialOrders, initialProducts, initialCustomers, initialTransactions, initialVendors, initialPurchases]);

  // Load auxiliary purchases & vendors if not provided
  useEffect(() => {
    const fetchAuxiliary = async () => {
      try {
        const [purSnap, venSnap] = await Promise.all([
          getDocs(query(collection(db, 'purchases'), orderBy('createdAt', 'desc'), limit(500))).catch(async () => {
            return await getDocs(collection(db, 'purchases'));
          }).catch(() => ({ docs: [] } as any)),
          getDocs(collection(db, 'vendors')).catch(() => ({ docs: [] } as any)),
        ]);
        if (purSnap && !purSnap.empty && initialPurchases.length === 0) {
          setPurchases(purSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
        }
        if (venSnap && !venSnap.empty && initialVendors.length === 0) {
          setVendors(venSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
        }
      } catch (e) {
        console.warn('Failed to load auxiliary analytics data:', e);
      }
    };
    fetchAuxiliary();
  }, [initialPurchases.length, initialVendors.length]);

  const handleRefreshLive = async () => {
    setLoading(true);
    try {
      const [ordersSnap, productsSnap, txSnap, customersSnap, purSnap, venSnap] = await Promise.all([
        getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(500))),
        getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(500))),
        getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(500))),
        getDocs(query(collection(db, 'customers'), limit(500))),
        getDocs(query(collection(db, 'purchases'), orderBy('createdAt', 'desc'), limit(500))).catch(async () => {
          return await getDocs(collection(db, 'purchases'));
        }).catch(() => ({ docs: [] } as any)),
        getDocs(collection(db, 'vendors')).catch(() => ({ docs: [] } as any)),
      ]);

      const filteredSnapOrders = ordersSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as Order))
        .filter(o => (o as any).platform !== 'hosting' && !(o as any).isHostingOrder && o.type !== 'hosting' && o.type !== 'domain');
      setOrders(filteredSnapOrders);
      setProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      setTransactions(txSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
      if (!customersSnap.empty) {
        setCustomers(customersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));
      }
      if (purSnap && !purSnap.empty) {
        setPurchases(purSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
      }
      if (venSnap && !venSnap.empty) {
        setVendors(venSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
      }
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
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let start = new Date();

    if (timeframe === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (timeframe === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
      return { startDate: start, endDate: yesterdayEnd };
    } else if (timeframe === '7d') {
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (timeframe === '30d') {
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    } else if (timeframe === '90d') {
      start.setDate(now.getDate() - 90);
      start.setHours(0, 0, 0, 0);
    } else if (timeframe === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    } else if (timeframe === '1y') {
      start.setFullYear(now.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
    } else {
      start = new Date(2020, 0, 1);
      start.setHours(0, 0, 0, 0);
    }

    return { startDate: start, endDate: end };
  }, [timeframe]);

  // Robust date & time helpers
  const getDateString = (val: any): string => {
    if (!val) return '';
    try {
      if (typeof val === 'string') {
        if (val.length === 10 && val.includes('-')) return val;
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        }
      }
      if (val.toDate && typeof val.toDate === 'function') {
        const d = val.toDate();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
      if (val.seconds) {
        const d = new Date(val.seconds * 1000);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    } catch {
      return '';
    }
    return '';
  };

  const isDateEqual = (dateVal: any, targetYmd: string): boolean => {
    if (!dateVal || !targetYmd) return false;
    const ymd = getDateString(dateVal);
    if (ymd === targetYmd) return true;
    try {
      const d = typeof dateVal === 'string' ? new Date(dateVal) : (dateVal.toDate ? dateVal.toDate() : new Date(dateVal));
      if (!isNaN(d.getTime()) && d.toISOString().split('T')[0] === targetYmd) {
        return true;
      }
    } catch {}
    return false;
  };

  const getTimeString = (val: any): string => {
    if (!val) return '';
    try {
      const d = typeof val === 'string' ? new Date(val) : (val.toDate ? val.toDate() : new Date(val));
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } catch {}
    return '';
  };

  // Processed Orders in timeframe (Excluding hosting & domain orders)
  const timeframeFilteredOrders = useMemo(() => {
    return orders.filter(o => {
      if ((o as any).platform === 'hosting' || (o as any).isHostingOrder || o.type === 'hosting' || o.type === 'domain') return false;
      if (!o.createdAt) return false;
      const orderDate = new Date(o.createdAt);
      if (orderDate < startDate || orderDate > endDate) return false;
      if (o.status === 'cancelled') return false;
      // Completely exclude quotations from financial analytics
      if (o.type === 'quotation') return false;
      return true;
    });
  }, [orders, startDate, endDate]);

  // Comprehensive Customer List (Retail & Hardware only)
  const customerList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; phone?: string; email?: string }>();

    customers.forEach(c => {
      if (c && c.name && c.name.trim()) {
        const key = c.id || c.phone || c.name;
        map.set(key, {
          id: c.id,
          name: c.name.trim(),
          phone: c.phone || '',
          email: c.email || '',
        });
      }
    });

    orders.forEach(o => {
      if ((o as any).platform === 'hosting' || (o as any).isHostingOrder || o.type === 'hosting' || o.type === 'domain') return;
      const name = o.customerName || (o as any).customer?.name;
      if (name && name !== 'Walk-in Customer' && name.trim()) {
        const id = (o as any).customerId || o.userId || name.trim();
        if (!map.has(id)) {
          const existing = Array.from(map.values()).find(
            c => (c.name.toLowerCase() === name.trim().toLowerCase()) || (o.customerPhone && c.phone === o.customerPhone)
          );
          if (!existing) {
            map.set(id, {
              id: id,
              name: name.trim(),
              phone: o.customerPhone || '',
              email: o.customerEmail || '',
            });
          }
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, orders]);

  const selectedCustomerObj = useMemo(() => {
    if (selectedCustomerId === 'all') return null;
    return customerList.find(c => c.id === selectedCustomerId) || null;
  }, [selectedCustomerId, customerList]);

  // Filtered Orders for Analytics (applying customer filter if selected)
  const filteredOrders = useMemo(() => {
    if (selectedCustomerId === 'all' || !selectedCustomerObj) {
      return timeframeFilteredOrders;
    }

    return timeframeFilteredOrders.filter(o => {
      if ((o as any).customerId && (o as any).customerId === selectedCustomerObj.id) return true;
      if (o.userId && o.userId === selectedCustomerObj.id) return true;
      if (o.customerPhone && selectedCustomerObj.phone && o.customerPhone.trim() === selectedCustomerObj.phone.trim()) return true;
      if (o.customerName && selectedCustomerObj.name && o.customerName.trim().toLowerCase() === selectedCustomerObj.name.trim().toLowerCase()) return true;
      return false;
    });
  }, [timeframeFilteredOrders, selectedCustomerId, selectedCustomerObj]);

  // Customer Profitability Ranking
  const customerProfitability = useMemo(() => {
    const map = new Map<string, {
      id: string;
      customerId: string;
      customerName: string;
      customerPhone: string;
      orderCount: number;
      revenue: number;
      cogs: number;
      profit: number;
      margin: number;
      lastOrderDate: string;
    }>();

    timeframeFilteredOrders.forEach(order => {
      const name = order.customerName || (order as any).customer?.name || 'Walk-in Customer';
      const phone = order.customerPhone || (order as any).customer?.phone || '';
      const id = (order as any).customerId || order.userId || (phone ? `phone_${phone}` : `name_${name}`);

      if (!map.has(id)) {
        map.set(id, {
          id,
          customerId: id,
          customerName: name,
          customerPhone: phone,
          orderCount: 0,
          revenue: 0,
          cogs: 0,
          profit: 0,
          margin: 0,
          lastOrderDate: order.createdAt || '',
        });
      }

      const item = map.get(id)!;
      item.orderCount++;

      let orderRevenue = 0;
      let orderCOGS = 0;
      if (order.items && order.items.length > 0) {
        const orderDiscount = Number(order.discountAmount) || 0;
        const nonHostingItems = order.items.filter(it => {
          const itemType = (it as any).itemType || '';
          const itemCat = ((it as any).category || '').toLowerCase();
          return !(itemType === 'hosting' || itemType === 'domain' || itemType === 'domain_renewal' || itemType === 'domain_transfer' || itemType === 'ssl' || itemCat.includes('hosting') || itemCat.includes('domain'));
        });

        if (nonHostingItems.length > 0) {
          const orderSubtotal = order.items.reduce((sum: number, i: any) => sum + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);

          nonHostingItems.forEach(it => {
            const rawItemTotal = (Number(it.price) || 0) * (Number(it.quantity) || 1);
            let itemDiscount = 0;
            if (orderSubtotal > 0 && orderDiscount > 0) {
              itemDiscount = orderDiscount * (rawItemTotal / orderSubtotal);
            }
            const itemPrice = rawItemTotal - itemDiscount;
            orderRevenue += itemPrice;

            const itemType = (it as any).itemType || '';
            if (itemType === 'service' || it.isCustomService) {
              // Service COGS is zero
            } else {
              const savedCostPrice = (it as any).costPrice;
              const knownCost = (savedCostPrice !== undefined && savedCostPrice !== null && savedCostPrice > 0)
                ? Number(savedCostPrice)
                : (productCostMap.get(it.id) || Number((it as any).purchasePrice) || ((Number(it.price) || 0) * 0.82));
              orderCOGS += knownCost * (Number(it.quantity) || 1);
            }
          });
        }
      } else {
        const orderTotal = Number(order.total) || 0;
        orderRevenue += orderTotal;
        orderCOGS += (order as any).totalCost || (orderTotal * 0.82);
      }

      item.revenue += orderRevenue;
      item.cogs += orderCOGS;

      if (order.createdAt && (!item.lastOrderDate || new Date(order.createdAt) > new Date(item.lastOrderDate))) {
        item.lastOrderDate = order.createdAt;
      }
    });

    const list = Array.from(map.values()).map(c => {
      const profit = c.revenue - c.cogs;
      const margin = c.revenue > 0 ? (profit / c.revenue) * 100 : 0;
      return {
        ...c,
        profit: Math.round(profit),
        margin,
      };
    });

    return list.sort((a, b) => b.profit - a.profit);
  }, [timeframeFilteredOrders, productCostMap]);

  const filteredCustomerProfitability = useMemo(() => {
    if (!customerSearchQuery.trim()) return customerProfitability;
    const q = customerSearchQuery.toLowerCase();
    return customerProfitability.filter(c => 
      c.customerName.toLowerCase().includes(q) || 
      c.customerPhone.toLowerCase().includes(q)
    );
  }, [customerProfitability, customerSearchQuery]);

  // Processed Expenses in timeframe
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (!t.date && !(t as any).createdAt) return false;
      const txDate = new Date(t.date || (t as any).createdAt);
      if (txDate < startDate || txDate > endDate) return false;

      // If specific customer selected, only include transactions related to this customer
      if (selectedCustomerId !== 'all' && selectedCustomerObj) {
        const matchesEntityId = t.entityId === selectedCustomerObj.id;
        const matchesEntityName = t.entityName && selectedCustomerObj.name && t.entityName.trim().toLowerCase() === selectedCustomerObj.name.trim().toLowerCase();
        const matchesCustomerField = (t as any).customerName && selectedCustomerObj.name && (t as any).customerName.trim().toLowerCase() === selectedCustomerObj.name.trim().toLowerCase();
        return matchesEntityId || matchesEntityName || matchesCustomerField;
      }

      return true;
    });
  }, [transactions, startDate, endDate, selectedCustomerId, selectedCustomerObj]);

  // Comprehensive Real Financial Breakdown (Excluding Hosting & Digital Infrastructure)
  const financialMetrics = useMemo(() => {
    let totalRevenue = 0;
    let hardwareRevenue = 0;
    let servicesRevenue = 0;
    let hardwareCOGS = 0;
    const billedServiceIds = new Set<string>();
    const serviceBreakdown: Array<{ source: string; name: string; amount: number; date: string }> = [];

    filteredOrders.forEach(order => {
      if ((order as any).platform === 'hosting' || (order as any).isHostingOrder || order.type === 'hosting' || order.type === 'domain') return;

      if (order.items && order.items.length > 0) {
        const orderDiscount = Number(order.discountAmount) || 0;
        const nonHostingItems = order.items.filter(item => {
          const itemType = (item as any).itemType || '';
          const itemCat = ((item as any).category || '').toLowerCase();
          return !(itemType === 'hosting' || itemType === 'domain' || itemType === 'domain_renewal' || itemType === 'domain_transfer' || itemType === 'ssl' || itemCat.includes('hosting') || itemCat.includes('domain'));
        });

        if (nonHostingItems.length > 0) {
          const orderSubtotal = order.items.reduce((sum: number, i: any) => sum + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);

          nonHostingItems.forEach(item => {
            const rawItemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
            let itemDiscount = 0;
            if (orderSubtotal > 0 && orderDiscount > 0) {
              itemDiscount = orderDiscount * (rawItemTotal / orderSubtotal);
            }
            const itemPrice = rawItemTotal - itemDiscount; // Net revenue for this item
            totalRevenue += itemPrice;

            if (item.id && String(item.id).startsWith('svc-')) billedServiceIds.add(String(item.id).replace('svc-', ''));

            const itemType = (item as any).itemType || '';

            if (itemType === 'service' || item.isCustomService) {
              servicesRevenue += itemPrice;
              serviceBreakdown.push({ source: 'Order ' + (order.documentNumber || order.id), name: item.name || 'Custom Service', amount: itemPrice, date: order.createdAt });
            } else {
              hardwareRevenue += itemPrice;
              const savedCostPrice = (item as any).costPrice;
              const knownCost = (savedCostPrice !== undefined && savedCostPrice !== null && savedCostPrice > 0)
                ? Number(savedCostPrice)
                : (productCostMap.get(item.id) || Number((item as any).purchasePrice) || ((Number(item.price) || 0) * 0.82));
              
              hardwareCOGS += knownCost * (Number(item.quantity) || 1);
            }
          });
        }
      } else {
        const orderTotal = Number(order.total) || 0;
        totalRevenue += orderTotal;
        hardwareRevenue += orderTotal;
        hardwareCOGS += (order as any).totalCost || (orderTotal * 0.82);
      }
    });

    // Process Standalone Services (outside the orders loop)
    serviceRecords.forEach(service => {
      if (billedServiceIds.has(String(service.id))) return;

      if (selectedCustomerId !== 'all' && selectedCustomerObj) {
        const sName = service.customerName || (service as any).customer?.name;
        const sPhone = service.customerPhone || (service as any).customer?.phone;
        const sId = (service as any).customerId;
        const matchId = sId && sId === selectedCustomerObj.id;
        const matchName = sName && selectedCustomerObj.name && sName.trim().toLowerCase() === selectedCustomerObj.name.trim().toLowerCase();
        const matchPhone = sPhone && selectedCustomerObj.phone && sPhone.trim() === selectedCustomerObj.phone.trim();
        if (!matchId && !matchName && !matchPhone) return;
      }

      const d = service.receivedAt || service.createdAt ? new Date(service.receivedAt || service.createdAt) : new Date(0);
      if (d >= startDate && d <= endDate && service.serviceCharge > 0 && (service.status === 'delivered' || service.status === 'ready' || service.status === 'repaired')) {
        totalRevenue += Number(service.serviceCharge) || 0;
        servicesRevenue += Number(service.serviceCharge) || 0;
        serviceBreakdown.push({ source: 'Service Tracking', name: service.productName || 'Repair', amount: Number(service.serviceCharge) || 0, date: service.receivedAt || service.createdAt });
      }
    });

    // Add manual income transactions
    const manualIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    totalRevenue += manualIncome;

    // Operational expenses (if filtered to customer, only customer-specific expenses)
    const operationalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const totalDirectCost = hardwareCOGS;
    const grossProfit = totalRevenue - totalDirectCost;
    const netProfit = grossProfit - operationalExpenses;
    const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      serviceBreakdown,
      manualIncome,
      totalRevenue,
      hardwareRevenue,
      servicesRevenue,
      hardwareCOGS,
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
  }, [filteredOrders, filteredTransactions, productCostMap, serviceRecords, startDate, endDate, selectedCustomerId, selectedCustomerObj]);

  // Periodic Chart Data (Daily / Monthly buckets)
  const chartData = useMemo(() => {
    const dataMap = new Map<string, { dateStr: string; label: string; revenue: number; cogs: number; expense: number; profit: number }>();

    const current = new Date(startDate);
    const step = timeframe === '1y' || timeframe === 'all' ? 'month' : 'day';
      const chartBilledServiceIds = new Set();

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
      if ((o as any).platform === 'hosting' || (o as any).isHostingOrder || o.type === 'hosting' || o.type === 'domain') return;

      const d = new Date(o.createdAt);
      const key = step === 'month' 
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : d.toISOString().split('T')[0];

      const entry = dataMap.get(key);
      if (entry) {
        let rev = 0;
        let cost = 0;

        if (o.items && o.items.length > 0) {
          const nonHostingItems = o.items.filter(i => {
            const iType = (i as any).itemType || '';
            const iCat = ((i as any).category || '').toLowerCase();
            return !(iType === 'hosting' || iType === 'domain' || iType === 'domain_renewal' || iType === 'domain_transfer' || iType === 'ssl' || iCat.includes('hosting') || iCat.includes('domain'));
          });

          if (nonHostingItems.length > 0) {
            const orderSubtotal = o.items.reduce((sum: number, i: any) => sum + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);
            const orderDiscount = Number(o.discountAmount) || 0;

            nonHostingItems.forEach(i => {
              const iQty = Number(i.quantity) || 1;
              const rawItemTotal = (Number(i.price) || 0) * iQty;
              let itemDiscount = 0;
              if (orderSubtotal > 0 && orderDiscount > 0) {
                itemDiscount = orderDiscount * (rawItemTotal / orderSubtotal);
              }
              rev += rawItemTotal - itemDiscount;

              if (i.id && String(i.id).startsWith('svc-')) chartBilledServiceIds.add(String(i.id).replace('svc-', ''));

              const iType = (i as any).itemType || '';
              if (iType !== 'service' && !(i as any).isCustomService) {
                const savedCostPrice = (i as any).costPrice;
                const knownCost = (savedCostPrice !== undefined && savedCostPrice !== null && savedCostPrice > 0)
                  ? Number(savedCostPrice)
                  : (productCostMap.get(i.id) || Number(i.price) * 0.8);
                cost += knownCost * iQty;
              }
            });
          }
        } else {
          rev = Number(o.total) || 0;
          cost = (o as any).totalCost || (rev * 0.8);
        }

        entry.revenue += rev;
        entry.cogs += cost;
      }
    });

    serviceRecords.forEach(s => {
      if (!s.receivedAt && !s.createdAt) return;

      if (selectedCustomerId !== 'all' && selectedCustomerObj) {
        const sName = s.customerName || (s as any).customer?.name;
        const sPhone = s.customerPhone || (s as any).customer?.phone;
        const sId = (s as any).customerId;
        const matchId = sId && sId === selectedCustomerObj.id;
        const matchName = sName && selectedCustomerObj.name && sName.trim().toLowerCase() === selectedCustomerObj.name.trim().toLowerCase();
        const matchPhone = sPhone && selectedCustomerObj.phone && sPhone.trim() === selectedCustomerObj.phone.trim();
        if (!matchId && !matchName && !matchPhone) return;
      }

      const d = s.receivedAt || s.createdAt ? new Date(s.receivedAt || s.createdAt) : new Date(0);
      const key = step === 'month' 
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : d.toISOString().split('T')[0];
        
      const entry = dataMap.get(key);
      if (entry && !chartBilledServiceIds.has(String(s.id)) && s.serviceCharge > 0 && (s.status === 'delivered' || s.status === 'ready' || s.status === 'repaired')) {
        entry.revenue += Number(s.serviceCharge);
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
  }, [filteredOrders, filteredTransactions, serviceRecords, startDate, endDate, timeframe, productCostMap, selectedCustomerId, selectedCustomerObj]);

  // Category Distribution (Excluding Hosting & Digital services)
  const categoryDistribution = useMemo(() => {
    const data = [
      { name: 'Hardware & E-Commerce', value: Math.round(financialMetrics.hardwareRevenue) },
      { name: 'Services & IT Repairs', value: Math.round(financialMetrics.servicesRevenue) },
      { name: 'Other Income', value: Math.round(financialMetrics.manualIncome) },
    ].filter(d => d.value > 0);

    return data.length > 0 ? data : [
      { name: 'Hardware & E-Commerce', value: 0 },
      { name: 'Services & IT Repairs', value: 0 },
    ];
  }, [financialMetrics]);

  // Daily Business Pulse metrics calculation for the selected single day
  const dailyMetrics = useMemo(() => {
    // 1. Day's Orders (retail / POS non-hosting, non-quotation)
    const dayOrders = orders.filter(o => {
      if ((o as any).platform === 'hosting' || (o as any).isHostingOrder || o.type === 'hosting' || o.type === 'domain') return false;
      if (o.status === 'cancelled' || o.type === 'quotation') return false;
      return isDateEqual(o.createdAt || (o as any).orderDate, dailySelectedDate);
    });

    let totalSalesAmount = 0;
    let totalUnitsSold = 0;
    let totalSalesCogs = 0;
    const uniqueProductIds = new Set<string>();

    dayOrders.forEach(o => {
      const orderTotal = Number(o.totalAmount || o.grandTotal || o.total || 0);
      totalSalesAmount += orderTotal;

      if (o.items && Array.isArray(o.items)) {
        o.items.forEach((item: any) => {
          const qty = Number(item.quantity) || 1;
          totalUnitsSold += qty;
          if (item.id) uniqueProductIds.add(String(item.id));

          const savedCost = (item as any).costPrice;
          const knownCost = (savedCost !== undefined && savedCost !== null && savedCost > 0)
            ? Number(savedCost)
            : (productCostMap.get(item.id) || (Number(item.price) || 0) * 0.8);
          totalSalesCogs += knownCost * qty;
        });
      }
    });

    const totalSalesCount = dayOrders.length;
    const dayGrossProfit = totalSalesAmount - totalSalesCogs;
    const dayGrossMargin = totalSalesAmount > 0 ? (dayGrossProfit / totalSalesAmount) * 100 : 0;
    const avgOrderValue = totalSalesCount > 0 ? totalSalesAmount / totalSalesCount : 0;

    // 2. Day's Purchases (supplier bills)
    const dayPurchases = purchases.filter(p => {
      return isDateEqual(p.date || p.createdAt, dailySelectedDate);
    });

    let totalPurchasesAmount = 0;
    let totalPurchasesPaid = 0;
    let purchasesUnitsCount = 0;

    dayPurchases.forEach(p => {
      const purTotal = Number(p.total || p.subtotal || p.grandTotal || 0);
      totalPurchasesAmount += purTotal;
      totalPurchasesPaid += Number(p.paidAmount || 0);
      if (p.items && Array.isArray(p.items)) {
        p.items.forEach((item: any) => {
          purchasesUnitsCount += Number(item.quantity) || 1;
        });
      }
    });
    const totalPurchasesCount = dayPurchases.length;

    // 3. Day's Transactions (Customer Collections, Supplier Payouts, OpEx)
    const dayCashTransactions: Array<{
      id: string;
      timeStr: string;
      direction: 'in' | 'out';
      typeLabel: string;
      partyName: string;
      partyType: 'customer' | 'vendor' | 'other';
      accountName: string;
      amount: number;
      refNumber: string;
      description: string;
    }> = [];

    let customerCollectionsAmount = 0;
    const customerPaidSet = new Set<string>();
    let customerCollectionsCount = 0;

    let supplierPayoutsAmount = 0;
    const supplierPaidSet = new Set<string>();
    let supplierPayoutsCount = 0;

    let dayExpensesAmount = 0;

    transactions.forEach(t => {
      const dateVal = t.date || (t as any).createdAt;
      if (!isDateEqual(dateVal, dailySelectedDate)) return;

      const desc = t.description || '';
      const descLower = desc.toLowerCase();
      const entityType = (t.entityType || '').toLowerCase();
      const txType = (t.type || '').toLowerCase();
      const amt = Number(t.amount) || 0;
      const timeStr = getTimeString(dateVal);
      const acc = t.paymentMethod || (t as any).accountName || 'Cash';
      const ref = t.documentNumber || t.referenceId || t.reference || '';

      const isCust =
        txType === 'payment_received' ||
        txType === 'money_receipt' ||
        (txType === 'payment' && entityType === 'customer') ||
        (entityType === 'customer' && (descLower.includes('due') || descLower.includes('receipt') || descLower.includes('collection')));

      const isSupp =
        txType === 'payment_made' ||
        (txType === 'payment' && entityType === 'vendor') ||
        (entityType === 'vendor' && (descLower.includes('paid') || descLower.includes('payment') || descLower.includes('vendor')));

      const isExp =
        txType === 'expense' ||
        txType === 'conveyance' ||
        txType === 'salary';

      if (isCust) {
        customerCollectionsAmount += amt;
        customerCollectionsCount += 1;
        const party = t.entityName || (t as any).customerName || 'Customer';
        if (party) customerPaidSet.add(party);

        dayCashTransactions.push({
          id: t.id,
          timeStr,
          direction: 'in',
          typeLabel: 'Customer Collection',
          partyName: party,
          partyType: 'customer',
          accountName: acc,
          amount: amt,
          refNumber: ref,
          description: desc || 'Customer Due Recovery',
        });
      } else if (isSupp) {
        supplierPayoutsAmount += amt;
        supplierPayoutsCount += 1;
        const party = t.entityName || (t as any).vendorName || 'Supplier';
        if (party) supplierPaidSet.add(party);

        dayCashTransactions.push({
          id: t.id,
          timeStr,
          direction: 'out',
          typeLabel: 'Supplier Payout',
          partyName: party,
          partyType: 'vendor',
          accountName: acc,
          amount: amt,
          refNumber: ref,
          description: desc || 'Supplier Due Payout',
        });
      } else if (isExp) {
        dayExpensesAmount += amt;
        dayCashTransactions.push({
          id: t.id,
          timeStr,
          direction: 'out',
          typeLabel: 'Expense',
          partyName: t.entityName || 'General Expense',
          partyType: 'other',
          accountName: acc,
          amount: amt,
          refNumber: ref,
          description: desc || 'Operating Expense',
        });
      }
    });

    const netCashFlow = customerCollectionsAmount - (supplierPayoutsAmount + dayExpensesAmount);

    return {
      dayOrders,
      totalSalesAmount,
      totalUnitsSold,
      totalSalesCount,
      totalUniqueProductsCount: uniqueProductIds.size,
      totalSalesCogs,
      dayGrossProfit,
      dayGrossMargin,
      avgOrderValue,
      dayPurchases,
      totalPurchasesAmount,
      totalPurchasesPaid,
      totalPurchasesCount,
      purchasesUnitsCount,
      dayCashTransactions,
      customerCollectionsAmount,
      customerCollectionsCount,
      customerCountPaid: customerPaidSet.size,
      supplierPayoutsAmount,
      supplierPayoutsCount,
      supplierCountPaid: supplierPaidSet.size,
      dayExpensesAmount,
      netCashFlow,
    };
  }, [orders, purchases, transactions, dailySelectedDate, productCostMap]);

  const formattedDailyDate = useMemo(() => {
    try {
      const parts = dailySelectedDate.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      }
    } catch {}
    return dailySelectedDate;
  }, [dailySelectedDate]);

  // Export Analytics to CSV
  const handleExportCSV = () => {
    if (activeTab === 'daily_pulse') {
      const summaryRows = [
        ['Date', `"${dailySelectedDate}"`],
        ['Total Sales Amount (BDT)', dailyMetrics.totalSalesAmount],
        ['Total Units / Products Sold', dailyMetrics.totalUnitsSold],
        ['Total Sales Orders / Invoices', dailyMetrics.totalSalesCount],
        ['Total Purchases Amount (BDT)', dailyMetrics.totalPurchasesAmount],
        ['Total Purchases Count', dailyMetrics.totalPurchasesCount],
        ['Customer Collections (BDT)', dailyMetrics.customerCollectionsAmount],
        ['Customers Who Paid Count', dailyMetrics.customerCountPaid],
        ['Supplier Payouts (BDT)', dailyMetrics.supplierPayoutsAmount],
        ['Suppliers Paid Count', dailyMetrics.supplierCountPaid],
        ['Operating Expenses (BDT)', dailyMetrics.dayExpensesAmount],
        ['Net Daily Cash Flow (BDT)', dailyMetrics.netCashFlow],
        ['Gross Profit (BDT)', dailyMetrics.dayGrossProfit],
        ['Gross Margin (%)', `${dailyMetrics.dayGrossMargin.toFixed(1)}%`],
        [],
        ['--- DAY TRANSACTIONS DETAIL ---'],
        ['Time', 'Direction', 'Type', 'Party', 'Account/Method', 'Reference', 'Amount (BDT)', 'Description'],
        ...dailyMetrics.dayCashTransactions.map(t => [
          `"${t.timeStr}"`,
          `"${t.direction.toUpperCase()}"`,
          `"${t.typeLabel}"`,
          `"${t.partyName.replace(/"/g, '""')}"`,
          `"${t.accountName.replace(/"/g, '""')}"`,
          `"${t.refNumber.replace(/"/g, '""')}"`,
          t.amount,
          `"${t.description.replace(/"/g, '""')}"`,
        ])
      ];

      const csvContent = 'data:text/csv;charset=utf-8,' + summaryRows.map(e => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `CLICK2IT_Daily_Pulse_${dailySelectedDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (activeTab === 'by_customer') {
      const headers = ['Rank', 'Customer Name', 'Phone', 'Orders Count', 'Gross Revenue (BDT)', 'Direct COGS (BDT)', 'Net Profit (BDT)', 'Net Margin (%)', 'Last Order Date'];
      const rows = filteredCustomerProfitability.map((c, idx) => [
        idx + 1,
        `"${(c.customerName || '').replace(/"/g, '""')}"`,
        `"${(c.customerPhone || '').replace(/"/g, '""')}"`,
        c.orderCount,
        c.revenue,
        c.cogs,
        c.profit,
        `${c.margin.toFixed(1)}%`,
        c.lastOrderDate ? `"${new Date(c.lastOrderDate).toLocaleDateString()}"` : 'N/A'
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [
        headers.join(','),
        ...rows.map(e => e.join(','))
      ].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `CLICK2IT_Customer_Profitability_${timeframe}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

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
    const filenamePrefix = selectedCustomerId !== 'all' && selectedCustomerObj 
      ? `CLICK2IT_${selectedCustomerObj.name.replace(/[^a-zA-Z0-9]/g, '_')}_Profit_Analytics`
      : 'CLICK2IT_Profit_Analytics';
    link.setAttribute('download', `${filenamePrefix}_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalCustomerProfit = useMemo(() => {
    return customerProfitability.reduce((sum, c) => sum + c.profit, 0);
  }, [customerProfitability]);

  const avgCustomerProfit = useMemo(() => {
    return customerProfitability.length > 0 ? Math.round(totalCustomerProfit / customerProfitability.length) : 0;
  }, [totalCustomerProfit, customerProfitability]);

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

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Timeframe Selector */}
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
            <Calendar size={15} className="text-gray-500 ml-1.5" />
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 cursor-pointer outline-none pr-3"
            >
              <option value="today">Today (আজকে)</option>
              <option value="yesterday">Yesterday (গতকাল)</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="this_month">This Month</option>
              <option value="90d">Last Quarter (90d)</option>
              <option value="1y">Last Year (365d)</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* Customer Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
            <User size={15} className="text-gray-500 ml-1.5" />
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 cursor-pointer outline-none pr-2 max-w-[170px] truncate"
              title="Filter analytics by customer"
            >
              <option value="all">All Customers</option>
              {customerList.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </select>
            {selectedCustomerId !== 'all' && (
              <button
                onClick={() => setSelectedCustomerId('all')}
                className="p-1 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-700 transition"
                title="Clear customer filter"
              >
                <X size={13} />
              </button>
            )}
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

      {/* View Switcher: Overview vs By Customer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2",
              activeTab === 'overview'
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <TrendingUp size={14} />
            Overview & P&L Trends
          </button>
          <button
            onClick={() => setActiveTab('by_customer')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2",
              activeTab === 'by_customer'
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <Users size={14} />
            By Customer (Profitability Ranking)
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-black",
              activeTab === 'by_customer' ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700"
            )}>
              {customerProfitability.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('daily_pulse')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2",
              activeTab === 'daily_pulse'
                ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <Activity size={14} />
            Daily Business Pulse (দৈনিক হিসাব)
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-black",
              activeTab === 'daily_pulse' ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"
            )}>
              {dailyMetrics.totalSalesCount} Sales
            </span>
          </button>
        </div>

        {selectedCustomerId !== 'all' && selectedCustomerObj && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 font-semibold self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span>Customer Filtered: <strong className="font-bold">{selectedCustomerObj.name}</strong></span>
            <button
              onClick={() => setSelectedCustomerId('all')}
              className="ml-1 p-0.5 text-blue-500 hover:text-blue-900 rounded"
              title="Clear customer filter and view store overall"
            >
              <X size={13} />
            </button>
          </div>
        )}
      </div>

      {activeTab === 'by_customer' ? (
        /* ================= By Customer Tab View ================= */
        <div className="space-y-6">
          {/* Customer KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Customers</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">{customerProfitability.length}</p>
              <p className="text-xs text-gray-500 mt-2">Transacted in selected period</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Top Profitable Customer</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <p className="text-lg font-black text-gray-900 truncate">
                {customerProfitability[0]?.customerName || 'None'}
              </p>
              <p className="text-xs text-emerald-600 font-bold mt-2">
                Profit: {formatCurrency(customerProfitability[0]?.profit || 0)}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Customer Profit</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600">
                {formatCurrency(totalCustomerProfit)}
              </p>
              <p className="text-xs text-gray-500 mt-2">Gross margin before general OpEx</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Avg Profit / Customer</span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">
                {formatCurrency(avgCustomerProfit)}
              </p>
              <p className="text-xs text-gray-500 mt-2">Across all active customers</p>
            </div>
          </div>

          {/* Customer Profitability Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Customer Profitability Ranking</h3>
                <p className="text-xs text-gray-500 mt-0.5">Ranked by highest net profit contribution</p>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customer name or phone..."
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="py-3.5 px-4 w-14 text-center">Rank</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4 text-center">Orders</th>
                    <th className="py-3.5 px-4">Gross Revenue</th>
                    <th className="py-3.5 px-4">Direct COGS</th>
                    <th className="py-3.5 px-4">Net Profit</th>
                    <th className="py-3.5 px-4 text-center">Margin %</th>
                    <th className="py-3.5 px-4">Last Order</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomerProfitability.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-gray-400 text-xs">
                        No customer transactions found for this period.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomerProfitability.map((c, idx) => (
                      <tr key={c.id ?? c.customerId ?? idx} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-4 text-center">
                          <span className={cn(
                            "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                            idx === 0 ? "bg-amber-100 text-amber-800 border border-amber-300" :
                            idx === 1 ? "bg-slate-200 text-slate-700" :
                            idx === 2 ? "bg-amber-50 text-amber-700" :
                            "text-gray-400"
                          )}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {c.customerName ? c.customerName.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 text-sm truncate">{c.customerName}</p>
                              <p className="text-[11px] text-gray-500 font-mono">{c.customerPhone || 'No phone'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-gray-700">
                          {c.orderCount}
                        </td>
                        <td className="py-3 px-4 text-blue-600 font-semibold">
                          {formatCurrency(c.revenue)}
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {formatCurrency(c.cogs)}
                        </td>
                        <td className={cn(
                          "py-3 px-4 font-bold",
                          c.profit >= 0 ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {formatCurrency(c.profit)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-bold",
                            c.margin >= 25 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            c.margin > 0 ? "bg-blue-50 text-blue-700 border border-blue-200" :
                            "bg-rose-50 text-rose-700 border border-rose-200"
                          )}>
                            {c.margin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-500">
                          {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedCustomerId(c.id);
                              setActiveTab('overview');
                            }}
                            className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs transition inline-flex items-center gap-1 border border-emerald-200"
                            title="Analyze this customer's P&L and trend"
                          >
                            Analyze
                            <ArrowRight size={12} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'daily_pulse' ? (
        /* ================= Daily Business Pulse Tab View ================= */
        <div className="space-y-6">
          {/* Quick Date Selector Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900">দৈনিক ব্যবসার হিসাব (Daily Business Pulse)</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                    Day Overview
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Showing complete daily summary for: <strong className="text-gray-800 font-semibold">{formattedDailyDate}</strong>
                </p>
              </div>
            </div>

            {/* Quick Date Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  const d = new Date();
                  const yyyy = d.getFullYear();
                  const mm = String(d.getMonth() + 1).padStart(2, '0');
                  const dd = String(d.getDate()).padStart(2, '0');
                  setDailySelectedDate(`${yyyy}-${mm}-${dd}`);
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5",
                  (() => {
                    const d = new Date();
                    const cur = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    return dailySelectedDate === cur;
                  })()
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                )}
              >
                Today (আজকে)
              </button>

              <button
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  const yyyy = d.getFullYear();
                  const mm = String(d.getMonth() + 1).padStart(2, '0');
                  const dd = String(d.getDate()).padStart(2, '0');
                  setDailySelectedDate(`${yyyy}-${mm}-${dd}`);
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5",
                  (() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 1);
                    const yest = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    return dailySelectedDate === yest;
                  })()
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                )}
              >
                Yesterday (গতকাল)
              </button>

              {/* Date Input */}
              <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-200">
                <Calendar size={14} className="text-gray-500" />
                <input
                  type="date"
                  value={dailySelectedDate}
                  onChange={(e) => {
                    if (e.target.value) setDailySelectedDate(e.target.value);
                  }}
                  className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 outline-none cursor-pointer"
                />
              </div>

              <button
                onClick={handleRefreshLive}
                disabled={loading}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition"
                title="Refresh Live Data"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* 7 Core KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Daily Sales Revenue */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">কয় টাকার সেল (Sales Revenue)</span>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">{formatCurrency(dailyMetrics.totalSalesAmount)}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-xs">
                <span className="text-gray-500">মোট বিক্রয় মূল্য</span>
                <span className="font-bold text-emerald-600">{dailyMetrics.totalSalesCount} টি ইনভয়েস</span>
              </div>
            </div>

            {/* 2. Total Products Quantity Sold */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">কয়টা প্রোডাক্ট গেল (Units Sold)</span>
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">{dailyMetrics.totalUnitsSold} <span className="text-base font-bold text-gray-500">Pcs</span></p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-xs">
                <span className="text-gray-500">মোট ডেলিভারি/বিক্রি পণ্য</span>
                <span className="font-bold text-indigo-600">{dailyMetrics.totalUniqueProductsCount} ধরনের আইটেম</span>
              </div>
            </div>

            {/* 3. Total Sales Orders Count */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">কয়টা সেল করল (Orders / Invoices)</span>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">{dailyMetrics.totalSalesCount} <span className="text-base font-bold text-gray-500">Orders</span></p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-xs">
                <span className="text-gray-500">গড় ইনভয়েস সাইজ</span>
                <span className="font-bold text-blue-600">{formatCurrency(dailyMetrics.avgOrderValue)}</span>
              </div>
            </div>

            {/* 4. Purchases from Suppliers */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">সাপ্লায়ার পারচেস (Purchases)</span>
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                  <Truck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">{formatCurrency(dailyMetrics.totalPurchasesAmount)}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-xs">
                <span className="text-gray-500">কয়টা পারচেস করল</span>
                <span className="font-bold text-purple-600">{dailyMetrics.totalPurchasesCount} টি বিল ({dailyMetrics.purchasesUnitsCount} pcs)</span>
              </div>
            </div>

            {/* 5. Customer Collections */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">কাস্টমারের টাকা আনল (Money In)</span>
                <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600">{formatCurrency(dailyMetrics.customerCollectionsAmount)}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-xs">
                <span className="text-gray-500">কয়টা কাস্টমারের টাকা</span>
                <span className="font-bold text-teal-700">{dailyMetrics.customerCountPaid} জন কাস্টমার ({dailyMetrics.customerCollectionsCount} রিসিট)</span>
              </div>
            </div>

            {/* 6. Supplier Payouts */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">সাপ্লায়ারকে দিল (Money Out)</span>
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-rose-600">{formatCurrency(dailyMetrics.supplierPayoutsAmount)}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-xs">
                <span className="text-gray-500">কয়টা সাপ্লায়ারকে দিল</span>
                <span className="font-bold text-rose-700">{dailyMetrics.supplierCountPaid} জন ভেন্ডর ({dailyMetrics.supplierPayoutsCount} পেমেন্ট)</span>
              </div>
            </div>

            {/* 7. Gross Profit & Net Pulse */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition sm:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">দিনের লাভ ও মার্জিন (Gross Profit & Margin)</span>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <p className="text-2xl font-black text-gray-900">{formatCurrency(dailyMetrics.dayGrossProfit)}</p>
                <span className={cn(
                  "px-2 py-0.5 rounded-md text-xs font-black",
                  dailyMetrics.dayGrossMargin >= 20 ? "bg-emerald-50 text-emerald-700" :
                  dailyMetrics.dayGrossMargin > 0 ? "bg-blue-50 text-blue-700" :
                  "bg-rose-50 text-rose-700"
                )}>
                  মার্জিন {dailyMetrics.dayGrossMargin.toFixed(1)}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-100 text-xs">
                <div className="text-gray-500">
                  বিক্রিত মালের ক্রয়মূল্য (COGS): <strong className="text-gray-700 font-semibold">{formatCurrency(dailyMetrics.totalSalesCogs)}</strong>
                </div>
                <div className="text-right">
                  <span className="text-gray-500">দিনের নিট ক্যাশ ইনফ্লো: </span>
                  <strong className={cn(
                    "font-bold",
                    dailyMetrics.netCashFlow >= 0 ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {formatCurrency(dailyMetrics.netCashFlow)}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Breakdown Detail Section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Sub-tab Switcher Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setDailyDetailTab('sales')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5",
                    dailyDetailTab === 'sales'
                      ? "bg-white text-gray-900 shadow-xs border border-gray-200"
                      : "text-gray-500 hover:text-gray-800"
                  )}
                >
                  <ShoppingBag size={14} className="text-emerald-600" />
                  <span>আজকের সেল্স (Sales - {dailyMetrics.dayOrders.length})</span>
                </button>

                <button
                  onClick={() => setDailyDetailTab('purchases')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5",
                    dailyDetailTab === 'purchases'
                      ? "bg-white text-gray-900 shadow-xs border border-gray-200"
                      : "text-gray-500 hover:text-gray-800"
                  )}
                >
                  <Truck size={14} className="text-purple-600" />
                  <span>আজকের পারচেস (Purchases - {dailyMetrics.dayPurchases.length})</span>
                </button>

                <button
                  onClick={() => setDailyDetailTab('cashflow')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5",
                    dailyDetailTab === 'cashflow'
                      ? "bg-white text-gray-900 shadow-xs border border-gray-200"
                      : "text-gray-500 hover:text-gray-800"
                  )}
                >
                  <ArrowDownLeft size={14} className="text-teal-600" />
                  <span>ক্যাশ ও ডিউ লেনদেন (Transactions - {dailyMetrics.dayCashTransactions.length})</span>
                </button>
              </div>

              <span className="text-xs text-gray-400 font-medium">
                Detailed records for {dailySelectedDate}
              </span>
            </div>

            {/* Sub-tab 1: Daily Sales Orders */}
            {dailyDetailTab === 'sales' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/80 text-gray-600 text-xs uppercase tracking-wider font-bold border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4">Invoice / Order #</th>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Products & Quantities</th>
                      <th className="py-3 px-4 text-right">Order Total</th>
                      <th className="py-3 px-4 text-center">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dailyMetrics.dayOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400 text-xs">
                          এই তারিখে কোনো সেল্স অর্ডার তৈরি হয়নি।
                        </td>
                      </tr>
                    ) : (
                      dailyMetrics.dayOrders.map((o: any) => {
                        const itemsSummary = (o.items || [])
                          .map((i: any) => `${i.name || i.title || 'Product'} (${i.quantity || 1}x)`)
                          .join(', ');
                        const timeStr = getTimeString(o.createdAt || o.orderDate);
                        const orderTotal = Number(o.totalAmount || o.grandTotal || o.total || 0);

                        return (
                          <tr key={o.id} className="hover:bg-gray-50/60 transition">
                            <td className="py-3 px-4 font-bold text-gray-900">
                              {o.orderNumber || o.invoiceNumber || o.id.slice(0, 8)}
                            </td>
                            <td className="py-3 px-4 text-xs text-gray-500">
                              {timeStr || 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-gray-800 text-xs">{o.customerName || 'Walk-in Customer'}</p>
                              {o.customerPhone && <p className="text-[11px] text-gray-400">{o.customerPhone}</p>}
                            </td>
                            <td className="py-3 px-4 text-xs text-gray-600 max-w-xs truncate" title={itemsSummary}>
                              {itemsSummary || 'Standard Sale'}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-gray-900">
                              {formatCurrency(orderTotal)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                o.paymentStatus === 'paid' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                o.paymentStatus === 'partial' ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                "bg-rose-50 text-rose-700 border border-rose-200"
                              )}>
                                {o.paymentStatus || 'Completed'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sub-tab 2: Daily Purchases */}
            {dailyDetailTab === 'purchases' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/80 text-gray-600 text-xs uppercase tracking-wider font-bold border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4">Document / Memo #</th>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Supplier / Vendor</th>
                      <th className="py-3 px-4">Items Summary</th>
                      <th className="py-3 px-4 text-right">Bill Total</th>
                      <th className="py-3 px-4 text-right">Paid Amount</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dailyMetrics.dayPurchases.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                          এই তারিখে কোনো সাপ্লায়ার পারচেস বা বিল রেকর্ড করা হয়নি।
                        </td>
                      </tr>
                    ) : (
                      dailyMetrics.dayPurchases.map((p: any) => {
                        const itemsSummary = (p.items || [])
                          .map((i: any) => `${i.name || i.productName || 'Item'} (${i.quantity || 1}x)`)
                          .join(', ');
                        const timeStr = getTimeString(p.date || p.createdAt);
                        const billTotal = Number(p.total || p.subtotal || p.grandTotal || 0);
                        const paid = Number(p.paidAmount || 0);

                        return (
                          <tr key={p.id} className="hover:bg-gray-50/60 transition">
                            <td className="py-3 px-4 font-bold text-gray-900">
                              {p.documentNumber || p.memoNumber || p.id.slice(0, 8)}
                            </td>
                            <td className="py-3 px-4 text-xs text-gray-500">
                              {timeStr || 'N/A'}
                            </td>
                            <td className="py-3 px-4 font-bold text-gray-800 text-xs">
                              {p.vendorName || 'Supplier'}
                            </td>
                            <td className="py-3 px-4 text-xs text-gray-600 max-w-xs truncate" title={itemsSummary}>
                              {itemsSummary || 'Inventory Purchase'}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-gray-900">
                              {formatCurrency(billTotal)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-600">
                              {formatCurrency(paid)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                p.paymentStatus === 'paid' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                p.paymentStatus === 'partial' ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                "bg-rose-50 text-rose-700 border border-rose-200"
                              )}>
                                {p.paymentStatus || (paid >= billTotal ? 'Paid' : 'Unpaid')}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sub-tab 3: Daily Transactions (Collections & Payouts) */}
            {dailyDetailTab === 'cashflow' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/80 text-gray-600 text-xs uppercase tracking-wider font-bold border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Flow Type</th>
                      <th className="py-3 px-4">Party Name</th>
                      <th className="py-3 px-4">Payment Account</th>
                      <th className="py-3 px-4">Reference / Memo</th>
                      <th className="py-3 px-4 text-right">Inflow (টাকা আনা)</th>
                      <th className="py-3 px-4 text-right">Outflow (টাকা দেওয়া)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dailyMetrics.dayCashTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                          এই তারিখে কোনো ক্যাশ বা ব্যাংক ট্রানজেকশন নেই।
                        </td>
                      </tr>
                    ) : (
                      dailyMetrics.dayCashTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50/60 transition">
                          <td className="py-3 px-4 text-xs text-gray-500 font-medium">
                            {t.timeStr || 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase inline-flex items-center gap-1",
                              t.direction === 'in' 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            )}>
                              {t.direction === 'in' ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                              {t.typeLabel}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-gray-900 text-xs">
                            {t.partyName}
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-600">
                            {t.accountName}
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-500 font-mono">
                            {t.refNumber || '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-emerald-600">
                            {t.direction === 'in' ? formatCurrency(t.amount) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-rose-600">
                            {t.direction === 'out' ? formatCurrency(t.amount) : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= Overview Tab View ================= */
        <div className="space-y-6">
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
                <span>{financialMetrics.orderCount} Orders {selectedCustomerId !== 'all' ? 'for this customer' : 'Completed'}</span>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mb-1">
                  <ShoppingBag size={14} className="text-blue-500" />
                  Product Sales
                </div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(financialMetrics.hardwareRevenue)}</p>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 border-t pt-2">
                Est. Cost: {formatCurrency(financialMetrics.hardwareCOGS)}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mb-1">
                  <Wrench size={14} className="text-indigo-500" />
                  Service & Repairs
                </div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(financialMetrics.servicesRevenue)}</p>
              </div>
              <p className="text-[11px] text-indigo-500 font-medium mt-2 border-t pt-2">
                100% Profit Margin
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mb-1">
                  <ArrowUpRight size={14} className="text-emerald-500" />
                  Other Income
                </div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(financialMetrics.manualIncome)}</p>
              </div>
              <p className="text-[11px] text-emerald-600 font-medium mt-2 border-t pt-2">
                Manual Transactions
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mb-1">
                  <ArrowDownRight size={14} className="text-red-500" />
                  OpEx & Expenses
                </div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(financialMetrics.operationalExpenses)}</p>
              </div>
              <p className="text-[11px] text-red-500 font-medium mt-2 border-t pt-2">
                Operating Overhead
              </p>
            </div>
          </div>

          {/* Service Breakdown Diagnostic (Collapsible) */}
          {financialMetrics.serviceBreakdown && financialMetrics.serviceBreakdown.length > 0 && (
            <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setShowServiceDiagnostic(!showServiceDiagnostic)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50/50 transition"
              >
                <div className="flex items-center gap-2">
                  <Wrench size={16} className="text-indigo-600" />
                  <div>
                    <span className="font-bold text-xs text-gray-900">Service Revenue Audit Breakdown</span>
                    <span className="ml-2 text-xs text-gray-500">({financialMetrics.serviceBreakdown.length} records totaling {formatCurrency(financialMetrics.servicesRevenue)})</span>
                  </div>
                </div>
                {showServiceDiagnostic ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>

              {showServiceDiagnostic && (
                <div className="max-h-60 overflow-y-auto border-t border-gray-100 p-2">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-500 sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Source</th>
                        <th className="py-2 px-3">Item Name</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {financialMetrics.serviceBreakdown.map((row, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3">{new Date(row.date).toLocaleDateString()}</td>
                          <td className="py-2 px-3">{row.source}</td>
                          <td className="py-2 px-3 font-medium">{row.name}</td>
                          <td className="py-2 px-3 text-right text-indigo-600 font-bold">{formatCurrency(row.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Main Charts: Profit & Loss Trend + Revenue Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trend Area Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Revenue, Costs & Net Profit Trend</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedCustomerId !== 'all' && selectedCustomerObj 
                      ? `Daily/monthly trajectory for ${selectedCustomerObj.name}`
                      : 'Real-time daily/monthly financial trajectory'}
                  </p>
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
      )}
    </div>
  );
};
export default AnalyticsDashboard;
