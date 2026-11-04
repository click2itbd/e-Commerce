import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, doc, limit } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { CashRegister, Order, Transaction } from '../../../../types';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
import {
  Wallet,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Search,
  Printer,
  Plus,
  Minus,
  X,
  Coins,
  FileText,
  RefreshCw,
  History,
  Lock,
  Unlock,
  Banknote,
  Eye,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { formatCurrency, cn } from '../../../../lib/utils';
import { toast } from 'react-hot-toast';

// Currency denominations for cash drawer breakdown
const BANGLADESH_DENOMINATIONS = [
  { value: 1000, label: '৳1000' },
  { value: 500, label: '৳500' },
  { value: 200, label: '৳200' },
  { value: 100, label: '৳100' },
  { value: 50, label: '৳50' },
  { value: 20, label: '৳20' },
  { value: 10, label: '৳10' },
  { value: 5, label: '৳5' },
  { value: 2, label: '৳2 / ৳1' },
];

interface CashMovement {
  id: string;
  time: string;
  type: string;
  description: string;
  amount: number;
  direction: 'in' | 'out';
  referenceId?: string;
}

export default function DayBook() {
  const { profile } = useAuth();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [activeRegister, setActiveRegister] = useState<CashRegister | null>(null);

  // Opening & Closing inputs
  const [openingBalance, setOpeningBalance] = useState<string>('');
  const [openingNotes, setOpeningNotes] = useState<string>('');
  const [useOpenDenomination, setUseOpenDenomination] = useState<boolean>(false);
  const [openDenomCounts, setOpenDenomCounts] = useState<Record<number, number>>({});

  const [closingBalance, setClosingBalance] = useState<string>('');
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [useCloseDenomination, setUseCloseDenomination] = useState<boolean>(false);
  const [closeDenomCounts, setCloseDenomCounts] = useState<Record<number, number>>({});

  // Active Register Stats & Live Cash Movements
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    expectedBalance: 0,
  });
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [movementFilter, setMovementFilter] = useState<'all' | 'in' | 'out'>('all');
  const [movementSearch, setMovementSearch] = useState('');

  // Quick Cash Adjustment Modal (Petty Cash / Float)
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjusting, setAdjusting] = useState<boolean>(false);

  // History search & Z-Report modal
  const [historySearch, setHistorySearch] = useState('');
  const [selectedSessionForZReport, setSelectedSessionForZReport] = useState<CashRegister | null>(null);

  // Calculate denomination total
  const computeDenomTotal = (counts: Record<number, number>) => {
    return Object.entries(counts).reduce((sum, [denom, count]) => {
      return sum + Number(denom) * (Number(count) || 0);
    }, 0);
  };

  const handleOpenDenomChange = (denom: number, count: number) => {
    const updated = { ...openDenomCounts, [denom]: Math.max(0, count || 0) };
    setOpenDenomCounts(updated);
    const total = computeDenomTotal(updated);
    setOpeningBalance(total > 0 ? total.toString() : '');
  };

  const handleCloseDenomChange = (denom: number, count: number) => {
    const updated = { ...closeDenomCounts, [denom]: Math.max(0, count || 0) };
    setCloseDenomCounts(updated);
    const total = computeDenomTotal(updated);
    setClosingBalance(total > 0 ? total.toString() : '');
  };

  const fetchRegisters = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'cash_register'), orderBy('openedAt', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CashRegister));
      setRegisters(data);

      const openReg = data.find(r => r.status === 'open');
      if (openReg) {
        setActiveRegister(openReg);
        await calculateStats(openReg);
      } else {
        setActiveRegister(null);
      }
    } catch (error) {
      console.error('Error fetching cash registers:', error);
      toast.error('Failed to load Day Book');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async (register: CashRegister) => {
    try {
      let income = 0;
      let expense = 0;
      const movements: CashMovement[] = [];

      // Query recent transactions
      const txQ = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(300));
      const txSnap = await getDocs(txQ);
      const coveredOrderIds = new Set<string>();

      txSnap.docs.forEach(d => {
        const tx = d.data() as Transaction;
        const txTime = tx.createdAt || (tx.date ? `${tx.date}T00:00:00.000Z` : '');
        if (!txTime || txTime < register.openedAt) return;

        if (tx.referenceId) {
          coveredOrderIds.add(tx.referenceId);
        }

        const isCash =
          tx.paymentMethod?.toLowerCase().includes('cash') ||
          tx.paymentAccountId?.toLowerCase().includes('cash') ||
          (!tx.paymentMethod && !tx.paymentAccountId);

        if (isCash) {
          const type = tx.type;
          const amt = Number(tx.amount || 0);

          if (['sale', 'income', 'payment_received', 'money_receipt', 'deposit', 'transfer_in'].includes(type)) {
            income += amt;
            movements.push({
              id: d.id,
              time: txTime,
              type: type.replace('_', ' ').toUpperCase(),
              description: tx.description || `Cash receipt (${type})`,
              amount: amt,
              direction: 'in',
              referenceId: tx.referenceId || tx.documentNumber,
            });
          } else if (['expense', 'purchase', 'payment_made', 'salary', 'conveyance', 'sale_return', 'withdrawal', 'transfer_out'].includes(type)) {
            expense += amt;
            movements.push({
              id: d.id,
              time: txTime,
              type: type.replace('_', ' ').toUpperCase(),
              description: tx.description || `Cash payment (${type})`,
              amount: amt,
              direction: 'out',
              referenceId: tx.referenceId || tx.documentNumber,
            });
          }
        }
      });

      // Also check cash orders that didn't generate a transaction entry
      const ordersQ = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(200));
      const ordersSnap = await getDocs(ordersQ);
      ordersSnap.docs.forEach(d => {
        const order = d.data() as Order;
        const ordTime = order.createdAt || '';
        if (!ordTime || ordTime < register.openedAt) return;

        if (!coveredOrderIds.has(d.id)) {
          if (order.paymentMethod?.toLowerCase().includes('cash')) {
            const paid = Number((order as any).paidAmount ?? (order as any).amountPaid ?? order.total ?? 0);
            if (paid > 0) {
              income += paid;
              movements.push({
                id: d.id,
                time: ordTime,
                type: 'CASH SALE',
                description: `Invoice #${(order as any).documentNumber || (order as any).invoiceNumber || d.id} (${order.customerName || 'Walk-in Customer'})`,
                amount: paid,
                direction: 'in',
                referenceId: d.id,
              });
            }
          }
        }
      });

      // Sort movements descending by time
      movements.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
      setCashMovements(movements);

      setStats({
        totalIncome: income,
        totalExpense: expense,
        expectedBalance: Number(register.openingBalance || 0) + income - expense,
      });
    } catch (error) {
      console.error('Error calculating register stats:', error);
    }
  };

  useEffect(() => {
    fetchRegisters();
  }, []);

  // Open Register
  const handleOpenRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(openingBalance);
    if (isNaN(amountNum) || amountNum < 0) {
      toast.error('Please enter a valid opening balance');
      return;
    }

    try {
      const newReg: Omit<CashRegister, 'id'> = {
        openedAt: new Date().toISOString(),
        openedBy: profile?.displayName || profile?.email || 'Admin',
        openingBalance: amountNum,
        status: 'open',
        notes: openingNotes || undefined,
      };

      await addDoc(collection(db, 'cash_register'), newReg);
      toast.success('Cash Drawer opened successfully!');
      setOpeningBalance('');
      setOpeningNotes('');
      setOpenDenomCounts({});
      setUseOpenDenomination(false);
      await fetchRegisters();
    } catch (error) {
      console.error('Error opening register:', error);
      toast.error('Failed to open register');
    }
  };

  // Close Register
  const handleCloseRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRegister || !activeRegister.id) return;
    const actualCount = Number(closingBalance);
    if (closingBalance === '' || isNaN(actualCount)) {
      toast.error('Please enter the actual counted cash in drawer');
      return;
    }

    try {
      const discrepancy = actualCount - stats.expectedBalance;

      await updateDoc(doc(db, 'cash_register', activeRegister.id), {
        status: 'closed',
        closedAt: new Date().toISOString(),
        closedBy: profile?.displayName || profile?.email || 'Admin',
        closingBalance: actualCount,
        expectedBalance: stats.expectedBalance,
        discrepancy,
        notes: closingNotes || undefined,
      });

      toast.success('Register closed and reconciled successfully!');
      setClosingBalance('');
      setClosingNotes('');
      setCloseDenomCounts({});
      setUseCloseDenomination(false);
      await fetchRegisters();
    } catch (error) {
      console.error('Error closing register:', error);
      toast.error('Failed to close register');
    }
  };

  // Handle Quick Cash Float / Petty Cash Adjustment
  const handleRecordAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(adjustAmount);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!adjustReason.trim()) {
      toast.error('Please enter a note/reason for this cash movement');
      return;
    }

    try {
      setAdjusting(true);
      const now = new Date().toISOString();
      const isDeposit = adjustType === 'in';

      await addDoc(collection(db, 'transactions'), {
        type: isDeposit ? 'deposit' : 'expense',
        amount: amt,
        date: now.split('T')[0],
        createdAt: now,
        description: `Drawer ${isDeposit ? 'Cash Float In' : 'Petty Cash Out'}: ${adjustReason}`,
        paymentMethod: 'cash',
        entityName: profile?.displayName || 'Cashier',
      });

      toast.success(`৳${amt} ${isDeposit ? 'added to' : 'withdrawn from'} drawer`);
      setShowAdjustModal(false);
      setAdjustAmount('');
      setAdjustReason('');
      if (activeRegister) {
        await calculateStats(activeRegister);
      }
    } catch (error) {
      console.error('Error recording cash adjustment:', error);
      toast.error('Failed to record adjustment');
    } finally {
      setAdjusting(false);
    }
  };

  // Active Register Duration formatting
  const registerDuration = useMemo(() => {
    if (!activeRegister?.openedAt) return '';
    const start = new Date(activeRegister.openedAt).getTime();
    const now = new Date().getTime();
    const diffMs = Math.max(0, now - start);
    const hrs = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hrs}h ${mins}m`;
  }, [activeRegister]);

  // Filtered live movements
  const filteredMovements = useMemo(() => {
    return cashMovements.filter(m => {
      if (movementFilter === 'in' && m.direction !== 'in') return false;
      if (movementFilter === 'out' && m.direction !== 'out') return false;
      if (!movementSearch.trim()) return true;
      const q = movementSearch.toLowerCase();
      return (
        m.description.toLowerCase().includes(q) ||
        m.type.toLowerCase().includes(q) ||
        (m.referenceId && m.referenceId.toLowerCase().includes(q))
      );
    });
  }, [cashMovements, movementFilter, movementSearch]);

  // Filtered closed history
  const filteredHistory = useMemo(() => {
    return registers
      .filter(r => r.status === 'closed')
      .filter(r => {
        if (!historySearch.trim()) return true;
        const q = historySearch.toLowerCase();
        return (
          r.openedBy?.toLowerCase().includes(q) ||
          r.closedBy?.toLowerCase().includes(q) ||
          r.openedAt?.toLowerCase().includes(q) ||
          r.closedAt?.toLowerCase().includes(q) ||
          r.notes?.toLowerCase().includes(q)
        );
      });
  }, [registers, historySearch]);

  const lastClosedRegister = useMemo(() => {
    return registers.find(r => r.status === 'closed') || null;
  }, [registers]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto print:space-y-3 print:p-0">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 md:p-6 transition-all hover:shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md transition-all",
              activeRegister
                ? "bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/20"
                : "bg-gradient-to-tr from-slate-700 to-slate-900 shadow-slate-500/20"
            )}>
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                  Day Book / Cash Drawer
                </h1>
                {activeRegister ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active Register
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                    <Lock size={12} /> Drawer Closed
                  </span>
                )}
              </div>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                {activeRegister
                  ? `Opened by ${activeRegister.openedBy} • Active for ${registerDuration}`
                  : 'Start of day opening cash declaration, real-time drawer flow, and end-of-day closing reconciliation'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {activeRegister && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setAdjustType('in');
                    setShowAdjustModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all shadow-xs"
                >
                  <Plus size={14} /> Float In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdjustType('out');
                    setShowAdjustModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all shadow-xs"
                >
                  <Minus size={14} /> Petty Cash Out
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              title="Print Day Book"
              className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-50 shadow-sm transition-all"
            >
              <Printer size={18} />
            </button>

            <button
              type="button"
              onClick={fetchRegisters}
              disabled={loading}
              title="Reload Register"
              className="p-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-white shadow-sm shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              <RefreshCw size={18} className={cn(loading && "animate-spin")} />
            </button>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {/* Card 1: Expected / Current Drawer Cash */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {activeRegister ? 'Expected Cash in Drawer' : 'Last Ending Cash'}
            </span>
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              activeRegister ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
            )}>
              <Banknote size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className={cn(
              "text-2xl font-black tracking-tight",
              activeRegister ? "text-emerald-600" : "text-slate-800"
            )}>
              {formatCurrency(activeRegister ? stats.expectedBalance : (lastClosedRegister?.closingBalance || 0), settings)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500">
                {activeRegister ? `Started with ${formatCurrency(activeRegister.openingBalance, settings)}` : 'Closed session'}
              </span>
              <span className={cn(
                "inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border",
                activeRegister
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              )}>
                {activeRegister ? 'In Drawer' : 'Reconciled'}
              </span>
            </div>
          </div>
          <div className={cn("absolute bottom-0 left-0 right-0 h-1", activeRegister ? "bg-emerald-500" : "bg-slate-400")} />
        </div>

        {/* Card 2: Cash In / Sales */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Cash In (Today)</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-blue-600">
              {formatCurrency(stats.totalIncome, settings)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500">Sales, Receipts & Floats</span>
              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Inflow
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
        </div>

        {/* Card 3: Cash Out / Petty Cash */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Cash Out (Today)</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-rose-600">
              {formatCurrency(stats.totalExpense, settings)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500">Expenses & Cash Out</span>
              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                Outflow
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
        </div>

        {/* Card 4: Drawer Status & Net Movement */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Cash Movement</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className={cn(
              "text-2xl font-black tracking-tight",
              (stats.totalIncome - stats.totalExpense) >= 0 ? "text-indigo-600" : "text-amber-600"
            )}>
              {formatCurrency(stats.totalIncome - stats.totalExpense, settings)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500">Cash In - Cash Out</span>
              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Session Flow
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500" />
        </div>
      </div>

      {/* Main Interactive Section: When Closed (Open Form) OR When Open (Active Controls & Live Feed) */}
      {!activeRegister ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6 md:p-8 max-w-2xl mx-auto transition-all">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Calculator size={32} />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800">Open Cash Drawer</h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Declare physical cash in the drawer to start today's POS/billing session
            </p>
          </div>

          {/* Previous register preview if available */}
          {lastClosedRegister && (
            <div className="mb-6 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-700 block">Last Closed Session:</span>
                <span className="text-slate-500 text-[11px]">
                  {lastClosedRegister.closedAt ? new Date(lastClosedRegister.closedAt).toLocaleDateString() : '-'} by {lastClosedRegister.closedBy}
                </span>
              </div>
              <div className="text-right">
                <span className="font-black text-slate-800 text-sm block">
                  {formatCurrency(lastClosedRegister.closingBalance || 0, settings)}
                </span>
                <button
                  type="button"
                  onClick={() => setOpeningBalance(String(lastClosedRegister.closingBalance || 0))}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Use as Opening Cash
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleOpenRegister} className="space-y-5">
            {/* Toggle Denomination Counter */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Opening Cash Calculation
              </label>
              <button
                type="button"
                onClick={() => setUseOpenDenomination(!useOpenDenomination)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60 transition-all"
              >
                <Coins size={14} />
                {useOpenDenomination ? 'Direct Amount Input' : 'Use Note Counter (নোট গণনাকারী)'}
              </button>
            </div>

            {/* Denomination Grid */}
            {useOpenDenomination ? (
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <p className="text-xs text-slate-500 font-medium">Enter note counts in drawer:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {BANGLADESH_DENOMINATIONS.map(d => (
                    <div key={d.value} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-slate-700">{d.label}</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={openDenomCounts[d.value] || ''}
                        onChange={e => handleOpenDenomChange(d.value, parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 text-xs text-right font-bold border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  ))}
                </div>
                <div className="pt-2 flex justify-between items-center text-sm font-black text-slate-800 border-t border-slate-200">
                  <span>Calculated Total:</span>
                  <span className="text-blue-600 text-base">{formatCurrency(computeDenomTotal(openDenomCounts), settings)}</span>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Opening Balance (Cash in Drawer)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={openingBalance}
                    onChange={e => setOpeningBalance(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-lg font-black text-slate-800 shadow-xs"
                    placeholder="0.00"
                  />
                </div>
                {/* Quick Presets */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-slate-400 font-medium">Quick presets:</span>
                  {[0, 1000, 2000, 5000, 10000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setOpeningBalance(String(amt))}
                      className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      ৳{amt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Shift / Opening Notes (Optional)
              </label>
              <input
                type="text"
                value={openingNotes}
                onChange={e => setOpeningNotes(e.target.value)}
                placeholder="e.g. Morning counter shift, cash float verified..."
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl font-extrabold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Unlock size={18} /> Open Register
            </button>
          </form>
        </div>
      ) : (
        /* When Register is OPEN: 2 Columns (Left: Session stats + Live Cash Movements | Right: Close Register Form) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left 2 Cols: Active Session Card + Live Movements */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Session Overview Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 md:p-6 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    Active Cash Register Session
                  </h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Clock size={13} className="text-blue-600" />
                    Opened on {new Date(activeRegister.openedAt).toLocaleString()} by <span className="font-bold text-slate-700">{activeRegister.openedBy}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Open ({registerDuration})
                  </span>
                </div>
              </div>

              {/* 4 Inner Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Opening Cash
                  </span>
                  <span className="text-base font-black text-slate-800 block">
                    {formatCurrency(activeRegister.openingBalance, settings)}
                  </span>
                </div>

                <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1 mb-1">
                    <ArrowUpRight size={13} /> Cash In
                  </span>
                  <span className="text-base font-black text-blue-700 block">
                    {formatCurrency(stats.totalIncome, settings)}
                  </span>
                </div>

                <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1 mb-1">
                    <ArrowDownRight size={13} /> Cash Out
                  </span>
                  <span className="text-base font-black text-rose-700 block">
                    {formatCurrency(stats.totalExpense, settings)}
                  </span>
                </div>

                <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1 mb-1">
                    <DollarSign size={13} /> Expected Cash
                  </span>
                  <span className="text-lg font-black text-emerald-700 block">
                    {formatCurrency(stats.expectedBalance, settings)}
                  </span>
                </div>
              </div>

              {activeRegister.notes && (
                <div className="mt-3 p-2.5 bg-amber-50/60 border border-amber-200/60 rounded-lg text-xs text-amber-800">
                  <span className="font-bold">Opening Note:</span> {activeRegister.notes}
                </div>
              )}
            </div>

            {/* Live Cash Movements Feed */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
              <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <History size={18} className="text-blue-600" />
                  <h3 className="font-extrabold text-sm md:text-base text-slate-800">
                    Live Cash Movements (This Session)
                  </h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    {cashMovements.length}
                  </span>
                </div>

                {/* Filter & Search */}
                <div className="flex items-center gap-2 print:hidden">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search movements..."
                      value={movementSearch}
                      onChange={e => setMovementSearch(e.target.value)}
                      className="pl-7 pr-3 py-1 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 w-36 sm:w-44"
                    />
                  </div>
                  <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-white text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setMovementFilter('all')}
                      className={cn(
                        "px-2 py-0.5 rounded",
                        movementFilter === 'all' ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setMovementFilter('in')}
                      className={cn(
                        "px-2 py-0.5 rounded",
                        movementFilter === 'in' ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      In
                    </button>
                    <button
                      type="button"
                      onClick={() => setMovementFilter('out')}
                      className={cn(
                        "px-2 py-0.5 rounded",
                        movementFilter === 'out' ? "bg-rose-600 text-white" : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      Out
                    </button>
                  </div>
                </div>
              </div>

              {/* Movements List */}
              <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
                {filteredMovements.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No cash transactions recorded during this session yet.
                  </div>
                ) : (
                  filteredMovements.map(m => (
                    <div key={m.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[10px] font-black uppercase px-2 py-0.5 rounded border tracking-wider",
                            m.direction === 'in'
                              ? "bg-blue-50 text-blue-700 border-blue-200/60"
                              : "bg-rose-50 text-rose-700 border-rose-200/60"
                          )}>
                            {m.type}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {new Date(m.time).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 truncate mt-1">
                          {m.description}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={cn(
                          "font-black text-sm tracking-tight block",
                          m.direction === 'in' ? "text-blue-600" : "text-rose-600"
                        )}>
                          {m.direction === 'in' ? '+' : '-'} {formatCurrency(m.amount, settings)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right 1 Col: Close Register & Reconciliation */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 md:p-6 sticky top-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-4">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Close Register</h3>
                <p className="text-xs text-slate-400">Reconcile cash & end shift</p>
              </div>
            </div>

            <form onSubmit={handleCloseRegister} className="space-y-4">
              {/* Expected preview */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Expected Cash</span>
                  <span className="text-xs text-slate-500 font-medium">From transactions</span>
                </div>
                <span className="text-base font-black text-slate-800">
                  {formatCurrency(stats.expectedBalance, settings)}
                </span>
              </div>

              {/* Denomination toggle for closing */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">Cash Count Mode:</span>
                <button
                  type="button"
                  onClick={() => setUseCloseDenomination(!useCloseDenomination)}
                  className="font-bold text-blue-600 hover:text-blue-700 text-[11px] underline"
                >
                  {useCloseDenomination ? 'Direct Amount' : 'Use Note Counter'}
                </button>
              </div>

              {useCloseDenomination ? (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {BANGLADESH_DENOMINATIONS.map(d => (
                      <div key={d.value} className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">{d.label}</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={closeDenomCounts[d.value] || ''}
                          onChange={e => handleCloseDenomChange(d.value, parseInt(e.target.value) || 0)}
                          className="w-14 px-1.5 py-0.5 text-right font-bold border border-slate-200 rounded text-xs"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 flex justify-between items-center text-xs font-black text-slate-800 border-t border-slate-200">
                    <span>Counted:</span>
                    <span className="text-blue-600">{formatCurrency(computeDenomTotal(closeDenomCounts), settings)}</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Actual Cash Counted
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={closingBalance}
                      onChange={e => setClosingBalance(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-base font-black text-slate-800 shadow-xs"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              {/* Real-time Discrepancy Preview */}
              {closingBalance !== '' && (
                (() => {
                  const actual = Number(closingBalance);
                  const diff = actual - stats.expectedBalance;
                  const isMatch = Math.abs(diff) < 0.01;
                  const isOver = diff > 0;

                  return (
                    <div className={cn(
                      "p-3 rounded-xl text-xs font-bold border transition-all space-y-1",
                      isMatch
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : isOver
                        ? "bg-blue-50 text-blue-800 border-blue-200"
                        : "bg-rose-50 text-rose-800 border-rose-200"
                    )}>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          {isMatch ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                          {isMatch ? 'Balanced (সঠিক মিল)' : isOver ? 'Surplus / বাড়তি ক্যাশ' : 'Shortage / ক্যাশ ঘাটতি'}
                        </span>
                        <span className="text-sm font-black">
                          {isMatch ? '0.00' : (isOver ? `+${formatCurrency(diff, settings)}` : formatCurrency(diff, settings))}
                        </span>
                      </div>
                      {!isMatch && (
                        <p className="text-[10px] font-medium opacity-85">
                          {isOver
                            ? 'Physical cash is higher than recorded sales/receipts.'
                            : 'Physical cash is lower than recorded drawer expectations.'}
                        </p>
                      )}
                    </div>
                  );
                })()
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Closing Remarks / Reason (Optional)
                </label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={e => setClosingNotes(e.target.value)}
                  placeholder="Explain any difference or drawer handover details..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-black text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Lock size={15} /> Close & Reconcile Register
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Register History Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-base md:text-lg font-black text-slate-800 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              Register Session History
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Past closed cash drawer records and audit logs
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search history by cashier or date..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                className="w-56 md:w-64 pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium transition-all"
              />
              {historySearch && (
                <button
                  onClick={() => setHistorySearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase font-bold tracking-wider border-b border-slate-200/70">
              <tr>
                <th className="px-5 py-3.5">Opened</th>
                <th className="px-5 py-3.5">Closed</th>
                <th className="px-5 py-3.5">Cashier / User</th>
                <th className="px-5 py-3.5 text-right">Opening</th>
                <th className="px-5 py-3.5 text-right">Expected</th>
                <th className="px-5 py-3.5 text-right">Actual</th>
                <th className="px-5 py-3.5 text-center">Discrepancy</th>
                <th className="px-5 py-3.5 text-center print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No closed cash registers found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredHistory.map(r => {
                  const discrepancy = r.discrepancy || 0;
                  const isMatch = Math.abs(discrepancy) < 0.01;
                  const isOver = discrepancy > 0;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-5 py-4 whitespace-nowrap font-medium text-slate-700">
                        {new Date(r.openedAt).toLocaleDateString()}
                        <span className="block text-[11px] text-slate-400">{new Date(r.openedAt).toLocaleTimeString()}</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                        {r.closedAt ? (
                          <>
                            {new Date(r.closedAt).toLocaleDateString()}
                            <span className="block text-[11px] text-slate-400">{new Date(r.closedAt).toLocaleTimeString()}</span>
                          </>
                        ) : '-'}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-800 block">{r.openedBy}</span>
                        {r.closedBy && r.closedBy !== r.openedBy && (
                          <span className="text-[10px] text-slate-400 block">Closed by: {r.closedBy}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-slate-700">
                        {formatCurrency(r.openingBalance, settings)}
                      </td>
                      <td className="px-5 py-4 text-right text-slate-500 font-medium">
                        {formatCurrency(r.expectedBalance || 0, settings)}
                      </td>
                      <td className="px-5 py-4 text-right font-black text-slate-800">
                        {formatCurrency(r.closingBalance || 0, settings)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[11px] font-black inline-flex items-center gap-1 border",
                          isMatch
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : isOver
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        )}>
                          {isMatch ? '✓ Balanced' : (isOver ? `+${formatCurrency(discrepancy, settings)}` : formatCurrency(discrepancy, settings))}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center print:hidden">
                        <button
                          type="button"
                          onClick={() => setSelectedSessionForZReport(r)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors"
                          title="View Z-Report Summary"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Quick Cash In / Petty Cash Out Adjustment */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                {adjustType === 'in' ? (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Plus size={16} />
                    </div>
                    Add Cash Float (Deposit In)
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                      <Minus size={16} />
                    </div>
                    Petty Cash Out (Withdrawal)
                  </>
                )}
              </h3>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={adjustAmount}
                    onChange={e => setAdjustAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-base font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Reason / Purpose
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder={adjustType === 'in' ? 'e.g. Added change float from bank...' : 'e.g. Office tea, courier delivery charge...'}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all flex items-center gap-1.5",
                    adjustType === 'in' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700",
                    adjusting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {adjusting ? 'Saving...' : 'Record Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Professional Z-Report / Closing Slip View */}
      {selectedSessionForZReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                Register Z-Report (Session Slip)
              </h3>
              <button
                onClick={() => setSelectedSessionForZReport(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 text-xs space-y-3 font-mono">
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <p className="font-extrabold text-sm uppercase text-slate-800">{settings?.storeName || 'Cash Register Summary'}</p>
                <p className="text-[10px] text-slate-400">Day Book Audit Slip</p>
              </div>

              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Session ID:</span>
                  <span className="font-bold text-slate-800">{selectedSessionForZReport.id?.substring(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span>Opened By:</span>
                  <span className="font-bold text-slate-800">{selectedSessionForZReport.openedBy}</span>
                </div>
                <div className="flex justify-between">
                  <span>Opened At:</span>
                  <span>{new Date(selectedSessionForZReport.openedAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Closed By:</span>
                  <span className="font-bold text-slate-800">{selectedSessionForZReport.closedBy || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Closed At:</span>
                  <span>{selectedSessionForZReport.closedAt ? new Date(selectedSessionForZReport.closedAt).toLocaleString() : '-'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-dashed border-slate-300 space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span>Opening Cash:</span>
                  <span className="font-bold">{formatCurrency(selectedSessionForZReport.openingBalance, settings)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expected In Drawer:</span>
                  <span className="font-bold">{formatCurrency(selectedSessionForZReport.expectedBalance || 0, settings)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Actual Counted:</span>
                  <span className="font-black text-slate-900">{formatCurrency(selectedSessionForZReport.closingBalance || 0, settings)}</span>
                </div>
                <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-200">
                  <span>Discrepancy:</span>
                  <span className={cn(
                    (selectedSessionForZReport.discrepancy || 0) === 0 ? "text-emerald-600" :
                    (selectedSessionForZReport.discrepancy || 0) > 0 ? "text-blue-600" : "text-rose-600"
                  )}>
                    {formatCurrency(selectedSessionForZReport.discrepancy || 0, settings)}
                  </span>
                </div>
              </div>

              {selectedSessionForZReport.notes && (
                <div className="pt-2 border-t border-dashed border-slate-300 text-[11px] text-slate-500">
                  <span className="font-bold">Remarks:</span> {selectedSessionForZReport.notes}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Printer size={14} /> Print Z-Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
