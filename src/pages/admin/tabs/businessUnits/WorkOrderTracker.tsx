import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Order, Customer, BusinessCompany, WorkOrder } from '../../../../types';
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
  FileText
} from 'lucide-react';
import { getCompanyTheme } from '../../../../hooks/useBusinessUnits';

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

  const openEditModal = (wo: WorkOrder) => {
    setEditingWO(wo);
    setFormData({
      orderNumber: wo.orderNumber,
      company: wo.company,
      branchName: wo.branchName || '',
      clientName: wo.clientName,
      title: wo.title,
      budget: wo.budget.toString(),
      issuedDate: wo.issuedDate,
      deadlineDate: wo.deadlineDate || '',
      contactPerson: wo.contactPerson || '',
      contactPhone: wo.contactPhone || '',
      status: wo.status,
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

  const handleDeleteWO = async (wo: WorkOrder) => {
    if (!wo.id) return;
    if (!window.confirm(`Are you sure you want to delete Work Order #${wo.orderNumber}?`)) return;

    try {
      await deleteDoc(doc(db, 'work_orders', wo.id));
      toast.success(`Work Order #${wo.orderNumber} deleted.`);
    } catch (err) {
      console.error('Failed to delete work order:', err);
      toast.error('Could not delete Work Order');
    }
  };

  // Match orders with work order
  const getLinkedOrders = (woNumber: string) => {
    if (!woNumber) return [];
    const cleanWO = woNumber.toLowerCase().trim();
    return orders.filter(o => {
      if (o.status === 'cancelled' || o.type === 'quotation') return false;
      const oWO = (o as any).workOrderNumber ? String((o as any).workOrderNumber).toLowerCase().trim() : '';
      const notes = (o.notes || '').toLowerCase();
      return oWO === cleanWO || (oWO && cleanWO.includes(oWO)) || notes.includes(cleanWO);
    });
  };

  // Filtered Work Orders
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter(wo => {
      if (selectedCompany !== 'all' && wo.company.toLowerCase() !== selectedCompany.toLowerCase()) {
        return false;
      }
      if (statusFilter !== 'all' && wo.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = 
          wo.orderNumber.toLowerCase().includes(q) ||
          wo.title.toLowerCase().includes(q) ||
          wo.clientName.toLowerCase().includes(q) ||
          (wo.branchName || '').toLowerCase().includes(q) ||
          (wo.contactPerson || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [workOrders, selectedCompany, statusFilter, searchQuery]);

  // Overall Metrics
  const summary = useMemo(() => {
    let totalBudget = 0;
    let totalInvoiced = 0;
    let totalRemaining = 0;

    filteredWorkOrders.forEach(wo => {
      const linked = getLinkedOrders(wo.orderNumber);
      const inv = linked.reduce((s, o) => s + Number(o.total || 0), 0);
      totalBudget += wo.budget;
      totalInvoiced += inv;
      totalRemaining += Math.max(0, wo.budget - inv);
    });

    const utilization = totalBudget > 0 ? Math.round((totalInvoiced / totalBudget) * 100) : 0;
    return { totalBudget, totalInvoiced, totalRemaining, utilization, count: filteredWorkOrders.length };
  }, [filteredWorkOrders, orders]);

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
            All ({workOrders.length})
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
          <p className="text-xs text-slate-400 mt-1">Register a client Work Order / Purchase Order to track budget utilization.</p>
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
            const linked = getLinkedOrders(wo.orderNumber);
            const invoiced = linked.reduce((s, o) => s + Number(o.total || 0), 0);
            const paid = linked.reduce((s, o) => s + Number(o.paidAmount || (o as any).amountPaid || 0), 0);
            const due = Math.max(0, invoiced - paid);
            const remaining = wo.budget - invoiced;
            const pct = wo.budget > 0 ? Math.round((invoiced / wo.budget) * 100) : 0;
            const isOverBudget = invoiced > wo.budget;
            const isExpanded = expandedWOId === wo.id;
            const companyObj = companies.find(c => c.id === wo.company);
            const theme = getCompanyTheme(companyObj?.color || 'indigo');

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
                        #{wo.orderNumber}
                      </span>
                      <span className={cn("px-2.5 py-0.5 rounded-lg text-[10px] font-black border", theme.badgeBg)}>
                        {companyObj?.name || wo.company}
                      </span>
                      {wo.branchName && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          Branch: {wo.branchName}
                        </span>
                      )}
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-black uppercase",
                        isOverBudget ? "bg-rose-100 text-rose-800" :
                        pct >= 100 ? "bg-blue-100 text-blue-800" :
                        wo.status === 'completed' ? "bg-emerald-100 text-emerald-800" :
                        "bg-amber-100 text-amber-800"
                      )}>
                        {isOverBudget ? 'Budget Exceeded' : pct >= 100 ? '100% Invoiced' : wo.status === 'completed' ? 'Completed' : 'Active'}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-slate-900">
                      {wo.title}
                    </h3>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User size={12} className="text-slate-400" />
                        {wo.clientName}
                      </span>
                      {wo.contactPerson && (
                        <span className="flex items-center gap-1">
                          <Phone size={12} className="text-slate-400" />
                          {wo.contactPerson} {wo.contactPhone ? `(${wo.contactPhone})` : ''}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        Issued: {wo.issuedDate}
                        {wo.deadlineDate && `  |  Deadline: ${wo.deadlineDate}`}
                      </span>
                    </div>
                  </div>

                  {/* Right: Budget Utilization & Controls */}
                  <div className="flex items-center gap-5 shrink-0 self-end lg:self-auto">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Approved Budget</div>
                      <div className="text-base font-black text-slate-900">{formatCurrency(wo.budget, settings)}</div>
                    </div>

                    <div className="w-36">
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

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      {setActiveTab && (
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('sales_form_draft', JSON.stringify({
                                customerName: wo.clientName,
                                company: wo.company,
                                branchName: wo.branchName || '',
                                workOrderNumber: wo.orderNumber,
                                notes: `Ref Work Order #${wo.orderNumber}`,
                                items: []
                              }));
                            }
                            setActiveTab('sales');
                          }}
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
                        title="Edit Work Order"
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

                {/* Expanded Invoices Accordion */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-xs">
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Receipt size={14} className="text-indigo-600" />
                        Invoices Billed against #{wo.orderNumber} ({linked.length} bills)
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
                            onClick={() => {
                              if (typeof window !== 'undefined') {
                                localStorage.setItem('sales_form_draft', JSON.stringify({
                                  customerName: wo.clientName,
                                  company: wo.company,
                                  branchName: wo.branchName || '',
                                  workOrderNumber: wo.orderNumber,
                                  notes: `Ref Work Order #${wo.orderNumber}`,
                                  items: []
                                }));
                              }
                              setActiveTab('sales');
                            }}
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-500 focus:bg-white"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
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
    </div>
  );
};
