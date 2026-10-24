import React, { useState, useMemo } from 'react';
import { Order, Customer } from '../../../../types';
import { 
  Building2, 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Calendar, 
  ArrowUpRight, 
  DollarSign, 
  Search, 
  Filter, 
  ExternalLink,
  ChevronRight,
  Receipt,
  Phone,
  Mail,
  FolderGit2
} from 'lucide-react';
import { formatCurrency, cn } from '../../../../lib/utils';

interface BusinessUnitsTabProps {
  orders: Order[];
  customers: Customer[];
  setActiveTab?: (tab: string) => void;
  setSelectedLedgerEntity?: (entity: { id: string; name: string; type: 'customer' | 'vendor' }) => void;
}

export const BUSINESS_COMPANIES = [
  { id: 'spacezero', name: 'Spacezero', color: 'from-purple-600 to-indigo-700', badgeBg: 'bg-purple-100 text-purple-800 border-purple-200', activeRing: 'ring-purple-500' },
  { id: 'volumezero', name: 'Volumezero', color: 'from-blue-600 to-cyan-700', badgeBg: 'bg-blue-100 text-blue-800 border-blue-200', activeRing: 'ring-blue-500' },
  { id: 'simpletree', name: 'Simpletree', color: 'from-emerald-600 to-teal-700', badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200', activeRing: 'ring-emerald-500' },
  { id: 'main', name: 'Click2IT (Main)', color: 'from-slate-700 to-slate-900', badgeBg: 'bg-slate-100 text-slate-800 border-slate-200', activeRing: 'ring-slate-500' },
] as const;

export const BusinessUnitsTab: React.FC<BusinessUnitsTabProps> = ({
  orders = [],
  customers = [],
  setActiveTab,
  setSelectedLedgerEntity
}) => {
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'customers'>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'last_month'>('this_month');

  // Time boundaries
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  // Helper to normalize company identification
  const getOrderCompany = (order: Order): string => {
    return (order.company || 'main').toLowerCase();
  };

  const getCustomerCompany = (customer: Customer): string => {
    return (customer.company || 'main').toLowerCase();
  };

  // Company Metrics
  const metrics = useMemo(() => {
    const list = ['spacezero', 'volumezero', 'simpletree', 'main'];
    const map: Record<string, { totalOrders: number; totalRevenue: number; thisMonthOrders: number; thisMonthRevenue: number; customerCount: number }> = {};
    
    list.forEach(c => {
      map[c] = { totalOrders: 0, totalRevenue: 0, thisMonthOrders: 0, thisMonthRevenue: 0, customerCount: 0 };
    });

    customers.forEach(cust => {
      const comp = getCustomerCompany(cust);
      if (map[comp]) {
        map[comp].customerCount += 1;
      }
    });

    orders.forEach(order => {
      if (order.status === 'cancelled') return;
      const comp = getOrderCompany(order);
      if (!map[comp]) return;

      const rev = Number(order.total || order.paidAmount || 0);
      map[comp].totalOrders += 1;
      map[comp].totalRevenue += rev;

      if (order.createdAt && order.createdAt >= currentMonthStart) {
        map[comp].thisMonthOrders += 1;
        map[comp].thisMonthRevenue += rev;
      }
    });

    return map;
  }, [orders, customers, currentMonthStart]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (o.status === 'cancelled') return false;
      const comp = getOrderCompany(o);
      if (selectedCompany !== 'all' && comp !== selectedCompany) return false;

      if (dateFilter === 'this_month') {
        if (!o.createdAt || o.createdAt < currentMonthStart) return false;
      } else if (dateFilter === 'last_month') {
        if (!o.createdAt || o.createdAt < lastMonthStart || o.createdAt > lastMonthEnd) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = (o.documentNumber || o.id || '').toLowerCase().includes(q);
        const matchesName = (o.customerName || '').toLowerCase().includes(q);
        const matchesPhone = (o.customerPhone || '').toLowerCase().includes(q);
        const matchesProject = (o.projectName || '').toLowerCase().includes(q);
        if (!matchesId && !matchesName && !matchesPhone && !matchesProject) return false;
      }

      return true;
    });
  }, [orders, selectedCompany, dateFilter, searchQuery, currentMonthStart, lastMonthStart, lastMonthEnd]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const comp = getCustomerCompany(c);
      if (selectedCompany !== 'all' && comp !== selectedCompany) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (c.name || '').toLowerCase().includes(q);
        const matchesPhone = (c.phone || '').toLowerCase().includes(q);
        const matchesEmail = (c.email || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesEmail) return false;
      }

      return true;
    });
  }, [customers, selectedCompany, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#081621] p-6 md:p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[11px] font-black uppercase tracking-wider mb-2">
              <Building2 size={13} className="text-indigo-400" /> Multi-Company & Project Hub
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              Sister Concerns & Business Units
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
              Track projects, orders, revenues, and client directories across <strong>Spacezero</strong>, <strong>Volumezero</strong>, and <strong>Simpletree</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-bold">Timeframe:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer backdrop-blur-md transition-all"
            >
              <option value="this_month" className="text-slate-900">This Month</option>
              <option value="last_month" className="text-slate-900">Last Month</option>
              <option value="all" className="text-slate-900">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4 Company Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {BUSINESS_COMPANIES.map(company => {
          const compData = metrics[company.id] || { totalOrders: 0, totalRevenue: 0, thisMonthOrders: 0, thisMonthRevenue: 0, customerCount: 0 };
          const isSelected = selectedCompany === company.id;

          return (
            <div
              key={company.id}
              onClick={() => setSelectedCompany(selectedCompany === company.id ? 'all' : company.id)}
              className={cn(
                "relative bg-white rounded-2xl p-5 border transition-all cursor-pointer shadow-sm hover:shadow-md",
                isSelected 
                  ? "border-indigo-500 ring-2 ring-indigo-500 bg-indigo-50/20" 
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={cn("text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border", company.badgeBg)}>
                  {company.name}
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  {isSelected ? '● Filtered' : 'Click to filter'}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {dateFilter === 'this_month' ? 'This Month Revenue' : dateFilter === 'last_month' ? 'Last Month' : 'Total Revenue'}
                  </span>
                  <p className="text-xl font-black text-slate-900 mt-0.5">
                    {formatCurrency(dateFilter === 'this_month' ? compData.thisMonthRevenue : compData.totalRevenue)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Orders</span>
                    <span className="font-bold text-slate-800">
                      {dateFilter === 'this_month' ? compData.thisMonthOrders : compData.totalOrders}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Clients</span>
                    <span className="font-bold text-slate-800">{compData.customerCount}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Sub-nav & Search */}
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setActiveSubTab('orders')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                activeSubTab === 'orders'
                  ? "bg-[#081621] text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              )}
            >
              <ShoppingBag size={14} /> Orders & Projects ({filteredOrders.length})
            </button>
            <button
              onClick={() => setActiveSubTab('customers')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                activeSubTab === 'customers'
                  ? "bg-[#081621] text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              )}
            >
              <Users size={14} /> Associated Clients ({filteredCustomers.length})
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={activeSubTab === 'orders' ? "Search order, client, ref..." : "Search client name, phone..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            {selectedCompany !== 'all' && (
              <button
                onClick={() => setSelectedCompany('all')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-200 shrink-0"
              >
                Clear Company Filter (Showing {selectedCompany})
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Orders / Projects Table */}
        {activeSubTab === 'orders' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-black uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Invoice / Ref</th>
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Items / Project</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-right">Paid Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                      No orders found under {selectedCompany === 'all' ? 'the selected filter' : selectedCompany}.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => {
                    const compKey = getOrderCompany(order);
                    const compInfo = BUSINESS_COMPANIES.find(c => c.id === compKey) || { name: compKey, badgeBg: 'bg-slate-100 text-slate-700' };

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {order.documentNumber || order.id.slice(0, 8)}
                          {order.workOrderNumber && (
                            <span className="block text-[10px] font-normal text-slate-500">
                              Ref: {order.workOrderNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase border", compInfo.badgeBg)}>
                            {compInfo.name}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800 block">{order.customerName || 'Walk-in'}</span>
                          {order.customerPhone && (
                            <span className="text-[11px] text-slate-500">{order.customerPhone}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                          {order.projectName ? (
                            <span className="font-bold text-indigo-600 flex items-center gap-1">
                              <FolderGit2 size={12} /> {order.projectName}
                            </span>
                          ) : (
                            order.items?.map((it: any) => it.name).join(', ') || 'N/A'
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">
                          {formatCurrency(order.paidAmount || 0)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold capitalize",
                            order.status === 'delivered' || order.status === 'completed'
                              ? "bg-emerald-100 text-emerald-800"
                              : order.status === 'pending'
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          )}>
                            {order.status || 'delivered'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Customers Table */}
        {activeSubTab === 'customers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-black uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Client Name</th>
                  <th className="py-3.5 px-4">Assigned Company</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Address</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                      No clients found assigned to {selectedCompany === 'all' ? 'the selected filter' : selectedCompany}.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map(cust => {
                    const compKey = getCustomerCompany(cust);
                    const compInfo = BUSINESS_COMPANIES.find(c => c.id === compKey) || { name: compKey, badgeBg: 'bg-slate-100 text-slate-700' };

                    return (
                      <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 font-black text-slate-700 flex items-center justify-center shrink-0">
                              {(cust.name || 'C').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{cust.name}</span>
                              <span className="text-[10px] text-slate-400">ID: {cust.id.slice(0, 8)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn("px-2.5 py-1 rounded text-[10px] font-bold uppercase border", compInfo.badgeBg)}>
                            {compInfo.name}
                          </span>
                        </td>
                        <td className="py-3 px-4 space-y-1">
                          {cust.phone && (
                            <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                              <Phone size={12} className="text-slate-400" /> {cust.phone}
                            </span>
                          )}
                          {cust.email && (
                            <span className="flex items-center gap-1.5 text-slate-500">
                              <Mail size={12} className="text-slate-400" /> {cust.email}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                          {cust.address || '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {setSelectedLedgerEntity && setActiveTab && (
                            <button
                              onClick={() => {
                                setSelectedLedgerEntity({ id: cust.id, name: cust.name, type: 'customer' });
                                setActiveTab('customer_due_list');
                              }}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors"
                            >
                              Ledger History
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessUnitsTab;
