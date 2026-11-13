import React, { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import {
  X,
  Wallet,
  RotateCcw,
  CheckCircle2,
  Printer,
  Search,
  UserCheck,
  AlertCircle,
  Package,
  Calendar,
  FileText,
  FolderKanban,
} from 'lucide-react';
import { db } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../context/SettingsContext';
import { Customer, PaymentAccount, Transaction, WorkOrder } from '../../../types';
import { cn, formatCurrency } from '../../../lib/utils';
import { generateDocumentNumber } from '../../../lib/numbering';
import { generatePDF } from '../../../lib/pdf';
import { logAudit } from '../../../lib/audit';
import { calculateAccountBalance, validateSufficientBalance } from '../../../lib/accountBalance';
import {
  calculateCustomerAccountPosition,
  hasActiveProjectOrWorkOrderScope,
} from '../../../utils/customerAdvanceAccounting';

interface CustomerAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  paymentAccounts: PaymentAccount[];
  transactions: Transaction[];
  workOrders?: WorkOrder[];
  initialCustomer?: Customer | null;
  initialCustomerName?: string;
  initialMode?: 'receive' | 'refund';
  initialAmount?: number;
  initialItemNote?: string;
  initialWorkOrderNumber?: string;
  initialProjectName?: string;
  onSuccess?: () => void;
}

