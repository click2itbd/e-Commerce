import React, { useState, useMemo, useEffect } from 'react';
import { Order, Customer } from '../../../../types';
import { 
  Building2, 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Calendar, 
  DollarSign, 
  Search, 
  Filter, 
  ChevronRight, 
  Receipt, 
  Phone, 
  Mail,
  Sparkles,
  Box,
  Trees,
  Store,
  CheckCircle2,
  ChevronDown,
  Check,
  X,
  Eye,
  Printer,
  Download,
  RefreshCw,
  AlertCircle,
  Plus,
  ArrowRight,
  ExternalLink,
  Tag,
  Edit2,
  Trash2
} from 'lucide-react';
import { 
  useBusinessUnits, 
  DEFAULT_COMPANIES, 
  getCompanyTheme, 
  getCompanyIcon 
} from '../../../../hooks/useBusinessUnits';
import { CompanyModal } from './CompanyModal';
import { BusinessCompany } from '../../../../types';
import { formatCurrency, cn } from '../../../../lib/utils';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { toast } from 'react-hot-toast';

interface BusinessUnitsTabProps {
  orders: Order[];
  customers: Customer[];
  setActiveTab?: (tab: string) => void;
  setSelectedLedgerEntity?: (entity: { id: string; name: string; type: 'customer' | 'vendor' }) => void;
  fetchData?: () => Promise<void>;
  generatePDF?: (order: any, type?: any, settings?: any, action?: any) => any;
  settings?: any;
}

export const BUSINESS_COMPANIES = DEFAULT_COMPANIES;

