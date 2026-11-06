import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ChequeRecord, PaymentAccount, Vendor, Transaction } from '../../../../types';
import { 
  issueCheque, 
  markChequeAsCleared, 
  markChequeAsBounced, 
  cancelCheque,
  getChequeDaysRemaining 
} from '../../../../services/chequeService';
import { calculateAccountBalance } from '../../../../lib/accountBalance';
import { useSettings } from '../../../../context/SettingsContext';
import { useAuth } from '../../../../context/AuthContext';
import { formatCurrency } from '../../../../lib/utils';
import { toast } from 'react-hot-toast';
import { 
  CreditCard, 
  Search, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Building2, 
  RefreshCw, 
  ArrowUpDown, 
  FileText, 
  DollarSign, 
  AlertCircle,
  HelpCircle,
  Ban
} from 'lucide-react';

export default function ChequeTracker() {
  const { settings } = useSettings();
  const { user } = useAuth();
  
  const [cheques, setCheques] = useState<ChequeRecord[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'due_soon' | 'cleared' | 'bounced' | 'cancelled'>('all');
  const [bankFilter, setBankFilter] = useState<string>('all');

  // Modals
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showBounceModal, setShowBounceModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [activeCheque, setActiveCheque] = useState<ChequeRecord | null>(null);

  // Modal form states
  const [issueForm, setIssueForm] = useState({
    chequeNumber: '',
    vendorId: '',
    vendorName: '',
    payeeName: '',
    amount: '',
    bankAccountId: '',
    issueDate: new Date().toISOString().split('T')[0],
    clearingDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [clearDate, setClearDate] = useState(new Date().toISOString().split('T')[0]);
  const [clearNote, setClearNote] = useState('');
  const [bounceReason, setBounceReason] = useState('Insufficient Funds (অপর্যাপ্ত ব্যালেন্স)');
  const [customBounceReason, setCustomBounceReason] = useState('');
  const [bounceFee, setBounceFee] = useState<string>('0');
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Real-time Firestore Listeners
  useEffect(() => {
    setLoading(true);
    const unsubCheques = onSnapshot(
      query(collection(db, 'cheques'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const list: ChequeRecord[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChequeRecord));
        setCheques(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching cheques:', err);
        setLoading(false);
      }
    );

    const unsubAccounts = onSnapshot(collection(db, 'payment_accounts'), (snapshot) => {
      setPaymentAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentAccount)));
    });

    const unsubVendors = onSnapshot(collection(db, 'vendors'), (snapshot) => {
      setVendors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vendor)));
    });

    const unsubTx = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    });

    return () => {
      unsubCheques();
      unsubAccounts();
      unsubVendors();
      unsubTx();
    };
  }, []);

  // Filtered Cheques
  const filteredCheques = useMemo(() => {
    return cheques.filter(ch => {
      // Search
      const search = searchQuery.toLowerCase().trim();
      const matchSearch = !search || 
        (ch.chequeNumber || '').toLowerCase().includes(search) ||
        (ch.vendorName || '').toLowerCase().includes(search) ||
        (ch.payeeName || '').toLowerCase().includes(search) ||
        (ch.bankAccountName || '').toLowerCase().includes(search) ||
        (ch.purchaseNumber || '').toLowerCase().includes(search);

      if (!matchSearch) return false;

      // Bank Filter
      if (bankFilter !== 'all' && ch.bankAccountId !== bankFilter) {
        return false;
      }

      // Status Filter
      if (statusFilter === 'all') return true;
      if (statusFilter === 'due_soon') {
        if (ch.status !== 'pending') return false;
        const days = getChequeDaysRemaining(ch.clearingDate);
        return days <= 3; // today, overdue or within next 3 days
      }
      return ch.status === statusFilter;
    });
  }, [cheques, searchQuery, statusFilter, bankFilter]);

  // Metrics
  const metrics = useMemo(() => {
    let pendingCount = 0;
    let pendingTotal = 0;
    let dueSoonCount = 0;
    let dueSoonTotal = 0;
    let clearedCount = 0;
    let clearedTotal = 0;
    let bouncedCount = 0;
    let bouncedTotal = 0;
    let shortfallAlerts = 0;

    cheques.forEach(ch => {
      const amt = Number(ch.amount) || 0;
      if (ch.status === 'pending') {
        pendingCount++;
        pendingTotal += amt;
        const days = getChequeDaysRemaining(ch.clearingDate);
        if (days <= 3) {
          dueSoonCount++;
          dueSoonTotal += amt;
        }

        // Check if bank balance is insufficient
        const acc = paymentAccounts.find(a => a.id === ch.bankAccountId);
        if (acc) {
          const bal = calculateAccountBalance(acc, transactions);
          if (bal < amt && days <= 3) {
            shortfallAlerts++;
          }
        }
      } else if (ch.status === 'cleared') {
        clearedCount++;
        clearedTotal += amt;
      } else if (ch.status === 'bounced') {
        bouncedCount++;
        bouncedTotal += amt;
      }
    });

    return {
      pendingCount,
      pendingTotal,
      dueSoonCount,
      dueSoonTotal,
      clearedCount,
      clearedTotal,
      bouncedCount,
      bouncedTotal,
      shortfallAlerts
    };
  }, [cheques, paymentAccounts, transactions]);

  // Handle Issue Cheque
  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueForm.chequeNumber.trim()) {
      toast.error('অনুগ্রহ করে চেক নম্বরটি লিখুন!');
      return;
    }
    const amt = Number(issueForm.amount);
    if (!amt || amt <= 0) {
      toast.error('বৈধ চেকের টাকার পরিমাণ দিন!');
      return;
    }
    if (!issueForm.bankAccountId) {
      toast.error('যে ব্যাংক থেকে চেক দিচ্ছেন তা সিলেক্ট করুন!');
      return;
    }

    const selAcc = paymentAccounts.find(a => a.id === issueForm.bankAccountId);
    setSubmitting(true);
    try {
      await issueCheque({
        chequeNumber: issueForm.chequeNumber,
        amount: amt,
        bankAccountId: issueForm.bankAccountId,
        bankAccountName: selAcc?.name || 'Bank',
        bankName: (selAcc as any)?.bankName || selAcc?.name || 'Bank',
        vendorId: issueForm.vendorId || '',
        vendorName: issueForm.vendorName || issueForm.payeeName || 'Vendor',
        payeeName: issueForm.payeeName || issueForm.vendorName || '',
        issueDate: issueForm.issueDate,
        clearingDate: issueForm.clearingDate,
        notes: issueForm.notes,
        user: user?.displayName || user?.email || 'Admin',
      });

      toast.success(`চেক #${issueForm.chequeNumber} সফলভাবে ইস্যু করা হয়েছে!`);
      setShowIssueModal(false);
      setIssueForm({
        chequeNumber: '',
        vendorId: '',
        vendorName: '',
        payeeName: '',
        amount: '',
        bankAccountId: '',
        issueDate: new Date().toISOString().split('T')[0],
        clearingDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'চেক ইস্যু করতে ব্যর্থ হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Mark Cleared
  const handleClearSubmit = async () => {
    if (!activeCheque) return;
    setSubmitting(true);
    try {
      await markChequeAsCleared({
        cheque: activeCheque,
        clearingDate: clearDate,
        user: user?.displayName || user?.email || 'Admin',
        note: clearNote,
      });
      toast.success(`চেক #${activeCheque.chequeNumber} ক্লিয়ার্ড / পেইড হিসেবে রেকর্ড করা হয়েছে!`);
      setShowClearModal(false);
      setActiveCheque(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'ক্লিয়ার করতে ব্যর্থ হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Mark Bounced
  const handleBounceSubmit = async () => {
    if (!activeCheque) return;
    const reason = bounceReason === 'Other / Custom' ? customBounceReason.trim() : bounceReason;
    if (!reason) {
      toast.error('বাউন্সের কারণ উল্লেখ করুন!');
      return;
    }
    setSubmitting(true);
    try {
      await markChequeAsBounced({
        cheque: activeCheque,
        bounceReason: reason,
        bounceFee: Number(bounceFee) || 0,
        user: user?.displayName || user?.email || 'Admin',
      });
      toast.error(`চেক #${activeCheque.chequeNumber} বাউন্সড হিসেবে রেকর্ড হয়েছে এবং সাপ্লায়ারের বকেয়া ফিরে এসেছে!`);
      setShowBounceModal(false);
      setActiveCheque(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'বাউন্স রেকর্ড করতে ব্যর্থ হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Cancel Cheque
  const handleCancelSubmit = async () => {
    if (!activeCheque) return;
    if (!cancelReason.trim()) {
      toast.error('বাতিল করার কারণ লিখুন!');
      return;
    }
    setSubmitting(true);
    try {
      await cancelCheque({
        cheque: activeCheque,
        reason: cancelReason,
        user: user?.displayName || user?.email || 'Admin',
      });
      toast.success(`চেক #${activeCheque.chequeNumber} বাতিল করা হয়েছে`);
      setShowCancelModal(false);
      setActiveCheque(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'বাতিল করতে ব্যর্থ হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <CreditCard size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Cheque Tracker & Clearance (চেক রেজিস্টার)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                পারচেজ ও সাপ্লায়ারদের দেওয়া চেকের ক্লিয়ারিং, বাউন্স ট্র্যাকিং এবং ব্যাংকের ব্যালেন্স সতর্কতা
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setShowIssueModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>নতুন চেক ইস্যু (Issue Cheque)</span>
          </button>
        </div>
      </div>

      {/* Insufficient Balance Critical Banner */}
      {metrics.shortfallAlerts > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3 text-red-900 animate-pulse">
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-extrabold text-sm text-red-800">
              ⚠️ ব্যাংকে অপর্যাপ্ত ব্যালেন্স সতর্কতা ({metrics.shortfallAlerts} টি চেক ঝুঁকিতে!)
            </h4>
            <p className="text-xs text-red-700 mt-0.5">
              সামনের ৩ দিনের মধ্যে ক্লিয়ারিং হওয়ার কথা এমন এক বা একাধিক চেকের সমপরিমাণ ব্যালেন্স সংশ্লিষ্ট ব্যাংকে নেই। বাউন্স এড়াতে অবিলম্বে ব্যাংকে ফান্ড ডিপোজিট বা ট্রান্সফার করুন।
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Card */}
        <div 
          onClick={() => setStatusFilter('pending')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20'
              : 'bg-white border-slate-200/80 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Pending Clearance
            </span>
            <span className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <Clock size={16} />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatCurrency(metrics.pendingTotal, settings)}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            {metrics.pendingCount} টি চেক ক্লিয়ারিংয়ের অপেক্ষায়
          </div>
        </div>

        {/* Due Soon / Today Card */}
        <div 
          onClick={() => setStatusFilter('due_soon')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'due_soon'
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/20'
              : 'bg-white border-slate-200/80 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>Due in 3 Days</span>
              {metrics.dueSoonCount > 0 && (
                <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] rounded-full font-black">
                  {metrics.dueSoonCount}
                </span>
              )}
            </span>
            <span className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <Calendar size={16} />
            </span>
          </div>
          <div className="text-2xl font-black text-rose-900">
            {formatCurrency(metrics.dueSoonTotal, settings)}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            আজ বা আসন্ন ৩ দিনে ক্লিয়ার হবে
          </div>
        </div>

        {/* Cleared Card */}
        <div 
          onClick={() => setStatusFilter('cleared')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'cleared'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/20'
              : 'bg-white border-slate-200/80 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Cleared / Paid
            </span>
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-950">
            {formatCurrency(metrics.clearedTotal, settings)}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            {metrics.clearedCount} টি চেক ব্যাংক পাস হয়েছে
          </div>
        </div>

        {/* Bounced Card */}
        <div 
          onClick={() => setStatusFilter('bounced')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'bounced'
              ? 'bg-red-50/80 border-red-300 ring-2 ring-red-400/20'
              : 'bg-white border-slate-200/80 hover:border-red-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-red-800 uppercase tracking-wider">
              Bounced Cheques
            </span>
            <span className="p-2 bg-red-100 text-red-700 rounded-xl">
              <XCircle size={16} />
            </span>
          </div>
          <div className="text-2xl font-black text-red-900">
            {formatCurrency(metrics.bouncedTotal, settings)}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            {metrics.bouncedCount} টি চেক প্রত্যাখ্যাত (বকেয়া বহাল)
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1 bg-slate-100/80 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              All Cheques ({cheques.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'pending' ? 'bg-white text-amber-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Pending ({metrics.pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('due_soon')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                statusFilter === 'due_soon' ? 'bg-white text-rose-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              <span>Due Soon</span>
              {metrics.dueSoonCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter('cleared')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'cleared' ? 'bg-white text-emerald-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Cleared ({metrics.clearedCount})
            </button>
            <button
              onClick={() => setStatusFilter('bounced')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'bounced' ? 'bg-white text-red-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Bounced ({metrics.bouncedCount})
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'cancelled' ? 'bg-white text-slate-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Cancelled
            </button>
          </div>

          {/* Bank Account Selector */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={bankFilter}
              onChange={e => setBankFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Bank Accounts</option>
              {paymentAccounts
                .filter(a => a.type === 'bank' || a.name.toLowerCase().includes('bank'))
                .map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Search Field */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Cheque No, Supplier name, Purchase Bill #, or Bank..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Cheques Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Cheque No</th>
                <th className="py-3.5 px-4">Payee / Supplier</th>
                <th className="py-3.5 px-4">Bank Account</th>
                <th className="py-3.5 px-4">Issue Date</th>
                <th className="py-3.5 px-4">Clearing (PDC) Date</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="animate-spin inline mr-2" size={18} />
                    চেকের তালিকা লোড হচ্ছে...
                  </td>
                </tr>
              ) : filteredCheques.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    কোনো চেক রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredCheques.map(ch => {
                  const days = getChequeDaysRemaining(ch.clearingDate);
                  const isPending = ch.status === 'pending';
                  const isCleared = ch.status === 'cleared';
                  const isBounced = ch.status === 'bounced';
                  const isCancelled = ch.status === 'cancelled';

                  // Account balance & sufficiency
                  const acc = paymentAccounts.find(a => a.id === ch.bankAccountId);
                  const currentBal = acc ? calculateAccountBalance(acc, transactions) : 0;
                  const isShortfall = isPending && currentBal < ch.amount;

                  return (
                    <tr 
                      key={ch.id} 
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isShortfall && days <= 3 ? 'bg-red-50/30' : ''
                      }`}
                    >
                      {/* Cheque No */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <CreditCard size={14} className="text-indigo-600 shrink-0" />
                          <span>{ch.chequeNumber}</span>
                        </div>
                        {ch.purchaseNumber && (
                          <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                            Bill #{ch.purchaseNumber}
                          </div>
                        )}
                      </td>

                      {/* Payee / Supplier */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {ch.payeeName || ch.vendorName || '—'}
                        </div>
                        {ch.notes && (
                          <div className="text-[10px] text-slate-500 italic max-w-xs truncate">
                            {ch.notes}
                          </div>
                        )}
                      </td>

                      {/* Bank Account */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <Building2 size={13} className="text-slate-400" />
                          <span>{ch.bankAccountName || ch.bankName || 'Bank Account'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Current Bal: <span className="font-mono font-bold">{formatCurrency(currentBal, settings)}</span>
                        </div>
                      </td>

                      {/* Issue Date */}
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {ch.issueDate}
                      </td>

                      {/* Clearing (PDC) Date */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {ch.clearingDate}
                        </div>
                        {isPending && (
                          <div className="mt-0.5">
                            {days < 0 ? (
                              <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                                Overdue by {Math.abs(days)} day(s)
                              </span>
                            ) : days === 0 ? (
                              <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded animate-pulse">
                                Due Today!
                              </span>
                            ) : days === 1 ? (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                Due Tomorrow
                              </span>
                            ) : days <= 3 ? (
                              <span className="text-[10px] font-semibold text-amber-700">
                                Due in {days} days
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">
                                In {days} days
                              </span>
                            )}
                          </div>
                        )}
                        {isCleared && ch.clearedAt && (
                          <div className="text-[10px] text-emerald-600 mt-0.5">
                            Cleared: {new Date(ch.clearedAt).toLocaleDateString()}
                          </div>
                        )}
                        {isBounced && ch.bouncedAt && (
                          <div className="text-[10px] text-red-600 mt-0.5">
                            Bounced: {new Date(ch.bouncedAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono font-extrabold text-slate-900 text-sm">
                          {formatCurrency(ch.amount, settings)}
                        </div>
                        {isShortfall && (
                          <div className="text-[10px] font-bold text-red-600 flex items-center justify-end gap-1 mt-0.5">
                            <AlertCircle size={10} />
                            <span>Shortfall: {formatCurrency(ch.amount - currentBal, settings)}</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock size={11} /> Pending
                          </span>
                        )}
                        {isCleared && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 size={11} /> Cleared
                          </span>
                        )}
                        {isBounced && (
                          <span 
                            title={ch.bounceReason || 'Bounced'}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200 cursor-help"
                          >
                            <XCircle size={11} /> Bounced
                          </span>
                        )}
                        {isCancelled && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <Ban size={11} /> Cancelled
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setActiveCheque(ch);
                                setClearDate(new Date().toISOString().split('T')[0]);
                                setShowClearModal(true);
                              }}
                              title="Mark Cheque as Cleared (Deducts Bank Balance & Completes Payment)"
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <CheckCircle2 size={13} />
                              <span>Clear</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveCheque(ch);
                                setBounceReason('Insufficient Funds (অপর্যাপ্ত ব্যালেন্স)');
                                setBounceFee('0');
                                setShowBounceModal(true);
                              }}
                              title="Mark Cheque as Bounced (Restores Supplier Due)"
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <XCircle size={13} />
                              <span>Bounce</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveCheque(ch);
                                setCancelReason('');
                                setShowCancelModal(true);
                              }}
                              title="Cancel Cheque"
                              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"
                            >
                              <Ban size={14} />
                            </button>
                          </div>
                        ) : isBounced ? (
                          <div className="text-[11px] text-red-600 font-medium">
                            {ch.bounceReason || 'Dishonored'}
                          </div>
                        ) : isCleared ? (
                          <span className="text-[11px] text-emerald-700 font-bold">
                            ✓ Paid
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Cancelled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* -------------------- MODAL 1: ISSUE CHEQUE -------------------- */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-600 font-black text-base">
                <CreditCard size={20} />
                <span>নতুন ব্যাংক চেক ইস্যু করুন (Issue Cheque)</span>
              </div>
              <button 
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs">
              {/* Cheque Number & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    চেক নম্বর (Cheque No) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CK-890214"
                    value={issueForm.chequeNumber}
                    onChange={e => setIssueForm({ ...issueForm, chequeNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    টাকার পরিমাণ (Amount ৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="0.00"
                    value={issueForm.amount}
                    onChange={e => setIssueForm({ ...issueForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 font-mono font-extrabold text-sm"
                  />
                </div>
              </div>

              {/* Bank Account Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  যে ব্যাংক থেকে চেক প্রদান করছেন (Bank Account) *
                </label>
                <select
                  required
                  value={issueForm.bankAccountId}
                  onChange={e => setIssueForm({ ...issueForm, bankAccountId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-800"
                >
                  <option value="">-- ব্যাংক অ্যাকাউন্ট সিলেক্ট করুন --</option>
                  {paymentAccounts
                    .filter(a => a.type === 'bank' || a.name.toLowerCase().includes('bank'))
                    .map(a => {
                      const bal = calculateAccountBalance(a, transactions);
                      return (
                        <option key={a.id} value={a.id}>
                          {a.name} (বর্তমান ব্যালেন্স: ৳{bal.toLocaleString()})
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* Vendor / Payee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    সাপ্লায়ার (Vendor - ঐচ্ছিক)
                  </label>
                  <select
                    value={issueForm.vendorId}
                    onChange={e => {
                      const v = vendors.find(x => x.id === e.target.value);
                      setIssueForm({
                        ...issueForm,
                        vendorId: e.target.value,
                        vendorName: v?.name || '',
                        payeeName: v?.name || issueForm.payeeName,
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
                  >
                    <option value="">-- সাপ্লায়ার সিলেক্ট করুন --</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    চেকে উল্লিখিত নাম (Payee Name)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Star Tech Ltd"
                    value={issueForm.payeeName}
                    onChange={e => setIssueForm({ ...issueForm, payeeName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    চেক ইস্যুর তারিখ (Issue Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={issueForm.issueDate}
                    onChange={e => setIssueForm({ ...issueForm, issueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>ক্লিয়ারিং / PDC তারিখ (Maturity) *</span>
                    <span className="text-[10px] text-indigo-600 font-bold">ক্যাশ হওয়ার দিন</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={issueForm.clearingDate}
                    onChange={e => setIssueForm({ ...issueForm, clearingDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium text-indigo-900 font-bold"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  নোট / বিবরণ (Notes)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Payment for Motherboards procurement"
                  value={issueForm.notes}
                  onChange={e => setIssueForm({ ...issueForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'সংরক্ষণ হচ্ছে...' : 'চেক ইস্যু নিশ্চিত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- MODAL 2: MARK AS CLEARED -------------------- */}
      {showClearModal && activeCheque && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900">
                  চেক ক্লিয়ারিং নিশ্চিতকরণ (Mark as Cleared)
                </h3>
                <p className="text-xs text-slate-500">
                  ব্যাংক থেকে টাকা ডেবিট হবে এবং সাপ্লায়ারের পেমেন্ট সম্পন্ন হবে।
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Cheque No:</span>
                <span className="font-mono font-bold text-slate-900">{activeCheque.chequeNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Payee:</span>
                <span className="font-bold text-slate-900">{activeCheque.payeeName || activeCheque.vendorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Bank Account:</span>
                <span className="font-semibold text-slate-900">{activeCheque.bankAccountName}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-700 font-bold">Amount:</span>
                <span className="font-mono font-black text-sm text-emerald-600">
                  {formatCurrency(activeCheque.amount, settings)}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  প্রকৃত ক্লিয়ারিংয়ের তারিখ (Actual Clearing Date) *
                </label>
                <input
                  type="date"
                  required
                  value={clearDate}
                  onChange={e => setClearDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  নোট / ব্যাংক রেফারেন্স (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cleared via City Bank online statement"
                  value={clearNote}
                  onChange={e => setClearNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowClearModal(false);
                  setActiveCheque(null);
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleClearSubmit}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-sm disabled:opacity-50"
              >
                {submitting ? 'প্রসেসিং হচ্ছে...' : '✓ ক্লিয়ার্ড কনফার্ম করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- MODAL 3: MARK AS BOUNCED -------------------- */}
      {showBounceModal && activeCheque && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-black text-base text-red-900">
                  চেক বাউন্স রেকর্ড করুন (Mark as Bounced)
                </h3>
                <p className="text-xs text-red-600">
                  সাপ্লায়ারের বকেয়া (Due) পুনরায় বহাল হবে।
                </p>
              </div>
            </div>

            <div className="bg-red-50/50 p-4 rounded-2xl border border-red-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 font-semibold">Cheque No:</span>
                <span className="font-mono font-bold text-slate-900">{activeCheque.chequeNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-semibold">Supplier:</span>
                <span className="font-bold text-slate-900">{activeCheque.payeeName || activeCheque.vendorName}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-red-200/60">
                <span className="text-red-900 font-bold">Restored Due:</span>
                <span className="font-mono font-black text-sm text-red-600">
                  {formatCurrency(activeCheque.amount, settings)}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  বাউন্সের কারণ (Bounce Reason) *
                </label>
                <select
                  value={bounceReason}
                  onChange={e => setBounceReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
                >
                  <option value="Insufficient Funds (অপর্যাপ্ত ব্যালেন্স)">Insufficient Funds (অপর্যাপ্ত ব্যালেন্স)</option>
                  <option value="Signature Mismatch (স্বাক্ষরে অমিল)">Signature Mismatch (স্বাক্ষরে অমিল)</option>
                  <option value="Date Expired / Stale (তারিখ উত্তীর্ণ)">Date Expired / Stale (তারিখ উত্তীর্ণ)</option>
                  <option value="Payment Stopped by Issuer (পেমেন্ট স্টপ)">Payment Stopped by Issuer (পেমেন্ট স্টপ)</option>
                  <option value="Account Blocked / Frozen (অ্যাকাউন্ট স্থগিত)">Account Blocked / Frozen (অ্যাকাউন্ট স্থগিত)</option>
                  <option value="Other / Custom">Other / কাস্টম কারণ লিখুন...</option>
                </select>
              </div>

              {bounceReason === 'Other / Custom' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    কাস্টম কারণ বিস্তারিত লিখুন *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Specify bounce reason..."
                    value={customBounceReason}
                    onChange={e => setCustomBounceReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ব্যাংক বাউন্স চার্জ / ফি (Bank Penalty Fee ৳ - ঐচ্ছিক)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={bounceFee}
                  onChange={e => setBounceFee(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  ব্যাংক যদি কোনো পেনাল্টি ফি কাটে, তা স্বয়ংক্রিয় ব্যাংক এক্সপেন্স হিসেবে যুক্ত হবে।
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowBounceModal(false);
                  setActiveCheque(null);
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleBounceSubmit}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-sm disabled:opacity-50"
              >
                {submitting ? 'প্রসেসিং হচ্ছে...' : '✕ বাউন্স নিশ্চিত করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- MODAL 4: CANCEL CHEQUE -------------------- */}
      {showCancelModal && activeCheque && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-black text-sm text-slate-900">
              চেক #{activeCheque.chequeNumber} বাতিল করতে চান?
            </h3>
            <p className="text-xs text-slate-500">
              চেকটি বাতিল করলে এটি আর ক্লিয়ার করা যাবে না।
            </p>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs">
                বাতিলের কারণ (Reason) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Replaced with cash payment"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setActiveCheque(null);
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
              >
                না
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleCancelSubmit}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold disabled:opacity-50"
              >
                {submitting ? 'বাতিল হচ্ছে...' : 'হ্যাঁ, বাতিল করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
