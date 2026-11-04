import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { PaymentAccount, Customer, Vendor, Transaction, Order } from '../../../../types';
import { formatCurrency, cn } from '../../../../lib/utils';
import { toast } from 'react-hot-toast';
import { useSettings } from '../../../../context/SettingsContext';
import {
  CreditCard,
  Building2,
  Users,
  Calendar,
  RefreshCw,
  Wallet,
  Search,
  Scale,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  Printer,
  X,
  Phone,
  Landmark,
  ArrowUpDown,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface AccountBalanceProps {
  setSelectedLedgerEntity?: (v: any) => void;
  setActiveTab?: (tab: string) => void;
}

const AccountBalanceTab: React.FC<AccountBalanceProps> = ({ setSelectedLedgerEntity, setActiveTab }) => {
  const { settings } = useSettings();
  const [asOfDate, setAsOfDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState<boolean>(true);

  // Raw data from Firestore
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Search & filter states for the 3 columns
  const [accountSearch, setAccountSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState<'all' | 'positive' | 'negative'>('all');

  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSortBy, setCustomerSortBy] = useState<'amount_desc' | 'name_asc'>('amount_desc');

  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorSortBy, setVendorSortBy] = useState<'amount_desc' | 'name_asc'>('amount_desc');

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const [accSnap, custSnap, vendSnap, txSnap, ordSnap] = await Promise.all([
        getDocs(query(collection(db, 'payment_accounts'), orderBy('name'))),
        getDocs(query(collection(db, 'customers'), orderBy('name'))),
        getDocs(query(collection(db, 'vendors'), orderBy('name'))),
        getDocs(query(collection(db, 'transactions'), orderBy('date', 'asc'))),
        getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'asc'))),
      ]);

      setPaymentAccounts(accSnap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentAccount)));
      setCustomers(custSnap.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));
      setVendors(vendSnap.docs.map(d => ({ id: d.id, ...d.data() } as Vendor)));
      setTransactions(txSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
      setOrders(ordSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    } catch (err) {
      console.error('Failed to load account balances:', err);
      toast.error('Failed to load account balances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  // Filter transactions and orders up to asOfDate safely
  const validTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = tx.date ? tx.date.split('T')[0] : (tx.createdAt ? tx.createdAt.split('T')[0] : '');
      return !txDate || txDate <= asOfDate;
    });
  }, [transactions, asOfDate]);

  // Compute Cash & Bank Account Balances
  const calculatedAccounts = useMemo(() => {
    return paymentAccounts.map(acc => {
      const opening = Number(acc.openingBalance || 0);
      const accTx = validTransactions.filter(tx => tx.paymentAccountId === acc.id);
      const inflow = accTx
        .filter(tx => ['sale', 'payment_received', 'money_receipt', 'income', 'purchase_return', 'deposit', 'transfer_in'].includes(tx.type))
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const outflow = accTx
        .filter(tx => ['purchase', 'payment_made', 'expense', 'salary', 'conveyance', 'sale_return', 'withdrawal', 'transfer_out'].includes(tx.type))
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);
      return { ...acc, currentBalance: opening + inflow - outflow };
    });
  }, [paymentAccounts, validTransactions]);

  // Compute Customer Receivables
  const calculatedCustomers = useMemo(() => {
    return customers
      .map(c => {
        const cTx = validTransactions.filter(tx => {
          if (tx.entityId && tx.entityId === c.id) return true;
          if (tx.entityName && c.name && tx.entityName.trim().toLowerCase() === c.name.trim().toLowerCase()) return true;
          return false;
        });
        const debits = cTx
          .filter(tx => ['sale', 'opening_balance'].includes(tx.type))
          .reduce((sum, tx) => sum + (tx.amount || 0), 0);
        const credits = cTx
          .filter(tx => ['payment_received', 'money_receipt'].includes(tx.type) || (['sale_return', 'return'].includes(tx.type) && (tx.paymentMethod === 'store_credit' || !tx.paymentMethod || tx.paymentMethod === 'credit')))
          .reduce((sum, tx) => sum + (tx.amount || 0), 0);
        return { ...c, currentBalance: Math.max(0, debits - credits) };
      })
      .filter(c => c.currentBalance > 0);
  }, [customers, validTransactions]);

  // Compute Vendor Payables
  const calculatedVendors = useMemo(() => {
    return vendors
      .map(v => {
        const vTx = validTransactions.filter(tx => {
          if (tx.entityId && tx.entityId === v.id) return true;
          if (tx.entityName && v.name && tx.entityName.trim().toLowerCase() === v.name.trim().toLowerCase()) return true;
          return false;
        });
        const credits = vTx
          .filter(tx => ['purchase', 'opening_balance'].includes(tx.type))
          .reduce((sum, tx) => sum + (tx.amount || 0), 0);
        const debits = vTx
          .filter(tx => ['payment_made'].includes(tx.type) || (['purchase_return', 'return'].includes(tx.type) && (tx.paymentMethod === 'supplier_credit' || !tx.paymentMethod || tx.paymentMethod === 'credit')))
          .reduce((sum, tx) => sum + (tx.amount || 0), 0);
        return { ...v, currentBalance: Math.max(0, credits - debits) };
      })
      .filter(v => v.currentBalance > 0);
  }, [vendors, validTransactions]);

  // Overall Totals
  const totalLiquid = useMemo(() => {
    return calculatedAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
  }, [calculatedAccounts]);

  const totalReceivables = useMemo(() => {
    return calculatedCustomers.reduce((sum, c) => sum + c.currentBalance, 0);
  }, [calculatedCustomers]);

  const totalPayables = useMemo(() => {
    return calculatedVendors.reduce((sum, v) => sum + v.currentBalance, 0);
  }, [calculatedVendors]);

  const netFinancialPosition = useMemo(() => {
    return totalLiquid + totalReceivables - totalPayables;
  }, [totalLiquid, totalReceivables, totalPayables]);

  // Filtered views
  const filteredAccounts = useMemo(() => {
    return calculatedAccounts
      .filter(acc => {
        if (accountFilter === 'positive' && acc.currentBalance <= 0) return false;
        if (accountFilter === 'negative' && acc.currentBalance >= 0) return false;
        if (!accountSearch.trim()) return true;
        const q = accountSearch.toLowerCase();
        return (
          acc.name?.toLowerCase().includes(q) ||
          acc.type?.toLowerCase().includes(q) ||
          acc.description?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.currentBalance - a.currentBalance);
  }, [calculatedAccounts, accountSearch, accountFilter]);

  const filteredCustomers = useMemo(() => {
    return calculatedCustomers
      .filter(c => {
        if (!customerSearch.trim()) return true;
        const q = customerSearch.toLowerCase();
        return (
          c.name?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          (c.address && c.address.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (customerSortBy === 'name_asc') {
          return (a.name || '').localeCompare(b.name || '');
        }
        return b.currentBalance - a.currentBalance;
      });
  }, [calculatedCustomers, customerSearch, customerSortBy]);

  const filteredVendors = useMemo(() => {
    return calculatedVendors
      .filter(v => {
        if (!vendorSearch.trim()) return true;
        const q = vendorSearch.toLowerCase();
        return (
          v.name?.toLowerCase().includes(q) ||
          v.phone?.toLowerCase().includes(q) ||
          v.category?.toLowerCase().includes(q) ||
          (v.address && v.address.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (vendorSortBy === 'name_asc') {
          return (a.name || '').localeCompare(b.name || '');
        }
        return b.currentBalance - a.currentBalance;
      });
  }, [calculatedVendors, vendorSearch, vendorSortBy]);

  // Quick date presets
  const handleSetQuickDate = (type: 'today' | 'yesterday' | 'month_end') => {
    const today = new Date();
    if (type === 'today') {
      setAsOfDate(today.toISOString().split('T')[0]);
    } else if (type === 'yesterday') {
      const y = new Date(today);
      y.setDate(today.getDate() - 1);
      setAsOfDate(y.toISOString().split('T')[0]);
    } else if (type === 'month_end') {
      // Last day of current month
      const y = today.getFullYear();
      const m = today.getMonth();
      const lastDay = new Date(y, m + 1, 0);
      setAsOfDate(lastDay.toISOString().split('T')[0]);
    }
  };

  const getAccountTypeBadge = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('bkash')) {
      return { label: 'bKash', bg: 'bg-pink-50 text-pink-700 border-pink-200' };
    }
    if (t.includes('nagad')) {
      return { label: 'Nagad', bg: 'bg-orange-50 text-orange-700 border-orange-200' };
    }
    if (t.includes('rocket')) {
      return { label: 'Rocket', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
    if (t.includes('bank')) {
      return { label: 'Bank', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (t.includes('cash')) {
      return { label: 'Cash', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    return { label: type || 'Account', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  return (
    <div className="space-y-6 print:space-y-4 print:p-0">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-6 transition-all hover:shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  Account Balances
                  <span className="hidden sm:inline-flex items-center text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                    Real-time Balance Sheet
                  </span>
                </h2>
                <p className="text-xs md:text-sm text-slate-500 font-medium">
                  Financial position overview of cash, bank assets, customer dues, and supplier payables
                </p>
              </div>
            </div>
          </div>

          {/* Controls: Quick Dates, Date Picker, Print & Refresh */}
          <div className="flex flex-wrap items-center gap-2.5 print:hidden">
            {/* Quick date buttons */}
            <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleSetQuickDate('today')}
                className="px-2.5 py-1.5 rounded-lg hover:bg-white hover:text-blue-600 text-slate-600 transition-all"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDate('yesterday')}
                className="px-2.5 py-1.5 rounded-lg hover:bg-white hover:text-blue-600 text-slate-600 transition-all"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDate('month_end')}
                className="px-2.5 py-1.5 rounded-lg hover:bg-white hover:text-blue-600 text-slate-600 transition-all"
              >
                Month End
              </button>
            </div>

            {/* As of Date picker */}
            <div className="flex items-center gap-2 bg-slate-50 hover:bg-white px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
              <Calendar size={16} className="text-blue-600" />
              <span className="text-xs text-slate-400 font-normal uppercase tracking-wider">As of:</span>
              <input
                type="date"
                value={asOfDate}
                onChange={e => setAsOfDate(e.target.value)}
                className="border-none outline-none text-xs md:text-sm font-semibold text-slate-800 bg-transparent cursor-pointer"
              />
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={() => window.print()}
              title="Print Account Balances Report"
              className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-50 shadow-sm transition-all"
            >
              <Printer size={18} />
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchFinancialData}
              disabled={loading}
              title="Reload Financial Data"
              className="p-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-white shadow-sm shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              <RefreshCw size={18} className={cn(loading && "animate-spin")} />
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {/* Card 1: Liquid Cash & Bank Assets */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Liquid Assets</span>
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              totalLiquid >= 0 ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
            )}>
              <Landmark size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className={cn(
              "text-2xl font-black tracking-tight",
              totalLiquid >= 0 ? "text-slate-900" : "text-rose-600"
            )}>
              {formatCurrency(totalLiquid, settings)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500">{calculatedAccounts.length} Cash & Bank Accounts</span>
              {totalLiquid < 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  <AlertTriangle size={11} /> Overdrawn
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={11} /> Healthy
                </span>
              )}
            </div>
          </div>
          <div className={cn("absolute bottom-0 left-0 right-0 h-1", totalLiquid >= 0 ? "bg-blue-500" : "bg-rose-500")} />
        </div>

        {/* Card 2: Accounts Receivable (Customer Due) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Accounts Receivable (Due)</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-emerald-600">
              {formatCurrency(totalReceivables, settings)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500">{calculatedCustomers.length} Customers with dues</span>
              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Pawnar Asheet
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

        {/* Card 3: Accounts Payable (Vendor Due) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Accounts Payable (Due)</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-rose-600">
              {formatCurrency(totalPayables, settings)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500">{calculatedVendors.length} Suppliers / Vendors</span>
              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                Denar Liability
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
        </div>

        {/* Card 4: Net Financial Position / Working Capital */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Financial Position</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Scale size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className={cn(
              "text-2xl font-black tracking-tight",
              netFinancialPosition >= 0 ? "text-indigo-700" : "text-amber-700"
            )}>
              {formatCurrency(netFinancialPosition, settings)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500 text-[11px]">Liquid + Due - Payable</span>
              <span className={cn(
                "inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border",
                netFinancialPosition >= 0
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              )}>
                {netFinancialPosition >= 0 ? 'Surplus (উদ্বৃত্ত)' : 'Deficit (ঘাটতি)'}
              </span>
            </div>
          </div>
          <div className={cn("absolute bottom-0 left-0 right-0 h-1", netFinancialPosition >= 0 ? "bg-indigo-500" : "bg-amber-500")} />
        </div>
      </div>

      {/* Main 3 Columns Layout */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 bg-white rounded-2xl border border-slate-200 shadow-sm gap-3">
          <RefreshCw className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-500">Calculating account balances and dues...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* COLUMN 1: Cash & Bank Accounts */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden flex flex-col transition-all hover:shadow-md">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-50/70 to-indigo-50/30 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Cash & Bank Accounts</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Liquid payment methods</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100/80 text-blue-800 border border-blue-200/60">
                {calculatedAccounts.length} Accounts
              </span>
            </div>

            {/* Filter & Search inside Column */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/50 space-y-2 print:hidden">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter accounts by name or type..."
                  value={accountSearch}
                  onChange={e => setAccountSearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium transition-all"
                />
                {accountSearch && (
                  <button
                    onClick={() => setAccountSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setAccountFilter('all')}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all",
                    accountFilter === 'all' ? "bg-blue-600 text-white shadow-xs" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  All ({calculatedAccounts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAccountFilter('positive')}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all",
                    accountFilter === 'positive' ? "bg-emerald-600 text-white shadow-xs" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  Positive
                </button>
                <button
                  type="button"
                  onClick={() => setAccountFilter('negative')}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all",
                    accountFilter === 'negative' ? "bg-rose-600 text-white shadow-xs" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  Overdrawn
                </button>
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[500px] print:max-h-none print:overflow-visible">
              {filteredAccounts.length === 0 ? (
                <div className="p-8 text-center">
                  <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 font-medium text-xs">No matching accounts found</p>
                </div>
              ) : (
                filteredAccounts.map(acc => {
                  const badge = getAccountTypeBadge(acc.type);
                  const isNegative = acc.currentBalance < 0;
                  const isZero = acc.currentBalance === 0;

                  return (
                    <div
                      key={acc.id}
                      onClick={() => {
                        if (setActiveTab) {
                          setActiveTab('payment_accounts');
                        }
                      }}
                      className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-all group cursor-pointer"
                      title="Click to view Payment Accounts management"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                            {acc.name}
                          </p>
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider shrink-0", badge.bg)}>
                            {badge.label}
                          </span>
                        </div>
                        {acc.description && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{acc.description}</p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className={cn(
                          "font-black text-sm tracking-tight block",
                          isNegative ? "text-rose-600" : isZero ? "text-slate-500" : "text-slate-900"
                        )}>
                          {formatCurrency(acc.currentBalance, settings)}
                        </span>
                        {isNegative && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60 mt-0.5">
                            <AlertTriangle size={9} /> Overdrawn
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Column Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <div>
                <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500 block">Total Liquid Assets</span>
                <span className="text-[11px] text-slate-400 font-medium">Net in all accounts</span>
              </div>
              <div className="text-right">
                <span className={cn(
                  "font-black text-base md:text-lg block tracking-tight",
                  totalLiquid >= 0 ? "text-blue-700" : "text-rose-600"
                )}>
                  {formatCurrency(totalLiquid, settings)}
                </span>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Accounts Receivable (Customer Due) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden flex flex-col transition-all hover:shadow-md">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-emerald-50/70 to-teal-50/30 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Accounts Receivable</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Customer pending dues</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-200/60">
                {calculatedCustomers.length} Customers
              </span>
            </div>

            {/* Filter & Search inside Column */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/50 space-y-2 print:hidden">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer by name or phone..."
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 font-medium transition-all"
                />
                {customerSearch && (
                  <button
                    onClick={() => setCustomerSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                <span className="text-slate-400">Showing {filteredCustomers.length} of {calculatedCustomers.length}</span>
                <button
                  type="button"
                  onClick={() => setCustomerSortBy(prev => prev === 'amount_desc' ? 'name_asc' : 'amount_desc')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-700 bg-white px-2 py-0.5 rounded border border-slate-200"
                >
                  <ArrowUpDown size={11} /> {customerSortBy === 'amount_desc' ? 'Sort: Due Amount' : 'Sort: Name'}
                </button>
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[500px] print:max-h-none print:overflow-visible">
              {filteredCustomers.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 font-medium text-xs">No customer dues found</p>
                </div>
              ) : (
                filteredCustomers.map(c => {
                  const initial = (c.name || 'C').charAt(0).toUpperCase();

                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        if (setSelectedLedgerEntity && setActiveTab) {
                          setSelectedLedgerEntity({ id: c.id, name: c.name, type: 'customer' });
                          setActiveTab('ledger');
                        }
                      }}
                      className="p-3.5 flex items-center justify-between hover:bg-emerald-50/40 transition-all cursor-pointer group"
                      title="Click to view Customer Statement in Ledger"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
                            {c.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mt-0.5">
                            {c.phone ? (
                              <span className="flex items-center gap-1">
                                <Phone size={11} className="text-slate-300" /> {c.phone}
                              </span>
                            ) : (
                              <span>No phone</span>
                            )}
                            {c.branchName && (
                              <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                                {c.branchName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <span className="font-black text-sm text-rose-600 block tracking-tight">
                            {formatCurrency(c.currentBalance, settings)}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50 block text-center mt-0.5">
                            Due
                          </span>
                        </div>
                        <div className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all print:hidden">
                          <ArrowRight size={15} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Column Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <div>
                <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500 block">Total Receivables</span>
                <span className="text-[11px] text-slate-400 font-medium">Outstanding from customers</span>
              </div>
              <div className="text-right">
                <span className="font-black text-base md:text-lg text-emerald-700 block tracking-tight">
                  {formatCurrency(totalReceivables, settings)}
                </span>
              </div>
            </div>
          </div>

          {/* COLUMN 3: Accounts Payable (Vendor Due) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden flex flex-col transition-all hover:shadow-md">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-rose-50/70 to-pink-50/30 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-sm">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Accounts Payable</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Vendor & supplier bills</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100/80 text-rose-800 border border-rose-200/60">
                {calculatedVendors.length} Vendors
              </span>
            </div>

            {/* Filter & Search inside Column */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/50 space-y-2 print:hidden">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search vendor by name or phone..."
                  value={vendorSearch}
                  onChange={e => setVendorSearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-700 font-medium transition-all"
                />
                {vendorSearch && (
                  <button
                    onClick={() => setVendorSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                <span className="text-slate-400">Showing {filteredVendors.length} of {calculatedVendors.length}</span>
                <button
                  type="button"
                  onClick={() => setVendorSortBy(prev => prev === 'amount_desc' ? 'name_asc' : 'amount_desc')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-rose-700 bg-white px-2 py-0.5 rounded border border-slate-200"
                >
                  <ArrowUpDown size={11} /> {vendorSortBy === 'amount_desc' ? 'Sort: Payable Amount' : 'Sort: Name'}
                </button>
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[500px] print:max-h-none print:overflow-visible">
              {filteredVendors.length === 0 ? (
                <div className="p-8 text-center">
                  <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 font-medium text-xs">No vendor payables found</p>
                </div>
              ) : (
                filteredVendors.map(v => {
                  const initial = (v.name || 'V').charAt(0).toUpperCase();

                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        if (setSelectedLedgerEntity && setActiveTab) {
                          setSelectedLedgerEntity({ id: v.id, name: v.name, type: 'vendor' });
                          setActiveTab('ledger');
                        }
                      }}
                      className="p-3.5 flex items-center justify-between hover:bg-rose-50/40 transition-all cursor-pointer group"
                      title="Click to view Vendor Statement in Ledger"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-3">
                        <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center shrink-0">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-800 truncate group-hover:text-rose-700 transition-colors">
                            {v.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mt-0.5">
                            {v.phone ? (
                              <span className="flex items-center gap-1">
                                <Phone size={11} className="text-slate-300" /> {v.phone}
                              </span>
                            ) : (
                              <span>No phone</span>
                            )}
                            {v.category && (
                              <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                                {v.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <span className="font-black text-sm text-rose-600 block tracking-tight">
                            {formatCurrency(v.currentBalance, settings)}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/50 block text-center mt-0.5">
                            Payable
                          </span>
                        </div>
                        <div className="text-slate-300 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all print:hidden">
                          <ArrowRight size={15} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Column Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <div>
                <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500 block">Total Payables</span>
                <span className="text-[11px] text-slate-400 font-medium">Owed to suppliers</span>
              </div>
              <div className="text-right">
                <span className="font-black text-base md:text-lg text-rose-700 block tracking-tight">
                  {formatCurrency(totalPayables, settings)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountBalanceTab;