export const BusinessUnitsTab: React.FC<BusinessUnitsTabProps> = ({
  orders = [],
  customers = [],
  setActiveTab,
  setSelectedLedgerEntity,
  fetchData,
  generatePDF,
  settings
}) => {
  const { 
    companies, 
    addCompany, 
    updateCompany, 
    deleteCompany 
  } = useBusinessUnits();

  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<BusinessCompany | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<BusinessCompany | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Local state for instant optimistic updates
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);
  const [localCustomers, setLocalCustomers] = useState<Customer[]>(customers);

  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  useEffect(() => {
    setLocalCustomers(customers);
  }, [customers]);

  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'customers'>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'this_month' | 'last_month' | 'today' | 'all'>('this_month');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Batch selection
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [batchCompany, setBatchCompany] = useState<string>('spacezero');
  const [isUpdatingBatch, setIsUpdatingBatch] = useState(false);

  // Active Company changer dropdown state
  const [activeDropdownOrderId, setActiveDropdownOrderId] = useState<string | null>(null);
  const [activeDropdownCustId, setActiveDropdownCustId] = useState<string | null>(null);

  // Order Details Modal
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Time boundaries
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
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

  // Smart suggestions for unassigned past records
  const smartSuggestions = useMemo(() => {
    const list: { order: Order; suggestedCompany: string; reason: string }[] = [];
    const nonMainCompanies = companies.filter(c => c.id !== 'main');

    localOrders.forEach(order => {
      const currentComp = getOrderCompany(order);
      const text = `${order.customerName || ''} ${order.notes || ''} ${order.workOrderNumber || ''}`.toLowerCase();
      
      for (const comp of nonMainCompanies) {
        if (text.includes(comp.id.toLowerCase()) || text.includes(comp.name.toLowerCase())) {
          if (currentComp !== comp.id) {
            list.push({ order, suggestedCompany: comp.id, reason: `Customer / Ref mentions "${comp.name}"` });
            break;
          }
        }
      }
    });

    return list;
  }, [localOrders, companies]);

  // Company Metrics
  const metrics = useMemo(() => {
    const map: Record<string, { 
      totalOrders: number; 
      totalRevenue: number; 
      thisMonthOrders: number; 
      thisMonthRevenue: number; 
      todayOrders: number;
      todayRevenue: number;
      customerCount: number 
    }> = {};
    
    companies.forEach(c => {
      map[c.id] = { totalOrders: 0, totalRevenue: 0, thisMonthOrders: 0, thisMonthRevenue: 0, todayOrders: 0, todayRevenue: 0, customerCount: 0 };
    });

    localCustomers.forEach(cust => {
      const comp = getCustomerCompany(cust);
      if (!map[comp]) {
        map[comp] = { totalOrders: 0, totalRevenue: 0, thisMonthOrders: 0, thisMonthRevenue: 0, todayOrders: 0, todayRevenue: 0, customerCount: 0 };
      }
      map[comp].customerCount += 1;
    });

    let allRev = 0;
    let allOrders = 0;
    let allThisMonthRev = 0;
    let allThisMonthOrders = 0;

    localOrders.forEach(order => {
      if (order.status === 'cancelled') return;
      const comp = getOrderCompany(order);
      const rev = Number(order.total || order.paidAmount || 0);

      allRev += rev;
      allOrders += 1;

      if (order.createdAt) {
        if (order.createdAt >= currentMonthStart) {
          allThisMonthRev += rev;
          allThisMonthOrders += 1;
        }
      }

      if (!map[comp]) {
        map[comp] = { totalOrders: 0, totalRevenue: 0, thisMonthOrders: 0, thisMonthRevenue: 0, todayOrders: 0, todayRevenue: 0, customerCount: 0 };
      }

      map[comp].totalOrders += 1;
      map[comp].totalRevenue += rev;

      if (order.createdAt) {
        if (order.createdAt.split('T')[0] === todayStr) {
          map[comp].todayOrders += 1;
          map[comp].todayRevenue += rev;
        }
        if (order.createdAt >= currentMonthStart) {
          map[comp].thisMonthOrders += 1;
          map[comp].thisMonthRevenue += rev;
        }
      }
    });

    return {
      perCompany: map,
      total: {
        totalRevenue: allRev,
        totalOrders: allOrders,
        thisMonthRevenue: allThisMonthRev,
        thisMonthOrders: allThisMonthOrders,
        customerCount: localCustomers.length
      }
    };
  }, [localOrders, localCustomers, currentMonthStart, todayStr, companies]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return localOrders.filter(o => {
      if (o.status === 'cancelled') return false;
      const comp = getOrderCompany(o);
      if (selectedCompany !== 'all' && comp !== selectedCompany) return false;

      if (dateFilter === 'today') {
        if (!o.createdAt || o.createdAt.split('T')[0] !== todayStr) return false;
      } else if (dateFilter === 'this_month') {
        if (!o.createdAt || o.createdAt < currentMonthStart) return false;
      } else if (dateFilter === 'last_month') {
        if (!o.createdAt || o.createdAt < lastMonthStart || o.createdAt > lastMonthEnd) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = (o.documentNumber || o.id || '').toLowerCase().includes(q);
        const matchesName = (o.customerName || '').toLowerCase().includes(q);
        const matchesPhone = (o.customerPhone || '').toLowerCase().includes(q);
        const matchesWorkOrder = (o.workOrderNumber || '').toLowerCase().includes(q);
        const matchesItems = o.items?.some(it => (it.name || '').toLowerCase().includes(q));
        if (!matchesId && !matchesName && !matchesPhone  && !matchesWorkOrder && !matchesItems) return false;
      }

      return true;
    });
  }, [localOrders, selectedCompany, dateFilter, searchQuery, currentMonthStart, lastMonthStart, lastMonthEnd, todayStr]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return localCustomers.filter(c => {
      const comp = getCustomerCompany(c);
      if (selectedCompany !== 'all' && comp !== selectedCompany) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (c.name || '').toLowerCase().includes(q);
        const matchesPhone = (c.phone || '').toLowerCase().includes(q);
        const matchesEmail = (c.email || '').toLowerCase().includes(q);
        const matchesAddress = (c.address || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesAddress) return false;
      }

      return true;
    });
  }, [localCustomers, selectedCompany, searchQuery]);

  // Paginated Orders
  const totalPages = Math.ceil((activeSubTab === 'orders' ? filteredOrders.length : filteredCustomers.length) / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  // Reset page when filter or tab changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedOrderIds([]);
  }, [selectedCompany, activeSubTab, dateFilter, searchQuery]);

  // Handle single order company change
  const handleUpdateOrderCompany = async (orderId: string, newCompany: string) => {
    try {
      // Optimistic update
      setLocalOrders(prev => prev.map(o => o.id === orderId ? { ...o, company: newCompany } : o));
      setActiveDropdownOrderId(null);

      // Persist to Firestore
      await updateDoc(doc(db, 'orders', orderId), { company: newCompany });
      
      const compLabel = companies.find(c => c.id === newCompany)?.name || newCompany;
      toast.success(`Assigned to ${compLabel}`);

      if (fetchData) fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update company');
    }
  };

  // Handle single customer company change
  const handleUpdateCustomerCompany = async (customerId: string, newCompany: string) => {
    try {
      // Optimistic update
      setLocalCustomers(prev => prev.map(c => c.id === customerId ? { ...c, company: newCompany } : c));
      setActiveDropdownCustId(null);

      // Persist to Firestore
      await updateDoc(doc(db, 'customers', customerId), { company: newCompany });

      const compLabel = companies.find(c => c.id === newCompany)?.name || newCompany;
      toast.success(`Client assigned to ${compLabel}`);

      if (fetchData) fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update client company');
    }
  };

  // Handle batch reassignment
  const handleBatchReassign = async () => {
    if (selectedOrderIds.length === 0) return;
    setIsUpdatingBatch(true);
    try {
      const batch = writeBatch(db);
      selectedOrderIds.forEach(id => {
        batch.update(doc(db, 'orders', id), { company: batchCompany });
      });
      await batch.commit();

      // Optimistic update
      setLocalOrders(prev => prev.map(o => selectedOrderIds.includes(o.id) ? { ...o, company: batchCompany } : o));
      const compLabel = companies.find(c => c.id === batchCompany)?.name || batchCompany;
      toast.success(`Reassigned ${selectedOrderIds.length} orders to ${compLabel}`);
      setSelectedOrderIds([]);

      if (fetchData) fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to perform batch update');
    } finally {
      setIsUpdatingBatch(false);
    }
  };

  // Handle auto-assign suggestions
  const handleAutoAssignSuggestions = async () => {
    if (smartSuggestions.length === 0) return;
    try {
      const batch = writeBatch(db);
      smartSuggestions.forEach(s => {
        batch.update(doc(db, 'orders', s.order.id), { company: s.suggestedCompany });
        if (s.order.customerId) {
          batch.update(doc(db, 'customers', s.order.customerId), { company: s.suggestedCompany });
        }
      });
      await batch.commit();

      // Optimistic
      setLocalOrders(prev => {
        const map = new Map(smartSuggestions.map(s => [s.order.id, s.suggestedCompany]));
        return prev.map(o => map.has(o.id) ? { ...o, company: map.get(o.id) } : o);
      });

      toast.success(`Successfully auto-assigned ${smartSuggestions.length} orders!`);
      if (fetchData) fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to auto-assign');
    }
  };



  // Quick navigate to sales form with company preselected
  const handleCreateNewOrderForCompany = (companyId: string) => {
    if (setActiveTab) {
      try {
        const draft = localStorage.getItem('sales_form_draft');
        let parsed = draft ? JSON.parse(draft) : {};
        parsed.company = companyId;
        localStorage.setItem('sales_form_draft', JSON.stringify(parsed));
      } catch (e) {}
      setActiveTab('sales');
    }
  };

  const handleSaveCompany = async (companyData: any) => {
    if (editingCompany) {
      await updateCompany(editingCompany.id, companyData);
    } else {
      await addCompany(companyData);
    }
  };

  const handleConfirmDeleteCompany = async () => {
    if (!deletingCompany) return;
    try {
      setIsDeleting(true);
      await deleteCompany(deletingCompany.id);
      if (selectedCompany === deletingCompany.id) {
        setSelectedCompany('all');
      }
      setDeletingCompany(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete company');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#081621] p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-indigo-900/40">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[11px] font-black uppercase tracking-wider mb-3">
              <Building2 size={13} className="text-indigo-400" /> Multi-Company & Project Hub
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              Sister Concerns & Business Units
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Real-time monitoring and management of orders, revenues, and client directories across 
              {companies.filter(c => c.id !== 'main').map((c, idx, arr) => {
                const theme = getCompanyTheme(c.color);
                return (
                  <span key={c.id}>
                    <span className={cn("font-bold ml-1", theme.textColor)}>
                      {c.name}
                    </span>
                    {idx < arr.length - 1 ? (idx === arr.length - 2 ? ', and ' : ', ') : '.'}
                  </span>
                );
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Timeframe Picker */}
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 px-3 py-2 rounded-2xl backdrop-blur-md">
              <Calendar size={14} className="text-indigo-300" />
              <span className="text-xs text-slate-300 font-bold">Timeframe:</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="bg-transparent text-xs font-black text-white outline-none cursor-pointer pr-1"
              >
                <option value="today" className="text-slate-900">Today</option>
                <option value="this_month" className="text-slate-900">This Month</option>
                <option value="last_month" className="text-slate-900">Last Month</option>
                <option value="all" className="text-slate-900">All Time</option>
              </select>
            </div>

            {/* Add Company Button */}
            <button
              onClick={() => {
                setEditingCompany(null);
                setIsCompanyModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Building2 size={15} />
              <span>+ Add Company</span>
            </button>

            {/* Quick Create Sale Button */}
            {setActiveTab && (
              <button
                onClick={() => handleCreateNewOrderForCompany(selectedCompany !== 'all' ? selectedCompany : 'main')}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap cursor-pointer"
              >
                <Plus size={15} />
                <span>New Sale / Invoice</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Smart Suggestions Alert (When matching unassigned orders exist) */}
      {smartSuggestions.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle size={18} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                Smart Sister Concern Detection ({smartSuggestions.length} records found)
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                We detected {smartSuggestions.length} existing order(s) matching sister concerns by name (e.g., 
                <strong className="text-slate-900 ml-1">"{smartSuggestions[0].order.customerName}"</strong>).
              </p>
            </div>
          </div>
          <button
            onClick={handleAutoAssignSuggestions}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-sm transition-all whitespace-nowrap flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <Sparkles size={13} /> Auto-Assign All Now
          </button>
        </div>
      )}

      {/* Dynamic Cards Grid: All Units + All Companies + Add Company Button */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 0: All Business Units Overview */}
        <div
          onClick={() => setSelectedCompany('all')}
          className={cn(
            "relative bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-sm hover:shadow-md group flex flex-col justify-between",
            selectedCompany === 'all'
              ? "border-indigo-600 ring-2 ring-indigo-500 bg-indigo-50/30"
              : "border-slate-200 hover:border-slate-300"
          )}
        >
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-indigo-900 text-white flex items-center gap-1.5">
                <Building2 size={11} /> All Units
              </span>
              {selectedCompany === 'all' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-600 bg-indigo-100/80 px-2 py-0.5 rounded-full">
                  <Check size={10} /> Active
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600">
                  Click to view
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {dateFilter === 'today' ? "Today's Revenue" : dateFilter === 'this_month' ? 'This Month' : dateFilter === 'last_month' ? 'Last Month' : 'Total Revenue'}
                </span>
                <p className="text-lg font-black text-slate-900 tracking-tight">
                  {formatCurrency(dateFilter === 'this_month' ? metrics.total.thisMonthRevenue : metrics.total.totalRevenue, settings)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold uppercase">Orders</span>
                  <span className="font-bold text-slate-800">
                    {dateFilter === 'this_month' ? metrics.total.thisMonthOrders : metrics.total.totalOrders}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold uppercase">Clients</span>
                  <span className="font-bold text-slate-800">{metrics.total.customerCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Sister Concern Cards */}
        {companies.map(company => {
          const compData = metrics.perCompany[company.id] || { totalOrders: 0, totalRevenue: 0, thisMonthOrders: 0, thisMonthRevenue: 0, todayOrders: 0, todayRevenue: 0, customerCount: 0 };
          const isSelected = selectedCompany === company.id;
          const CompIcon = getCompanyIcon(company.iconName);
          const theme = getCompanyTheme(company.color);

          return (
            <div
              key={company.id}
              onClick={() => setSelectedCompany(selectedCompany === company.id ? 'all' : company.id)}
              className={cn(
                "relative bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-sm hover:shadow-md group flex flex-col justify-between",
                isSelected 
                  ? cn(theme.activeBorder, theme.lightBg) 
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className={cn("text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border flex items-center gap-1.5 shadow-2xs", theme.badgeBg)}>
                    <CompIcon size={12} /> {company.name}
                  </span>
                  <div className="flex items-center gap-1">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-700 bg-white/90 px-2 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
                        <Check size={10} /> Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600">
                        Filter
                      </span>
                    )}
                    {!company.isDefault && (
                      <div className="flex items-center ml-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCompany(company);
                            setIsCompanyModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                          title="Edit company"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingCompany(company);
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete company"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {dateFilter === 'today' ? "Today" : dateFilter === 'this_month' ? 'This Month' : dateFilter === 'last_month' ? 'Last Month' : 'Total Revenue'}
                    </span>
                    <p className="text-lg font-black text-slate-900 tracking-tight">
                      {formatCurrency(dateFilter === 'this_month' ? compData.thisMonthRevenue : dateFilter === 'today' ? compData.todayRevenue : compData.totalRevenue, settings)}
                    </p>
                    {dateFilter !== 'all' && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        All-Time: {formatCurrency(compData.totalRevenue, settings)}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold uppercase">Orders</span>
                      <span className="font-bold text-slate-800">
                        {dateFilter === 'this_month' ? compData.thisMonthOrders : dateFilter === 'today' ? compData.todayOrders : compData.totalOrders}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold uppercase">Clients</span>
                      <span className="font-bold text-slate-800">{compData.customerCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Add Order for this company */}
              <div className="pt-2 mt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateNewOrderForCompany(company.id);
                  }}
                  className="w-full py-1 px-2 rounded-lg text-[10px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-white border border-dashed border-slate-200 hover:border-indigo-300 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus size={11} /> New {company.name} Sale
                </button>
              </div>
            </div>
          );
        })}

        {/* Card: Add New Company */}
        <div
          onClick={() => {
            setEditingCompany(null);
            setIsCompanyModalOpen(true);
          }}
          className="relative bg-gradient-to-b from-slate-50/80 to-indigo-50/20 hover:from-indigo-50/40 hover:to-indigo-100/30 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-md group flex flex-col items-center justify-center text-center min-h-[170px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 group-hover:border-indigo-300 text-slate-400 group-hover:text-indigo-600 flex items-center justify-center mb-2.5 shadow-2xs group-hover:scale-110 transition-all">
            <Plus size={22} className="stroke-[2.5]" />
          </div>
          <span className="text-xs font-black text-slate-800 group-hover:text-indigo-700 transition-colors">
            Add Company
          </span>
          <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
            + New Sister Concern
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Sub-nav & Search */}
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveSubTab('orders')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                activeSubTab === 'orders'
                  ? "bg-[#081621] text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              )}
            >
              <ShoppingBag size={14} /> Orders ({filteredOrders.length})
            </button>
            <button
              onClick={() => setActiveSubTab('customers')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                activeSubTab === 'customers'
                  ? "bg-[#081621] text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              )}
            >
              <Users size={14} /> Associated Clients ({filteredCustomers.length})
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={activeSubTab === 'orders' ? "Search order, client, ref, items..." : "Search client name, phone..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {selectedCompany !== 'all' && (
              <button
                onClick={() => setSelectedCompany('all')}
                className="text-xs text-indigo-700 hover:text-indigo-900 font-bold bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl border border-indigo-200 shrink-0 transition-colors flex items-center gap-1.5"
              >
                <X size={12} /> Clear Filter ({selectedCompany})
              </button>
            )}
          </div>
        </div>

        {/* Batch Action Bar (When 1+ orders are selected) */}
        {activeSubTab === 'orders' && selectedOrderIds.length > 0 && (
          <div className="bg-indigo-900 text-white px-6 py-3 flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2 text-xs font-bold">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>{selectedOrderIds.length} orders selected</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-indigo-200 font-medium">Reassign to:</span>
              <select
                value={batchCompany}
                onChange={(e) => setBatchCompany(e.target.value)}
                className="bg-indigo-950 text-white border border-indigo-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none cursor-pointer"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <button
                onClick={handleBatchReassign}
                disabled={isUpdatingBatch}
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition-all shadow-sm disabled:opacity-50"
              >
                {isUpdatingBatch ? 'Updating...' : 'Apply Reassign'}
              </button>

              <button
                onClick={() => setSelectedOrderIds([])}
                className="text-xs text-indigo-200 hover:text-white underline font-medium ml-1"
              >
                Deselect All
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Orders / Projects Table */}
        {activeSubTab === 'orders' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 text-slate-500 font-black uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={paginatedOrders.length > 0 && paginatedOrders.every(o => selectedOrderIds.includes(o.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const newIds = Array.from(new Set([...selectedOrderIds, ...paginatedOrders.map(o => o.id)]));
                          setSelectedOrderIds(newIds);
                        } else {
                          setSelectedOrderIds(selectedOrderIds.filter(id => !paginatedOrders.some(o => o.id === id)));
                        }
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Invoice / Ref</th>
                  <th className="py-3.5 px-4">Company (Click to change)</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Items</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-right">Paid Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-slate-400 text-xs">
                      <div className="max-w-sm mx-auto text-center space-y-2">
                        <ShoppingBag size={32} className="mx-auto text-slate-300" />
                        <p className="font-bold text-slate-600">No orders found</p>
                        <p className="text-slate-400 text-[11px]">
                          No records match your selected company or timeframe filter. Try switching to "All Time" or clearing your search.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map(order => {
                    const compKey = getOrderCompany(order);
                    const matchedComp = companies.find(c => c.id === compKey);
                    const compTheme = getCompanyTheme(matchedComp?.color);
                    const compInfo = matchedComp ? { ...matchedComp, ...compTheme } : { name: compKey, badgeBg: 'bg-slate-100 text-slate-700' };
                    const isSelected = selectedOrderIds.includes(order.id);
                    const isDropdownOpen = activeDropdownOrderId === order.id;

                    return (
                      <tr 
                        key={order.id} 
                        className={cn(
                          "hover:bg-slate-50/80 transition-colors group",
                          isSelected && "bg-indigo-50/30"
                        )}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOrderIds([...selectedOrderIds, order.id]);
                              } else {
                                setSelectedOrderIds(selectedOrderIds.filter(id => id !== order.id));
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>

                        {/* Invoice & Ref */}
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <Receipt size={13} className="text-slate-400" />
                            <span>{order.documentNumber || order.id.slice(0, 8)}</span>
                          </div>
                          {order.workOrderNumber && (
                            <span className="block text-[10px] font-semibold text-slate-400 mt-0.5">
                              Ref: {order.workOrderNumber}
                            </span>
                          )}
                        </td>

                        {/* Company Badge with 1-Click Dropdown Switcher */}
                        <td className="py-3 px-4 relative">
                          <div className="relative inline-block">
                            <button
                              type="button"
                              onClick={() => setActiveDropdownOrderId(isDropdownOpen ? null : order.id)}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border transition-all flex items-center gap-1 hover:shadow-xs cursor-pointer",
                                compInfo.badgeBg
                              )}
                              title="Click to change company"
                            >
                              <span>{compInfo.name}</span>
                              <ChevronDown size={11} className="opacity-60" />
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                              <div className="absolute left-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-1 divide-y divide-slate-50 animate-in fade-in zoom-in-95 duration-100">
                                <div className="px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
                                  Assign to Company:
                                </div>
                                {companies.map(c => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => handleUpdateOrderCompany(order.id, c.id)}
                                    className={cn(
                                      "w-full text-left px-3 py-1.5 text-xs font-bold flex items-center justify-between hover:bg-slate-50 transition-colors",
                                      compKey === c.id ? "text-indigo-600 font-black bg-indigo-50/50" : "text-slate-700"
                                    )}
                                  >
                                    <span>{c.name}</span>
                                    {compKey === c.id && <Check size={12} className="text-indigo-600" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{order.customerName || 'Walk-in'}</span>
                          {order.customerPhone && (
                            <span className="text-[11px] text-slate-500 font-medium">{order.customerPhone}</span>
                          )}
                        </td>

                        {/* Items */}
                        <td className="py-3 px-4 max-w-xs truncate text-slate-700 font-medium">
                          {order.items?.map((it: any) => it.name).join(', ') || 'General Order'}
                        </td>

                        {/* Total Amount */}
                        <td className="py-3 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                          {formatCurrency(order.total, settings)}
                        </td>

                        {/* Paid Amount */}
                        <td className="py-3 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                          {formatCurrency(order.paidAmount || 0, settings)}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
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

                        {/* Date */}
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {/* View Details Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setViewingOrder(order);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-colors"
                              title="View Order Details"
                            >
                              <Eye size={13} />
                            </button>

                            {/* Print / PDF Button */}
                            {generatePDF && (
                              <button
                                type="button"
                                onClick={() => generatePDF(order, 'invoice', settings)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-colors"
                                title="Download / Print Invoice"
                              >
                                <Download size={13} />
                              </button>
                            )}

                            {/* Ledger Button */}
                            {order.customerId && setSelectedLedgerEntity && setActiveTab && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLedgerEntity({ id: order.customerId, name: order.customerName || 'Customer', type: 'customer' });
                                  setActiveTab('customer_due_list');
                                }}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-colors"
                                title="View Customer Ledger"
                              >
                                Ledger
                              </button>
                            )}
                          </div>
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
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 text-slate-500 font-black uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Client Name</th>
                  <th className="py-3.5 px-4">Assigned Company (Click to change)</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Address</th>
                  <th className="py-3.5 px-4 text-center">Orders Placed</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400 text-xs">
                      <div className="max-w-sm mx-auto text-center space-y-2">
                        <Users size={32} className="mx-auto text-slate-300" />
                        <p className="font-bold text-slate-600">No clients found</p>
                        <p className="text-slate-400 text-[11px]">
                          No client profiles match your selected company filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map(cust => {
                    const compKey = getCustomerCompany(cust);
                    const matchedComp = companies.find(c => c.id === compKey);
                    const compTheme = getCompanyTheme(matchedComp?.color);
                    const compInfo = matchedComp ? { ...matchedComp, ...compTheme } : { name: compKey, badgeBg: 'bg-slate-100 text-slate-700' };
                    const isDropdownOpen = activeDropdownCustId === cust.id;
                    const custOrderCount = localOrders.filter(o => o.customerId === cust.id).length;

                    return (
                      <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 font-black text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                              {(cust.name || 'C').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{cust.name}</span>
                              <span className="text-[10px] text-slate-400">ID: {cust.id.slice(0, 8)}</span>
                            </div>
                          </div>
                        </td>

                        {/* Interactive Company Switcher */}
                        <td className="py-3 px-4 relative">
                          <div className="relative inline-block">
                            <button
                              type="button"
                              onClick={() => setActiveDropdownCustId(isDropdownOpen ? null : cust.id)}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border transition-all flex items-center gap-1 hover:shadow-xs cursor-pointer",
                                compInfo.badgeBg
                              )}
                              title="Click to change client company"
                            >
                              <span>{compInfo.name}</span>
                              <ChevronDown size={11} className="opacity-60" />
                            </button>

                            {/* Dropdown */}
                            {isDropdownOpen && (
                              <div className="absolute left-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-1 divide-y divide-slate-50 animate-in fade-in zoom-in-95 duration-100">
                                <div className="px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
                                  Assign to Company:
                                </div>
                                {companies.map(c => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => handleUpdateCustomerCompany(cust.id, c.id)}
                                    className={cn(
                                      "w-full text-left px-3 py-1.5 text-xs font-bold flex items-center justify-between hover:bg-slate-50 transition-colors",
                                      compKey === c.id ? "text-indigo-600 font-black bg-indigo-50/50" : "text-slate-700"
                                    )}
                                  >
                                    <span>{c.name}</span>
                                    {compKey === c.id && <Check size={12} className="text-indigo-600" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3 px-4 space-y-1">
                          {cust.phone && (
                            <span className="flex items-center gap-1.5 text-slate-700 font-semibold text-xs">
                              <Phone size={12} className="text-slate-400" /> {cust.phone}
                            </span>
                          )}
                          {cust.email && (
                            <span className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                              <Mail size={12} className="text-slate-400" /> {cust.email}
                            </span>
                          )}
                        </td>

                        {/* Address */}
                        <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                          {cust.address || '-'}
                        </td>

                        {/* Orders count */}
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-full text-xs">
                            {custOrderCount} {custOrderCount === 1 ? 'order' : 'orders'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* WhatsApp link */}
                            {cust.phone && (
                              <a
                                href={`https://wa.me/${cust.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                                title="Message on WhatsApp"
                              >
                                <Phone size={13} />
                              </a>
                            )}

                            {/* Ledger button */}
                            {setSelectedLedgerEntity && setActiveTab && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLedgerEntity({ id: cust.id, name: cust.name, type: 'customer' });
                                  setActiveTab('customer_due_list');
                                }}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors"
                              >
                                Ledger History
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination & Footer Controls */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/40 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-slate-400 ml-2">
              Showing {activeSubTab === 'orders' ? paginatedOrders.length : paginatedCustomers.length} of {activeSubTab === 'orders' ? filteredOrders.length : filteredCustomers.length} total
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 font-bold text-slate-800">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Company Modal */}
      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => {
          setIsCompanyModalOpen(false);
          setEditingCompany(null);
        }}
        initialData={editingCompany}
        onSave={handleSaveCompany}
      />

      {/* Delete Confirmation Modal */}
      {deletingCompany && (
        <div className="fixed inset-0 z-[140] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-black text-slate-900">
              Remove Sister Concern?
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-900">"{deletingCompany.name}"</strong>? Existing orders and clients will remain safe in the database.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingCompany(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDeleteCompany}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-900/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details & Project Edit Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 px-6 bg-[#081621] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Order Details</span>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Receipt size={17} className="text-indigo-400" />
                  {viewingOrder.documentNumber || viewingOrder.id}
                </h3>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Company Selector */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                  Assigned Sister Concern / Business Unit
                </label>
                <select
                  value={getOrderCompany(viewingOrder)}
                  onChange={(e) => handleUpdateOrderCompany(viewingOrder.id, e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 font-black text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client</span>
                  <p className="font-black text-slate-900 text-sm mt-0.5">{viewingOrder.customerName || 'Walk-in Customer'}</p>
                  {viewingOrder.customerPhone && (
                    <p className="text-slate-600 font-semibold">{viewingOrder.customerPhone}</p>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reference Info</span>
                  <p className="font-bold text-slate-800 mt-0.5">Work Order: {viewingOrder.workOrderNumber || 'N/A'}</p>
                  <p className="text-slate-500 text-[11px]">Date: {viewingOrder.createdAt ? new Date(viewingOrder.createdAt).toLocaleString() : 'N/A'}</p>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Order Items</h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[10px] uppercase">
                      <tr>
                        <th className="p-3">Item Description</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Price</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingOrder.items?.map((it: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-800">{it.name || it.title}</td>
                          <td className="p-3 text-center font-bold text-slate-600">{it.quantity || 1}</td>
                          <td className="p-3 text-right font-medium text-slate-600">{formatCurrency(it.price, settings)}</td>
                          <td className="p-3 text-right font-black text-slate-900">{formatCurrency((it.price || 0) * (it.quantity || 1), settings)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(viewingOrder.subtotal || viewingOrder.total, settings)}</span>
                  </div>
                  {viewingOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount:</span>
                      <span className="font-bold">-{formatCurrency(viewingOrder.discountAmount, settings)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(viewingOrder.total, settings)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Paid:</span>
                    <span>{formatCurrency(viewingOrder.paidAmount || 0, settings)}</span>
                  </div>
                  {(viewingOrder.total - (viewingOrder.paidAmount || 0)) > 0 && (
                    <div className="flex justify-between text-red-600 font-bold">
                      <span>Due:</span>
                      <span>{formatCurrency(viewingOrder.total - (viewingOrder.paidAmount || 0), settings)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {generatePDF && (
                  <button
                    type="button"
                    onClick={() => generatePDF(viewingOrder, 'invoice', settings)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
                  >
                    <Download size={13} /> Print Invoice
                  </button>
                )}
                {viewingOrder.customerId && setSelectedLedgerEntity && setActiveTab && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLedgerEntity({ id: viewingOrder.customerId, name: viewingOrder.customerName || 'Customer', type: 'customer' });
                      setViewingOrder(null);
                      setActiveTab('customer_due_list');
                    }}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    View Customer Ledger
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setViewingOrder(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessUnitsTab;
