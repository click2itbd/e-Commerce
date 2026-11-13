import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Order, Customer, BusinessCompany, WorkOrder, Transaction, PaymentAccount } from '../../../../types';
import { formatCurrency, cn } from '../../../../lib/utils';
import { toast } from 'react-hot-toast';
import { 
  FileCheck2, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Building2, 
  ChevronDown, 
  ChevronRight, 
  Edit3, 
  Trash2, 
  Receipt, 
  ArrowUpRight, 
  User, 
  Phone, 
  Calendar,
  X,
  FileText,
  Wallet,
  ShoppingBag
} from 'lucide-react';
import { getCompanyTheme, getHierarchicalCompanyGroups } from '../../../../hooks/useBusinessUnits';
import {
  buildOrderScopeLookup,
  computeWorkOrderFinancials,
  discoverProjectWorkOrders,
  doesTxMatchProjectOrWorkOrder,
  type DiscoveredProjectWorkOrder,
  type WorkOrderFinancialSummary,
} from '../../../../utils/customerAdvanceAccounting';
import { CustomerAdvanceModal } from '../../modals/CustomerAdvanceModal';

interface TrackedWorkOrder extends WorkOrder {
  scopeKey: string;
  isRegisteredWO: boolean;
  financials: WorkOrderFinancialSummary;
}

interface WorkOrderTrackerProps {
  orders: Order[];
  companies: BusinessCompany[];
  customers: Customer[];
  selectedCompany: string;
  setActiveTab?: (tab: string) => void;
  settings?: any;
}