export const CustomerAdvanceModal: React.FC<CustomerAdvanceModalProps> = ({
  isOpen,
  onClose,
  customers,
  paymentAccounts,
  transactions,
  workOrders: propWorkOrders,
  initialCustomer = null,
  initialCustomerName = '',
  initialMode = 'receive',
  initialAmount,
  initialItemNote = '',
  initialWorkOrderNumber = '',
  initialProjectName = '',
  onSuccess,
}) => {
  const { profile, user } = useAuth();
  const { settings } = useSettings();

  const [mode, setMode] = useState<'receive' | 'refund'>(initialMode);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [workOrderNumber, setWorkOrderNumber] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [loadedWorkOrders, setLoadedWorkOrders] = useState<WorkOrder[]>([]);
  const [amount, setAmount] = useState<string>('');
  const [paymentAccountId, setPaymentAccountId] = useState<string>('');
  const [receiptDate, setReceiptDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [itemNote, setItemNote] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [printReceipt, setPrintReceipt] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const availableWorkOrders = propWorkOrders && propWorkOrders.length > 0 ? propWorkOrders : loadedWorkOrders;

  useEffect(() => {
    if (!isOpen || (propWorkOrders && propWorkOrders.length > 0)) return;
    let active = true;
    getDocs(collection(db, 'work_orders'))
      .then(snap => {
        if (!active) return;
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkOrder));
        list.sort((a, b) => new Date(b.issuedDate || b.createdAt || 0).getTime() - new Date(a.issuedDate || a.createdAt || 0).getTime());
        setLoadedWorkOrders(list);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isOpen, propWorkOrders]);

  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);

    let resolvedCustomerId = initialCustomer?.id || '';
    if (!resolvedCustomerId && initialCustomerName.trim()) {
      const targetLow = initialCustomerName.trim().toLowerCase();
      const matched = customers.find(c => (c.name || '').trim().toLowerCase() === targetLow);
      if (matched) resolvedCustomerId = matched.id;
    }

    setSelectedCustomerId(resolvedCustomerId);
    setCustomerSearch(resolvedCustomerId ? '' : initialCustomerName || '');
    setWorkOrderNumber(initialWorkOrderNumber || '');
    setProjectName(initialProjectName || initialCustomer?.branchName || '');
    setAmount(initialAmount && initialAmount > 0 ? String(initialAmount) : '');
    setItemNote(initialItemNote || '');
    setNotes('');
    setReceiptDate(new Date().toISOString().split('T')[0]);
    setPrintReceipt(initialMode === 'receive');
    if (paymentAccounts.length > 0) {
      const cashAcc = paymentAccounts.find(a => (a.type || '').toLowerCase() === 'cash');
      setPaymentAccountId((cashAcc || paymentAccounts[0]).id);
    } else {
      setPaymentAccountId('');
    }
  }, [
    isOpen,
    initialCustomer,
    initialCustomerName,
    initialMode,
    initialAmount,
    initialItemNote,
    initialWorkOrderNumber,
    initialProjectName,
    paymentAccounts,
    customers,
  ]);

  const activeCustomer = useMemo(
    () => customers.find(c => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers.slice(0, 60);
    return customers
      .filter(
        c =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.phone || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q)
      )
      .slice(0, 60);
  }, [customers, customerSearch]);

  const customerProjectSuggestions = useMemo(() => {
    const set = new Set<string>();
    if (activeCustomer?.branchName) set.add(activeCustomer.branchName.trim());
    (activeCustomer?.branches || []).forEach(b => b && set.add(b.trim()));
    availableWorkOrders.forEach(wo => {
      if (wo.branchName) set.add(wo.branchName.trim());
    });
    if (activeCustomer) {
      transactions.forEach(t => {
        if (t.entityId === activeCustomer.id && (t.projectName || t.branchName)) {
          set.add(String(t.projectName || t.branchName).trim());
        }
      });
    }
    return Array.from(set).filter(Boolean);
  }, [activeCustomer, availableWorkOrders, transactions]);

  const currentScope = useMemo(
    () => ({
      workOrderNumber: workOrderNumber.trim(),
      projectName: projectName.trim(),
    }),
    [workOrderNumber, projectName]
  );

  const hasScope = hasActiveProjectOrWorkOrderScope(currentScope);

  const overallPosition = useMemo(
    () => calculateCustomerAccountPosition(transactions, activeCustomer),
    [transactions, activeCustomer]
  );

  const customerPosition = useMemo(
    () =>
      calculateCustomerAccountPosition(
        transactions,
        activeCustomer,
        hasScope ? { scope: currentScope } : undefined
      ),
    [transactions, activeCustomer, hasScope, currentScope]
  );

  if (!isOpen) return null;

  const numAmount = Math.max(0, Number(amount) || 0);
  const selectedAccount = paymentAccounts.find(a => a.id === paymentAccountId);

  const projectedAdvanceAfter =
    mode === 'receive'
      ? Math.max(0, customerPosition.advanceBalance + numAmount - customerPosition.dueBalance)
      : Math.max(0, customerPosition.advanceBalance - numAmount);

  const handleWorkOrderSelect = (woVal: string) => {
    setWorkOrderNumber(woVal);
    const clean = woVal.trim().toLowerCase();
    const matchedWO = availableWorkOrders.find(
      w => (w.orderNumber || '').trim().toLowerCase() === clean
    );
    if (matchedWO) {
      if (matchedWO.branchName || matchedWO.title) {
        setProjectName(matchedWO.branchName || matchedWO.title);
      }
      if (!selectedCustomerId && matchedWO.clientName) {
        const custMatch = customers.find(
          c =>
            (c.name || '').trim().toLowerCase() ===
            matchedWO.clientName.trim().toLowerCase()
        );
        if (custMatch) setSelectedCustomerId(custMatch.id);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer) {
      toast.error('Please select a customer first');
      return;
    }
    if (numAmount <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }
    if (!selectedAccount) {
      toast.error('Please select a cash or bank payment account');
      return;
    }

    if (mode === 'refund') {
      if (numAmount > customerPosition.advanceBalance + 0.01) {
        const scopeText = hasScope ? ' for this Project / Work Order' : '';
        toast.error(
          `Refund cannot exceed available advance${scopeText} (${formatCurrency(customerPosition.advanceBalance, settings)})`
        );
        return;
      }
      const balCheck = validateSufficientBalance(selectedAccount, transactions, numAmount);
      if (!balCheck.valid) {
        toast.error(balCheck.error || 'Insufficient account balance for refund');
        return;
      }
    }

    try {
      setSubmitting(true);
      const createdAt = new Date().toISOString();
      const docNum = await generateDocumentNumber(mode === 'receive' ? 'ADV' : 'ADVR');
      const cleanWO = workOrderNumber.trim();
      const cleanProj = projectName.trim();
      const matchedWO = cleanWO
        ? availableWorkOrders.find(w => (w.orderNumber || '').trim().toLowerCase() === cleanWO.toLowerCase())
        : undefined;

      const scopeParts = [
        cleanWO ? `WO: ${cleanWO}` : '',
        cleanProj ? `Project: ${cleanProj}` : '',
      ].filter(Boolean);
      const scopeTag = scopeParts.length > 0 ? ` (${scopeParts.join(' | ')})` : '';
      const itemTag = itemNote.trim() ? ` [${itemNote.trim()}]` : '';
      const extraNote = notes.trim() ? ` - ${notes.trim()}` : '';

      const baseDescription =
        mode === 'receive'
          ? `Customer Advance Deposit${scopeTag}${itemTag}${extraNote}`
          : `Customer Advance Refund${scopeTag}${itemTag}${extraNote}`;

      const nextNetBalance =
        mode === 'receive'
          ? customerPosition.netBalance - numAmount
          : customerPosition.netBalance + numAmount;

      const payload: Record<string, any> = {
        type: mode === 'receive' ? 'payment_received' : 'advance_refund',
        amount: numAmount,
        date: receiptDate || createdAt.split('T')[0],
        description: baseDescription,
        entityId: activeCustomer.id,
        entityName: activeCustomer.name,
        entityType: 'customer',
        category: mode === 'receive' ? 'Customer Advance' : 'Customer Advance Refund',
        isAdvance: true,
        advanceItemNote: itemNote.trim() || undefined,
        documentNumber: docNum,
        referenceId: docNum,
        paymentAccountId: selectedAccount.id,
        paymentAccountName: selectedAccount.name,
        paymentMethod: selectedAccount.type || selectedAccount.name || 'cash',
        workOrderNumber: cleanWO,
        branchName: cleanProj || activeCustomer.branchName || '',
        projectName: cleanProj || activeCustomer.branchName || '',
        company: matchedWO?.company || activeCustomer.company || 'main',
        previousDue: customerPosition.netBalance,
        currentBalance: nextNetBalance,
        createdAt,
        createdBy: profile?.displayName || user?.email || 'Admin',
      };

      // Clean undefined keys before Firestore write
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

      const txRef = await addDoc(collection(db, 'transactions'), payload);

      await logAudit(
        'CREATE',
        mode === 'receive' ? 'Customer Advance' : 'Advance Refund',
        `${mode === 'receive' ? 'Received' : 'Refunded'} ৳${numAmount} ${mode === 'receive' ? 'advance from' : 'advance to'} ${activeCustomer.name} (${selectedAccount.name})${scopeTag}${itemTag}`,
        profile?.displayName || user?.email || 'Admin',
        {
          entityId: activeCustomer.id,
          newState: {
            transactionId: txRef.id,
            documentNumber: docNum,
            amount: numAmount,
            mode,
            workOrderNumber: cleanWO || null,
            projectName: cleanProj || null,
            paymentAccount: selectedAccount.name,
            advanceBalanceAfter: projectedAdvanceAfter,
          },
        }
      );

      if (mode === 'receive' && printReceipt) {
        await generatePDF({ id: txRef.id, ...payload } as any, 'receipt', settings);
      }

      toast.success(
        mode === 'receive'
          ? `Advance ${formatCurrency(numAmount, settings)} recorded for ${activeCustomer.name}${scopeTag}!`
          : `Advance refund ${formatCurrency(numAmount, settings)} recorded for ${activeCustomer.name}${scopeTag}!`
      );
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error recording customer advance:', error);
      toast.error(`Failed to save transaction: ${error?.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#081621] to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <Wallet size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Customer Advance & Deposit</h3>
              <p className="text-[11px] text-slate-300">
                Project & Work Order advance deposit / refund
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Switch */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setMode('receive');
                setPrintReceipt(true);
              }}
              className={cn(
                'py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all',
                mode === 'receive'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white'
              )}
            >
              <Wallet size={14} /> Receive Advance
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('refund');
                setPrintReceipt(false);
              }}
              disabled={Boolean(activeCustomer && customerPosition.advanceBalance <= 0)}
              className={cn(
                'py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all',
                mode === 'refund'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed'
              )}
            >
              <RotateCcw size={14} /> Refund Advance
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Customer Picker */}
          {!initialCustomer ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Customer *
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  placeholder="Filter customers by name or phone..."
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs mb-1.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>
              <select
                required
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              >
                <option value="">-- Choose a Customer --</option>
                {filteredCustomers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-bold text-sm flex items-center justify-center">
                  {(activeCustomer?.name || initialCustomer.name || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {activeCustomer?.name || initialCustomer.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {activeCustomer?.phone || initialCustomer.phone || 'No phone'}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
                <UserCheck size={12} /> Selected
              </span>
            </div>
          )}

          {/* Work Order # & Project / Branch Tagging */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-indigo-50/50 border border-indigo-200/70 rounded-xl">
            <div>
              <label className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <FileText size={12} className="text-indigo-600" /> Work Order # / PO
              </label>
              <input
                type="text"
                list="modal-work-orders-list"
                value={workOrderNumber}
                onChange={e => handleWorkOrderSelect(e.target.value)}
                placeholder="e.g. WO-2026-001"
                className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
              <datalist id="modal-work-orders-list">
                {availableWorkOrders.map(wo => (
                  <option key={wo.id || wo.orderNumber} value={wo.orderNumber}>
                    {wo.title} {wo.branchName ? `(${wo.branchName})` : ''}
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <label className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <FolderKanban size={12} className="text-indigo-600" /> Project / Branch
              </label>
              <input
                type="text"
                list="modal-project-suggestions"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="e.g. HQ Setup / Server Room"
                className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
              <datalist id="modal-project-suggestions">
                {customerProjectSuggestions.map((p, idx) => (
                  <option key={idx} value={p} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Customer Live Position */}
          {activeCustomer && (
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    {hasScope ? 'This Project / WO Status' : 'Current Status'}
                  </span>
                  {customerPosition.advanceBalance > 0 ? (
                    <span className="font-black text-emerald-700 text-sm">
                      Advance Credit: {formatCurrency(customerPosition.advanceBalance, settings)}
                    </span>
                  ) : customerPosition.dueBalance > 0 ? (
                    <span className="font-black text-rose-600 text-sm">
                      Outstanding Due: {formatCurrency(customerPosition.dueBalance, settings)}
                    </span>
                  ) : (
                    <span className="font-bold text-slate-700 text-sm">Settled (৳0)</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    {hasScope ? 'Project / WO Adv After' : 'Advance After This'}
                  </span>
                  <span className="font-black text-indigo-700 text-sm">
                    {formatCurrency(projectedAdvanceAfter, settings)}
                  </span>
                </div>
              </div>
              {hasScope && (overallPosition.advanceBalance !== customerPosition.advanceBalance || overallPosition.dueBalance !== customerPosition.dueBalance) && (
                <div className="flex justify-between text-[11px] px-1 text-slate-500 font-medium">
                  <span>Customer Total (All Projects):</span>
                  <span>
                    {overallPosition.advanceBalance > 0
                      ? `Advance ${formatCurrency(overallPosition.advanceBalance, settings)}`
                      : overallPosition.dueBalance > 0
                      ? `Due ${formatCurrency(overallPosition.dueBalance, settings)}`
                      : 'Settled (৳0)'}
                  </span>
                </div>
              )}
            </div>
          )}

          {activeCustomer && mode === 'receive' && customerPosition.dueBalance > 0 && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-600" />
              <span>
                This {hasScope ? 'Project / Work Order' : 'customer'} has {formatCurrency(customerPosition.dueBalance, settings)} existing due. The deposit will first offset that due; any remainder stays as Advance Credit.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Deposit / Refund Account */}
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                {mode === 'receive' ? 'Deposit To Account *' : 'Refund From Account *'}
              </label>
              <select
                required
                value={paymentAccountId}
                onChange={e => setPaymentAccountId(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              >
                <option value="">-- Select Account --</option>
                {paymentAccounts.map(acc => {
                  const bal = calculateAccountBalance(acc, transactions);
                  return (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type}) — {formatCurrency(bal, settings)}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Calendar size={12} /> Date *
              </label>
              <input
                type="date"
                required
                value={receiptDate}
                onChange={e => setReceiptDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                {mode === 'receive' ? 'Advance Amount (৳) *' : 'Refund Amount (৳) *'}
              </label>
              {mode === 'refund' && customerPosition.advanceBalance > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(customerPosition.advanceBalance))}
                  className="text-[11px] font-bold text-amber-700 hover:underline"
                >
                  Refund Max ({formatCurrency(customerPosition.advanceBalance, settings)})
                </button>
              )}
            </div>
            <input
              type="number"
              required
              min="1"
              step="any"
              max={mode === 'refund' ? customerPosition.advanceBalance : undefined}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base font-black text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Item Booking Note */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Package size={12} /> Product / Booking Reference (Optional)
            </label>
            <input
              type="text"
              value={itemNote}
              onChange={e => setItemNote(e.target.value)}
              placeholder="e.g. RTX 4070 Super / Server BOM Phase-1"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Extra Remarks */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any delivery date or payment reference note..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
          </div>

          {mode === 'receive' && (
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={printReceipt}
                onChange={e => setPrintReceipt(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <Printer size={14} className="text-slate-500" />
              Print Money Receipt PDF immediately after saving
            </label>
          )}

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'px-5 py-2.5 text-xs font-bold text-white rounded-xl flex items-center gap-2 shadow-sm transition-all disabled:opacity-50',
                mode === 'receive'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              )}
            >
              <CheckCircle2 size={15} />
              {submitting
                ? 'Saving...'
                : mode === 'receive'
                  ? 'Save Advance Deposit'
                  : 'Confirm Advance Refund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