export const WorkOrderTracker: React.FC<WorkOrderTrackerProps> = ({
  orders,
  companies,
  customers,
  selectedCompany,
  setActiveTab,
  settings,
}) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'on_hold'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWO, setEditingWO] = useState<WorkOrder | null>(null);
  const [expandedWOId, setExpandedWOId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [advanceModalTarget, setAdvanceModalTarget] = useState<TrackedWorkOrder | null>(null);

  const loadFinancialData = useCallback(async () => {
    try {
      const [txSnap, purSnap, accSnap] = await Promise.all([
        getDocs(collection(db, 'transactions')).catch(() => ({ docs: [] })),
        getDocs(collection(db, 'purchases')).catch(() => ({ docs: [] })),
        getDocs(collection(db, 'payment_accounts')).catch(() => ({ docs: [] })),
      ]);
      const txs = txSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      txs.sort((a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime());
      setTransactions(txs);
      const purs = purSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      purs.sort((a: any, b: any) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime());
      setPurchases(purs);
      setPaymentAccounts(accSnap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentAccount)));
    } catch (err) {
      console.warn('WorkOrderTracker financial load warning:', err);
    }
  }, []);

  useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData]);

  const orderScopeLookup = useMemo(() => buildOrderScopeLookup(orders), [orders]);

  const findCustomerForWO = (wo: Pick<WorkOrder, 'customerId' | 'clientName' | 'branchName'>) =>
    customers.find(
      c =>
        (wo.customerId && c.id === wo.customerId) ||
        (wo.clientName && c.name.trim().toLowerCase() === wo.clientName.trim().toLowerCase()) ||
        (wo.branchName &&
          (c.name.trim().toLowerCase() === wo.branchName.trim().toLowerCase() ||
            (c.branchName || '').trim().toLowerCase() === wo.branchName.trim().toLowerCase())),
    );

  const openSalesDraftForWO = (wo: TrackedWorkOrder) => {
    if (!setActiveTab) return;
    const matchedCust = findCustomerForWO(wo);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sales_form_draft', JSON.stringify({
        customerId: matchedCust?.id || wo.customerId || '',
        customerName: matchedCust?.name || wo.clientName || wo.branchName || '',
        customerPhone: matchedCust?.phone || wo.contactPhone || '',
        customerEmail: matchedCust?.email || '',
        shippingAddress: matchedCust?.address || '',
        company: wo.company || 'main',
        branchName: wo.branchName || '',
        workOrderNumber: wo.orderNumber || '',
        notes: wo.orderNumber ? `Ref Work Order #${wo.orderNumber}` : wo.branchName ? `Ref Project: ${wo.branchName}` : '',
        items: [],
      }));
    }
    setActiveTab('sales');
  };

  const openPurchaseDraftForWO = (wo: TrackedWorkOrder) => {
    if (!setActiveTab) return;
    const matchedCust = findCustomerForWO(wo);
    if (typeof window !== 'undefined') {
      localStorage.setItem('draft_purchase_form', JSON.stringify({
        forceOpen: true,
        workOrderNumber: wo.orderNumber || '',
        projectName: wo.branchName || wo.title || '',
        customerId: matchedCust?.id || wo.customerId || '',
        customerName: matchedCust?.name || wo.clientName || '',
        notes: wo.orderNumber
          ? `Purchase for WO #${wo.orderNumber}${wo.clientName ? ` (${wo.clientName})` : ''}`
          : `Purchase for ${wo.branchName || wo.title}`,
      }));
    }
    setActiveTab('purchases');
  };

  // Form State
  const [formData, setFormData] = useState({
    orderNumber: '',
    company: 'simpletree',
    branchName: '',
    clientName: '',
    title: '',
    budget: '',
    issuedDate: new Date().toISOString().split('T')[0],
    deadlineDate: '',
    contactPerson: '',
    contactPhone: '',
    status: 'active' as 'active' | 'completed' | 'on_hold' | 'cancelled',
    notes: '',
  });

  // Real-time listener for work_orders
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'work_orders'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkOrder));
      list.sort((a, b) => new Date(b.issuedDate || b.createdAt || 0).getTime() - new Date(a.issuedDate || a.createdAt || 0).getTime());
      setWorkOrders(list);
      setLoading(false);
    }, (err) => {
      console.warn('work_orders listener warning:', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const openCreateModal = () => {
    setEditingWO(null);
    setFormData({
      orderNumber: `WO-${new Date().getFullYear()}-${String(workOrders.length + 1).padStart(3, '0')}`,
      company: selectedCompany !== 'all' ? selectedCompany : 'simpletree',
      branchName: '',
      clientName: '',
      title: '',
      budget: '',
      issuedDate: new Date().toISOString().split('T')[0],
      deadlineDate: '',
      contactPerson: '',
      contactPhone: '',
      status: 'active',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (wo: TrackedWorkOrder) => {
    setEditingWO(wo.isRegisteredWO ? wo : null);
    setFormData({
      orderNumber: wo.orderNumber || (wo.branchName ? `PRJ-${wo.branchName.toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 8)}` : ''),
      company: wo.company || 'simpletree',
      branchName: wo.branchName || '',
      clientName: wo.clientName || '',
      title: wo.title || '',
      budget: wo.budget > 0 ? wo.budget.toString() : '',
      issuedDate: wo.issuedDate || new Date().toISOString().split('T')[0],
      deadlineDate: wo.deadlineDate || '',
      contactPerson: wo.contactPerson || '',
      contactPhone: wo.contactPhone || '',
      status: wo.status || 'active',
      notes: wo.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveWO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orderNumber.trim() || !formData.title.trim()) {
      toast.error('Work Order number and title are required');
      return;
    }

    const budgetNum = Number(formData.budget) || 0;
    if (budgetNum <= 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }

    try {
      const payload = {
        orderNumber: formData.orderNumber.trim().toUpperCase(),
        company: formData.company,
        branchName: formData.branchName.trim(),
        clientName: formData.clientName.trim() || formData.company,
        title: formData.title.trim(),
        budget: budgetNum,
        issuedDate: formData.issuedDate,
        deadlineDate: formData.deadlineDate || '',
        contactPerson: formData.contactPerson.trim(),
        contactPhone: formData.contactPhone.trim(),
        status: formData.status,
        notes: formData.notes.trim(),
        createdAt: editingWO?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingWO?.id) {
        await updateDoc(doc(db, 'work_orders', editingWO.id), payload);
        toast.success(`Work Order #${payload.orderNumber} updated!`);
      } else {
        await addDoc(collection(db, 'work_orders'), payload);
        toast.success(`Work Order #${payload.orderNumber} created successfully!`);
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save work order:', err);
      toast.error('Error saving Work Order');
    }
  };

  const handleDeleteWO = async (wo: TrackedWorkOrder) => {
    if (!wo.isRegisteredWO || !wo.id) {
      toast('Auto-tracked from Advance Deposits / Purchases / Sales. Edit or delete the underlying voucher to remove it.', { icon: 'ℹ️' });
      return;
    }
    if (!window.confirm(`Are you sure you want to delete Work Order #${wo.orderNumber}?`)) return;

    try {
      await deleteDoc(doc(db, 'work_orders', wo.id));
      toast.success(`Work Order #${wo.orderNumber} deleted.`);
    } catch (err) {
      console.error('Failed to delete work order:', err);
      toast.error('Could not delete Work Order');
    }
  };

  // Unify registered work_orders with Work Orders & Projects discovered across Advances, Purchases, and Sales
  const allTrackedWorkOrders = useMemo<TrackedWorkOrder[]>(() => {
    const discovered = discoverProjectWorkOrders({
      workOrders,
      transactions,
      orders,
      purchases,
      customers,
    });
    return discovered.map((d: DiscoveredProjectWorkOrder) => ({
      id: d.registeredWorkOrder?.id || d.key,
      scopeKey: d.key,
      isRegisteredWO: d.isRegisteredWO,
      financials: d.financials,
      orderNumber: d.workOrderNumber,
      company: d.company || 'main',
      customerId: d.customerId || undefined,
      branchName: d.projectName || '',
      clientName: d.clientName || d.projectName || '',
      title: d.title,
      budget: d.budget,
      issuedDate: d.issuedDate,
      deadlineDate: d.deadlineDate || '',
      contactPerson: d.contactPerson || '',
      contactPhone: d.contactPhone || '',
      status: d.status || 'active',
      notes: d.notes || '',
      createdAt: d.registeredWorkOrder?.createdAt || d.issuedDate,
    }));
  }, [workOrders, transactions, orders, purchases, customers]);

  // Match orders with work order or project scope
  const getLinkedOrders = (wo: Pick<TrackedWorkOrder, 'orderNumber' | 'branchName'>) => {
    return orders.filter(o => {
      if (o.status === 'cancelled' || o.type === 'quotation') return false;
      return doesTxMatchProjectOrWorkOrder(o, {
        workOrderNumber: wo.orderNumber || undefined,
        projectName: wo.branchName || undefined,
      });
    });
  };

  // Filtered Work Orders
  const filteredWorkOrders = useMemo(() => {
    return allTrackedWorkOrders.filter(wo => {
      if (selectedCompany !== 'all' && wo.isRegisteredWO && (wo.company || '').toLowerCase() !== selectedCompany.toLowerCase()) {
        return false;
      }
      if (statusFilter !== 'all' && wo.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = 
          (wo.orderNumber || '').toLowerCase().includes(q) ||
          (wo.title || '').toLowerCase().includes(q) ||
          (wo.clientName || '').toLowerCase().includes(q) ||
          (wo.branchName || '').toLowerCase().includes(q) ||
          (wo.contactPerson || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [allTrackedWorkOrders, selectedCompany, statusFilter, searchQuery]);

  // Overall Metrics
  const summary = useMemo(() => {
    let totalBudget = 0;
    let totalInvoiced = 0;
    let totalRemaining = 0;

    filteredWorkOrders.forEach(wo => {
      const inv = wo.financials.totalSalesInvoiced;
      totalBudget += wo.budget;
      totalInvoiced += inv;
      totalRemaining += wo.budget > 0 ? Math.max(0, wo.budget - inv) : 0;
    });

    const utilization = totalBudget > 0 ? Math.round((totalInvoiced / totalBudget) * 100) : 0;
    return { totalBudget, totalInvoiced, totalRemaining, utilization, count: filteredWorkOrders.length };
  }, [filteredWorkOrders]);

  return (
    <div className="space-y-6">
      {/* KPI Top Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
            Total Allocated Budget
          </span>
          <span className="text-xl font-black text-slate-900">
            {formatCurrency(summary.totalBudget, settings)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Across {summary.count} Work Orders
          </span>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block mb-1">
            Total Invoiced Amount
          </span>
          <span className="text-xl font-black text-emerald-800">
            {formatCurrency(summary.totalInvoiced, settings)}
          </span>
          <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
            Utilization: {summary.utilization}%
          </span>
        </div>

        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block mb-1">
            Remaining Budget Available
          </span>
          <span className="text-xl font-black text-blue-800">
            {formatCurrency(summary.totalRemaining, settings)}
          </span>
          <span className="text-[10px] font-bold text-blue-600 block mt-0.5">
            Unbilled Contract Balance
          </span>
        </div>

        <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block mb-1">
              Active Project Work Orders
            </span>
            <span className="text-xl font-black text-indigo-900">
              {summary.count} Active
            </span>
          </div>
          <button
            onClick={openCreateModal}
            className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Plus size={14} /> New Work Order / PO
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search WO #, Client, Project, Title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={cn("px-3 py-1.5 rounded-xl text-xs font-bold transition-all", statusFilter === 'all' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
          >
            All ({allTrackedWorkOrders.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={cn("px-3 py-1.5 rounded-xl text-xs font-bold transition-all", statusFilter === 'active' ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100")}
          >
            In Progress
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={cn("px-3 py-1.5 rounded-xl text-xs font-bold transition-all", statusFilter === 'completed' ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100")}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter('on_hold')}
            className={cn("px-3 py-1.5 rounded-xl text-xs font-bold transition-all", statusFilter === 'on_hold' ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100")}
          >
            On Hold
          </button>
        </div>
      </div>

      {/* Work Orders List / Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 font-bold">
          Loading Work Orders...
        </div>
      ) : filteredWorkOrders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <FileCheck2 size={36} className="mx-auto text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-700">No Work Orders Found</h4>
          <p className="text-xs text-slate-400 mt-1">Register a client Work Order or tag any Advance / Purchase / Sale with a WO # or Project name.</p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-indigo-700 transition-all inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> + Create First Work Order
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWorkOrders.map(wo => {
            const linked = getLinkedOrders(wo);
            const invoiced = wo.financials.totalSalesInvoiced;
            const paid = wo.financials.totalCashCollectedOnSales + wo.financials.advanceAppliedOnSales;
            const due = Math.max(0, invoiced - paid);
            const remaining = wo.budget > 0 ? wo.budget - invoiced : 0;
            const pct = wo.budget > 0 ? Math.round((invoiced / wo.budget) * 100) : 0;
            const isOverBudget = wo.budget > 0 && invoiced > wo.budget;
            const isExpanded = expandedWOId === wo.id;
            const companyObj = companies.find(c => c.id === wo.company);
            const theme = getCompanyTheme(companyObj?.color || 'indigo');
            const scopeObj = {
              workOrderNumber: wo.orderNumber || undefined,
              projectName: wo.branchName || undefined,
            };
            const fin = wo.financials;
            const linkedPurchases = purchases.filter((p: any) =>
              doesTxMatchProjectOrWorkOrder(p, scopeObj),
            );
            const linkedAdvances = transactions.filter(
              t =>
                (t.type === 'advance_refund' ||
                  Boolean((t as any).isAdvance) ||
                  t.category === 'Customer Advance') &&
                doesTxMatchProjectOrWorkOrder(t, scopeObj, orderScopeLookup),
            );
            const scopeDisplayLabel = wo.orderNumber ? `#${wo.orderNumber}` : `Project: ${wo.branchName || wo.clientName}`;

            return (
              <div 
                key={wo.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-sm transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: WO Header & Title */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-black tracking-wider bg-slate-900 text-white font-mono">
                        {wo.orderNumber ? `#${wo.orderNumber}` : 'PROJECT'}
                      </span>
                      {!wo.isRegisteredWO && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Auto-Tracked
                        </span>
                      )}
                      {wo.isRegisteredWO && (
                        <span className={cn("px-2.5 py-0.5 rounded-lg text-[10px] font-black border", theme.badgeBg)}>
                          {companyObj?.name || wo.company}
                        </span>
                      )}
                      {wo.branchName && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          Project: {wo.branchName}
                        </span>
                      )}
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-black uppercase",
                        isOverBudget ? "bg-rose-100 text-rose-800" :
                        wo.budget > 0 && pct >= 100 ? "bg-blue-100 text-blue-800" :
                        wo.status === 'completed' ? "bg-emerald-100 text-emerald-800" :
                        "bg-amber-100 text-amber-800"
                      )}>
                        {isOverBudget ? 'Budget Exceeded' : wo.budget > 0 && pct >= 100 ? '100% Invoiced' : wo.status === 'completed' ? 'Completed' : 'Active'}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-slate-900">
                      {wo.title}
                    </h3>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User size={12} className="text-slate-400" />
                        {wo.clientName || wo.branchName || 'Unassigned Client'}
                      </span>
                      {wo.contactPerson && (
                        <span className="flex items-center gap-1">
                          <Phone size={12} className="text-slate-400" />
                          {wo.contactPerson} {wo.contactPhone ? `(${wo.contactPhone})` : ''}
                        </span>
                      )}
                      {wo.issuedDate && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          {wo.isRegisteredWO ? `Issued: ${wo.issuedDate}` : `Activity: ${wo.issuedDate}`}
                          {wo.deadlineDate && `  |  Deadline: ${wo.deadlineDate}`}
                        </span>
                      )}
                    </div>

                    {/* Per-WorkOrder Advance -> Purchase -> Sale Financial Pills */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-bold border",
                        fin.explicitRemainingAdvance > 0
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      )}>
                        Adv Received: {formatCurrency(fin.advancesReceived, settings)}
                        {fin.explicitRemainingAdvance > 0 && ` (Credit Left: ${formatCurrency(fin.explicitRemainingAdvance, settings)})`}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Purchase Cost: {formatCurrency(fin.totalPurchasesCost, settings)}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        Sales: {formatCurrency(invoiced, settings)}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-black border",
                        fin.grossProfit >= 0
                          ? "bg-teal-50 text-teal-800 border-teal-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      )}>
                        Gross Profit: {formatCurrency(fin.grossProfit, settings)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Budget Utilization & Controls */}
                  <div className="flex items-center gap-4 shrink-0 self-end lg:self-auto flex-wrap justify-end">
                    {wo.budget > 0 && (
                      <>
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Approved Budget</div>
                          <div className="text-base font-black text-slate-900">{formatCurrency(wo.budget, settings)}</div>
                        </div>

                        <div className="w-32">
                          <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                            <span className="text-slate-500">{pct}% Invoiced</span>
                            <span className={isOverBudget ? "text-rose-600" : "text-slate-700"}>
                              {isOverBudget ? `+${formatCurrency(Math.abs(remaining), settings)} Over` : `${formatCurrency(remaining, settings)} Left`}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full rounded-full transition-all", isOverBudget ? "bg-rose-500" : pct >= 100 ? "bg-blue-600" : "bg-emerald-500")}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setAdvanceModalTarget(wo)}
                        title="Receive or Refund Customer Advance for this Work Order"
                        className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl border border-teal-200 transition-all flex items-center gap-1 shadow-2xs"
                      >
                        <Wallet size={12} /> + Advance
                      </button>

                      {setActiveTab && (
                        <button
                          type="button"
                          onClick={() => openPurchaseDraftForWO(wo)}
                          title="Record Product Purchase for this Work Order"
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition-all flex items-center gap-1 shadow-2xs"
                        >
                          <ShoppingBag size={12} /> + Purchase
                        </button>
                      )}

                      {setActiveTab && (
                        <button
                          type="button"
                          onClick={() => openSalesDraftForWO(wo)}
                          title="Create Invoice for this WO"
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-all flex items-center gap-1 shadow-2xs"
                        >
                          <Plus size={12} /> Bill Now
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditModal(wo)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                        title={wo.isRegisteredWO ? 'Edit Work Order' : 'Save Budget / Register Formal Work Order'}
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteWO(wo)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Delete Work Order"
                      >
                        <Trash2 size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedWOId(isExpanded ? null : (wo.id || null))}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-1 text-xs font-bold ml-1"
                      >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Work Order Ledger, Purchases & Invoices Accordion */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
                    {/* Reconciliation Strip */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200">
                        <div className="text-[10px] font-bold uppercase text-teal-700">Customer Advance</div>
                        <div className="text-sm font-black text-teal-900 mt-0.5">{formatCurrency(fin.advancesReceived, settings)}</div>
                        <div className="text-[10px] text-teal-700 mt-0.5">
                          Adjusted: {formatCurrency(fin.advanceAppliedOnSales, settings)} · Unused: {formatCurrency(fin.remainingCustomerAdvance, settings)}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                        <div className="text-[10px] font-bold uppercase text-amber-700">Purchases Cost</div>
                        <div className="text-sm font-black text-amber-900 mt-0.5">{formatCurrency(fin.totalPurchasesCost, settings)}</div>
                        <div className="text-[10px] text-amber-700 mt-0.5">
                          Paid: {formatCurrency(fin.totalVendorPaid, settings)} · Payable: {formatCurrency(fin.totalVendorPayable, settings)}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200">
                        <div className="text-[10px] font-bold uppercase text-blue-700">Sales & Collection</div>
                        <div className="text-sm font-black text-blue-900 mt-0.5">{formatCurrency(invoiced, settings)}</div>
                        <div className="text-[10px] text-blue-700 mt-0.5">
                          Collected: {formatCurrency(paid, settings)} · Due: {formatCurrency(due, settings)}
                        </div>
                      </div>
                      <div className={cn(
                        "p-3 rounded-xl border",
                        fin.grossProfit >= 0 ? "bg-emerald-50/70 border-emerald-200" : "bg-rose-50/70 border-rose-200"
                      )}>
                        <div className="text-[10px] font-bold uppercase text-slate-600">Net Margin & Cash</div>
                        <div className={cn("text-sm font-black mt-0.5", fin.grossProfit >= 0 ? "text-emerald-900" : "text-rose-800")}>
                          Profit: {formatCurrency(fin.grossProfit, settings)}
                        </div>
                        <div className="text-[10px] text-slate-600 mt-0.5">
                          Cash Position: {formatCurrency(fin.netCashFlow, settings)}
                        </div>
                      </div>
                    </div>

                    {/* Linked Advances & Refunds */}
                    {linkedAdvances.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Wallet size={14} className="text-teal-600" />
                            Advance Deposits & Refunds ({linkedAdvances.length})
                          </h4>
                          <button
                            type="button"
                            onClick={() => setAdvanceModalTarget(wo)}
                            className="text-teal-700 font-bold hover:underline text-[11px]"
                          >
                            + Add Advance / Refund
                          </button>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                              <tr>
                                <th className="py-2 px-3">Date</th>
                                <th className="py-2 px-3">Type</th>
                                <th className="py-2 px-3">Account / Method</th>
                                <th className="py-2 px-3">Notes</th>
                                <th className="py-2 px-3 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {linkedAdvances.map(tx => {
                                const isRefund = tx.type === 'advance_refund';
                                return (
                                <tr key={tx.id} className="hover:bg-slate-50/60">
                                  <td className="py-2 px-3 text-slate-500">{tx.date ? new Date(tx.date).toLocaleDateString('en-GB') : '-'}</td>
                                  <td className="py-2 px-3 font-bold">
                                    <span className={cn(
                                      "px-2 py-0.5 rounded-full text-[10px] uppercase",
                                      !isRefund ? "bg-teal-100 text-teal-800" : "bg-rose-100 text-rose-800"
                                    )}>
                                      {!isRefund ? 'Advance In' : 'Advance Refund'}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-slate-700">{tx.paymentMethod || tx.paymentAccountName || '-'}</td>
                                  <td className="py-2 px-3 text-slate-600">{tx.description}</td>
                                  <td className={cn("py-2 px-3 text-right font-black", !isRefund ? "text-teal-700" : "text-rose-700")}>
                                    {!isRefund ? '+' : '-'}{formatCurrency(tx.amount, settings)}
                                  </td>
                                </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Linked Purchases */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                          <ShoppingBag size={14} className="text-amber-600" />
                          Purchases Tagged to {scopeDisplayLabel} ({linkedPurchases.length})
                        </h4>
                        {setActiveTab && (
                          <button
                            type="button"
                            onClick={() => openPurchaseDraftForWO(wo)}
                            className="text-amber-700 font-bold hover:underline text-[11px]"
                          >
                            + Record Purchase for {scopeDisplayLabel}
                          </button>
                        )}
                      </div>
                      {linkedPurchases.length === 0 ? (
                        <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                          No purchases tagged to this Project / Work Order yet.
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                              <tr>
                                <th className="py-2 px-3">Date</th>
                                <th className="py-2 px-3">Bill #</th>
                                <th className="py-2 px-3">Vendor</th>
                                <th className="py-2 px-3 text-right">Bill Total</th>
                                <th className="py-2 px-3 text-right">Paid</th>
                                <th className="py-2 px-3 text-right">Payable</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {linkedPurchases.map((p: any) => {
                                const pTotal = Number(p.total || 0);
                                const pPaid = Number(p.paidAmount || 0);
                                const pDue = Math.max(0, pTotal - pPaid);
                                return (
                                  <tr key={p.id} className="hover:bg-slate-50/60">
                                    <td className="py-2 px-3 text-slate-500">{p.date ? new Date(p.date).toLocaleDateString('en-GB') : '-'}</td>
                                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{p.documentNumber || p.id?.slice(0, 8)}</td>
                                    <td className="py-2 px-3 font-medium text-slate-800">{p.vendorName || '-'}</td>
                                    <td className="py-2 px-3 text-right font-bold text-slate-900">{formatCurrency(pTotal, settings)}</td>
                                    <td className="py-2 px-3 text-right text-emerald-600 font-bold">{formatCurrency(pPaid, settings)}</td>
                                    <td className="py-2 px-3 text-right text-rose-600 font-bold">{pDue > 0 ? formatCurrency(pDue, settings) : '৳0'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Linked Invoices */}
                    <div className="flex items-center justify-between text-xs">
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Receipt size={14} className="text-indigo-600" />
                        Invoices Billed against {scopeDisplayLabel} ({linked.length} bills)
                      </h4>
                      <div className="flex items-center gap-3 text-[11px] font-bold">
                        <span className="text-slate-600">Total Billed: <strong className="text-slate-900">{formatCurrency(invoiced, settings)}</strong></span>
                        <span className="text-emerald-700">Collected: <strong>{formatCurrency(paid, settings)}</strong></span>
                        <span className="text-rose-700">Due: <strong>{formatCurrency(due, settings)}</strong></span>
                      </div>
                    </div>

                    {linked.length === 0 ? (
                      <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                        No invoices have been billed against this Work Order yet.
                        {setActiveTab && (
                          <button
                            onClick={() => openSalesDraftForWO(wo)}
                            className="text-indigo-600 font-bold ml-2 underline hover:text-indigo-800"
                          >
                            Create first invoice now →
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                            <tr>
                              <th className="py-2 px-3">Date</th>
                              <th className="py-2 px-3">Invoice #</th>
                              <th className="py-2 px-3">Customer / Branch</th>
                              <th className="py-2 px-3 text-right">Invoice Total</th>
                              <th className="py-2 px-3 text-right">Paid</th>
                              <th className="py-2 px-3 text-right">Due</th>
                              <th className="py-2 px-3 text-center">Payment Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {linked.map(o => {
                              const oDate = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB') : '-';
                              const oTotal = Number(o.total || 0);
                              const oPaid = Number(o.paidAmount || (o as any).amountPaid || 0);
                              const oDue = Math.max(0, oTotal - oPaid);

                              return (
                                <tr key={o.id} className="hover:bg-slate-50/60">
                                  <td className="py-2.5 px-3 text-slate-500">{oDate}</td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{o.documentNumber || o.id.slice(0, 8)}</td>
                                  <td className="py-2.5 px-3 font-medium text-slate-800">
                                    {o.customerName}
                                    {o.branchName ? <span className="text-[10px] text-slate-400 ml-1">({o.branchName})</span> : null}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatCurrency(oTotal, settings)}</td>
                                  <td className="py-2.5 px-3 text-right text-emerald-600 font-bold">{formatCurrency(oPaid, settings)}</td>
                                  <td className="py-2.5 px-3 text-right text-rose-600 font-bold">{oDue > 0 ? formatCurrency(oDue, settings) : '৳0'}</td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span className={cn(
                                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                      oDue <= 0 ? "bg-emerald-100 text-emerald-800" : oPaid > 0 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                                    )}>
                                      {oDue <= 0 ? 'PAID' : oPaid > 0 ? 'PARTIAL' : 'UNPAID'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck2 size={18} className="text-indigo-400" />
                <h3 className="font-bold text-sm">
                  {editingWO ? `Edit Work Order #${formData.orderNumber}` : 'Register New Work Order / PO'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveWO} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Work Order / PO # *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WO-2026-001 or PO-9812"
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Company / Sister Concern *</label>
                  <select
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
                  >
                    {getHierarchicalCompanyGroups(companies).map(group => (
                      <optgroup key={group.groupKey} label={group.groupLabel}>
                        {group.options.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Client / Billing Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Simpletree Group or Volumezero"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Project / Branch Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Saleh's Popy or GSR Site"
                    value={formData.branchName}
                    onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Work Description / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete CCTV, Access Control & Server Supply"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Approved Budget (BDT) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 250000"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-500 focus:bg-white"
                  >
                    <option value="active">In Progress (Active)</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={formData.issuedDate}
                    onChange={(e) => setFormData({ ...formData, issuedDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Delivery Deadline</label>
                  <input
                    type="date"
                    value={formData.deadlineDate}
                    onChange={(e) => setFormData({ ...formData, deadlineDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Site / In-Charge Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Engr. Fakhrul"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="017xxxxxxxx"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Notes / Terms</label>
                <textarea
                  rows={2}
                  placeholder="Optional terms, PO reference or delivery instructions"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  {editingWO ? 'Save Changes' : 'Create Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {advanceModalTarget && (
        <CustomerAdvanceModal
          isOpen={!!advanceModalTarget}
          onClose={() => setAdvanceModalTarget(null)}
          customers={customers}
          paymentAccounts={paymentAccounts}
          transactions={transactions}
          workOrders={workOrders}
          initialCustomer={findCustomerForWO(advanceModalTarget) || null}
          initialCustomerName={advanceModalTarget.clientName || advanceModalTarget.branchName || ''}
          initialWorkOrderNumber={advanceModalTarget.orderNumber || ''}
          initialProjectName={advanceModalTarget.branchName || advanceModalTarget.title || ''}
          onSuccess={() => {
            loadFinancialData();
          }}
        />
      )}
    </div>
  );
};
