import React, { useState, useMemo } from 'react';
import { Transaction, Customer, Vendor, Order, SiteSettings } from '../../../../types';
import { formatCurrency, cn } from '../../../../lib/utils';
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Download,
  Printer,
  Calendar,
  Filter,
  Users,
  Truck,
  Wallet,
  Building2,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  Phone,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { Pagination } from '../../../../components/common/Pagination';

interface DailyCollectionPayoutReportProps {
  transactions: Transaction[];
  customers: Customer[];
  vendors: Vendor[];
  orders?: Order[];
  paymentAccounts: any[];
  settings: SiteSettings;
  hasPermission?: (permission: string) => boolean;
  setActiveTab?: (tab: string) => void;
}

export const DailyCollectionPayoutReport: React.FC<DailyCollectionPayoutReportProps> = ({
  transactions = [],
  customers = [],
  vendors = [],
  paymentAccounts = [],
  settings,
  setActiveTab,
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [activeViewTab, setActiveViewTab] = useState<'all' | 'collection' | 'payout'>('all');
  const [settlementFilter, setSettlementFilter] = useState<'all' | 'due_only' | 'spot_only'>('all');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);

  // Quick Date Selectors
  const handleSetQuickDate = (mode: 'today' | 'yesterday' | 'this_week' | 'this_month') => {
    const now = new Date();
    if (mode === 'today') {
      const d = now.toISOString().split('T')[0];
      setStartDate(d);
      setEndDate(d);
    } else if (mode === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const d = y.toISOString().split('T')[0];
      setStartDate(d);
      setEndDate(d);
    } else if (mode === 'this_week') {
      const first = new Date(now);
      first.setDate(first.getDate() - 7);
      setStartDate(first.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (mode === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(now.toISOString().split('T')[0]);
    }
    setCurrentPage(1);
  };

  // Process transactions into unified Daily Due Collection & Supplier Payout records
  const processedRecords = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      timeStr: string;
      dateStr: string;
      direction: 'in' | 'out'; // in = Customer collection, out = Supplier payout
      flowType: 'customer_due' | 'supplier_payout';
      partyType: 'customer' | 'vendor';
      partyName: string;
      partyPhone: string;
      partyId: string;
      amount: number;
      accountName: string;
      paymentMethod: string;
      referenceId: string;
      documentNumber: string;
      description: string;
      isDueSettlement: boolean;
    }> = [];

    transactions.forEach(tx => {
      const rawDate = tx.date || tx.createdAt || '';
      if (!rawDate) return;
      const datePart = rawDate.split('T')[0];
      if (datePart < startDate || datePart > endDate) return;

      const desc = tx.description || '';
      const descLower = desc.toLowerCase();
      const entityType = (tx.entityType || '').toLowerCase();
      const txType = (tx.type || '').toLowerCase();

      // Resolve Account Name
      const matchedAcc = paymentAccounts.find(a => a.id === tx.paymentAccountId);
      const accountName = matchedAcc?.name || tx.paymentMethod || 'Cash Counter';

      // 1. CUSTOMER DUE COLLECTION (Money received / Money receipts / Inflows from customer)
      const isCustomerPayment =
        txType === 'payment_received' ||
        txType === 'money_receipt' ||
        (txType === 'payment' && entityType === 'customer') ||
        (entityType === 'customer' && (descLower.includes('due') || descLower.includes('receipt') || descLower.includes('collection')));

      // 2. SUPPLIER / VENDOR PAYOUT (Payments made to suppliers / vendors)
      const isSupplierPayment =
        txType === 'payment_made' ||
        (txType === 'payment' && entityType === 'vendor') ||
        (entityType === 'vendor' && (descLower.includes('paid') || descLower.includes('payment') || descLower.includes('vendor')));

      if (!isCustomerPayment && !isSupplierPayment) {
        return;
      }

      const isDueSettlement =
        descLower.includes('due') ||
        descLower.includes('settle') ||
        descLower.includes('receipt') ||
        txType === 'money_receipt';

      let timeFormatted = '';
      try {
        const dObj = new Date(rawDate);
        timeFormatted = dObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch {
        timeFormatted = '';
      }

      if (isCustomerPayment) {
        const customer = customers.find(c => c.id === tx.entityId || c.name.toLowerCase() === (tx.entityName || '').toLowerCase());
        list.push({
          id: tx.id,
          date: rawDate,
          timeStr: timeFormatted,
          dateStr: datePart,
          direction: 'in',
          flowType: 'customer_due',
          partyType: 'customer',
          partyName: tx.entityName || customer?.name || 'Walk-in / Cash Customer',
          partyPhone: customer?.phone || '',
          partyId: tx.entityId || customer?.id || '',
          amount: Number(tx.amount) || 0,
          accountName,
          paymentMethod: tx.paymentMethod || matchedAcc?.type || 'cash',
          referenceId: tx.referenceId || '',
          documentNumber: tx.documentNumber || tx.referenceId || '',
          description: desc || 'Customer Due Collection / Money Receipt',
          isDueSettlement,
        });
      } else if (isSupplierPayment) {
        const vendor = vendors.find(v => v.id === tx.entityId || v.name.toLowerCase() === (tx.entityName || '').toLowerCase());
        list.push({
          id: tx.id,
          date: rawDate,
          timeStr: timeFormatted,
          dateStr: datePart,
          direction: 'out',
          flowType: 'supplier_payout',
          partyType: 'vendor',
          partyName: tx.entityName || vendor?.name || 'Supplier / Vendor',
          partyPhone: vendor?.phone || '',
          partyId: tx.entityId || vendor?.id || '',
          amount: Number(tx.amount) || 0,
          accountName,
          paymentMethod: tx.paymentMethod || matchedAcc?.type || 'cash',
          referenceId: tx.referenceId || '',
          documentNumber: tx.documentNumber || tx.referenceId || '',
          description: desc || 'Paid Supplier / Vendor Due',
          isDueSettlement,
        });
      }
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, customers, vendors, paymentAccounts, startDate, endDate]);

  // Filter by Account, Settlement type, Tab view and Search text
  const filteredRecords = useMemo(() => {
    return processedRecords.filter(item => {
      // Tab filter
      if (activeViewTab === 'collection' && item.direction !== 'in') return false;
      if (activeViewTab === 'payout' && item.direction !== 'out') return false;

      // Settlement filter
      if (settlementFilter === 'due_only' && !item.isDueSettlement) return false;
      if (settlementFilter === 'spot_only' && item.isDueSettlement) return false;

      // Account filter
      if (selectedAccountId !== 'all') {
        const matched = paymentAccounts.find(a => a.id === selectedAccountId);
        const accTarget = (matched?.name || '').toLowerCase();
        if (item.accountName.toLowerCase() !== accTarget && item.paymentMethod.toLowerCase() !== accTarget) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.partyName.toLowerCase().includes(q);
        const matchesPhone = item.partyPhone.toLowerCase().includes(q);
        const matchesDoc = item.documentNumber.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesAccount = item.accountName.toLowerCase().includes(q);
        const matchesAmount = item.amount.toString().includes(q);
        if (!matchesName && !matchesPhone && !matchesDoc && !matchesDesc && !matchesAccount && !matchesAmount) {
          return false;
        }
      }

      return true;
    });
  }, [processedRecords, activeViewTab, settlementFilter, selectedAccountId, searchQuery, paymentAccounts]);

  // Overall KPIs for the selected date range
  const summary = useMemo(() => {
    let totalCollected = 0;
    let countCollected = 0;
    let totalPayout = 0;
    let countPayout = 0;
    const accountSummary: Record<string, { in: number; out: number }> = {};

    processedRecords.forEach(r => {
      if (!accountSummary[r.accountName]) {
        accountSummary[r.accountName] = { in: 0, out: 0 };
      }
      if (r.direction === 'in') {
        totalCollected += r.amount;
        countCollected += 1;
        accountSummary[r.accountName].in += r.amount;
      } else {
        totalPayout += r.amount;
        countPayout += 1;
        accountSummary[r.accountName].out += r.amount;
      }
    });

    const netFlow = totalCollected - totalPayout;

    return {
      totalCollected,
      countCollected,
      totalPayout,
      countPayout,
      netFlow,
      accountSummary,
    };
  }, [processedRecords]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  // Print Daily Sheet handler
  const handlePrintDailySheet = () => {
    window.print();
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Date & Time',
      'Transaction Type',
      'Party Name (Customer/Supplier)',
      'Phone Number',
      'Account / Method',
      'Reference / Voucher #',
      'Remarks',
      'Collected Inflow (BDT)',
      'Paid Outflow (BDT)',
    ];

    const rows = filteredRecords.map(r => [
      `"${new Date(r.date).toLocaleString()}"`,
      `"${r.direction === 'in' ? 'Customer Due Collected' : 'Supplier Payout'}"`,
      `"${r.partyName.replace(/"/g, '""')}"`,
      `"${r.partyPhone}"`,
      `"${r.accountName.replace(/"/g, '""')}"`,
      `"${r.documentNumber || r.referenceId}"`,
      `"${r.description.replace(/"/g, '""')}"`,
      r.direction === 'in' ? r.amount : 0,
      r.direction === 'out' ? r.amount : 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daily_Due_Collection_And_Payout_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Print-Only Header Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #daily-sheet-printable, #daily-sheet-printable * {
            visibility: visible;
          }
          #daily-sheet-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Container */}
      <div id="daily-sheet-printable" className="space-y-6">
        {/* Printable Brand Header */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4 text-center">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wider">
            {settings?.brandName || 'Click2IT'}
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            {settings?.companyAddress || settings?.address || 'Dhaka, Bangladesh'} | Phone: {settings?.contactPhone || settings?.phone || ''}
          </p>
          <div className="mt-3 inline-block px-4 py-1 bg-slate-900 text-white rounded font-bold text-xs uppercase tracking-widest">
            Daily Due Collection & Supplier Payout Register
          </div>
          <p className="text-xs text-slate-700 font-bold mt-2">
            Statement Date: {startDate === endDate ? startDate : `${startDate} to ${endDate}`} | Generated: {new Date().toLocaleString()}
          </p>
        </div>

        {/* Top Header Card */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 md:p-6 no-print">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <ArrowLeftRight size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Daily Due Collection & Supplier Payout
                  </h2>
                  <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    দৈনিক বকেয়া আদায় ও দেনা পরিশোধ
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track day-wise customer dues collected and supplier payments made with account breakdown & audit sheet
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handlePrintDailySheet}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="Print clean A4 daily audit sheet"
              >
                <Printer size={14} />
                <span>Print Daily Sheet</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="Export filtered records to CSV"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Date Selector & Quick Range Presets */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Calendar size={14} /> Date Range:
              </span>
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-white focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
              />
              <span className="text-xs font-bold text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-white focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleSetQuickDate('today')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer',
                  startDate === todayStr && endDate === todayStr
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                )}
              >
                Today (আজ)
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDate('yesterday')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 cursor-pointer"
              >
                Yesterday (গতকাল)
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDate('this_week')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 cursor-pointer"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDate('this_month')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 cursor-pointer"
              >
                This Month (চলতি মাস)
              </button>
            </div>
          </div>
        </div>

        {/* Top 3 Metric KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Customer Due Inflow */}
          <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-xs bg-gradient-to-br from-white to-emerald-50/40 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Customer Due Collected (বকেয়া আদায়)
                </p>
                <h3 className="text-2xl font-black text-emerald-700 mt-1.5 tracking-tight">
                  {formatCurrency(summary.totalCollected, settings)}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <ArrowDownLeft size={20} />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-emerald-100/80 flex items-center justify-between text-xs font-bold text-emerald-800">
              <span>Receipts Recorded:</span>
              <span className="bg-emerald-200/80 px-2 py-0.5 rounded-md text-[11px]">
                {summary.countCollected} Collection(s)
              </span>
            </div>
          </div>

          {/* Card 2: Supplier Payout Outflow */}
          <div className="bg-white rounded-2xl p-5 border border-rose-200 shadow-xs bg-gradient-to-br from-white to-rose-50/40 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Supplier Due Paid (সাপ্লায়ার পরিশোধ)
                </p>
                <h3 className="text-2xl font-black text-rose-700 mt-1.5 tracking-tight">
                  {formatCurrency(summary.totalPayout, settings)}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <ArrowUpRight size={20} />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-rose-100/80 flex items-center justify-between text-xs font-bold text-rose-800">
              <span>Vouchers Paid:</span>
              <span className="bg-rose-200/80 px-2 py-0.5 rounded-md text-[11px]">
                {summary.countPayout} Payment(s)
              </span>
            </div>
          </div>

          {/* Card 3: Net Daily Recovery / Cash Flow */}
          <div
            className={cn(
              'bg-white rounded-2xl p-5 border shadow-xs relative overflow-hidden',
              summary.netFlow >= 0
                ? 'border-blue-200 bg-gradient-to-br from-white to-blue-50/40'
                : 'border-amber-200 bg-gradient-to-br from-white to-amber-50/40'
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <p
                  className={cn(
                    'text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5',
                    summary.netFlow >= 0 ? 'text-blue-800' : 'text-amber-800'
                  )}
                >
                  <Wallet size={13} />
                  Net Daily Recovery (দিনের নিট পজিশন)
                </p>
                <h3
                  className={cn(
                    'text-2xl font-black mt-1.5 tracking-tight',
                    summary.netFlow >= 0 ? 'text-blue-700' : 'text-amber-700'
                  )}
                >
                  {summary.netFlow >= 0 ? '+' : ''}
                  {formatCurrency(summary.netFlow, settings)}
                </h3>
              </div>
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center font-bold',
                  summary.netFlow >= 0 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                )}
              >
                <Building2 size={20} />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600">Cash Flow Status:</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-md text-[11px]',
                  summary.netFlow >= 0 ? 'bg-blue-200/80 text-blue-900' : 'bg-amber-200/80 text-amber-900'
                )}
              >
                {summary.netFlow >= 0 ? '🟢 Net Surplus (সারপ্লাস)' : '🔴 Net Outflow (বেশি পরিশোধ)'}
              </span>
            </div>
          </div>
        </div>

        {/* Account-wise Inflow & Outflow Breakdown Pills */}
        {Object.keys(summary.accountSummary).length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <Building2 size={13} className="text-slate-400" />
              <span>Account-wise Deposit & Payout Breakdown (অ্যাকাউন্ট অনুযায়ী বিবরণ):</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {Object.entries(summary.accountSummary).map(([accName, vals]) => (
                <div
                  key={accName}
                  className="bg-slate-50/80 border border-slate-200 rounded-xl p-2.5 text-xs flex flex-col justify-between"
                >
                  <span className="font-bold text-slate-800 truncate" title={accName}>
                    {accName}
                  </span>
                  <div className="mt-1 flex items-center justify-between font-mono font-extrabold text-[11px]">
                    <span className="text-emerald-700">+{formatCurrency(vals.in, settings)}</span>
                    <span className="text-rose-700">-{formatCurrency(vals.out, settings)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters, Tabs & Search Bar */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4 md:p-5 space-y-4 no-print">
          {/* Main View Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => {
                  setActiveViewTab('all');
                  setCurrentPage(1);
                }}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                  activeViewTab === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <span>All Activities (সব লেনদেন)</span>
                <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded-full">
                  {processedRecords.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveViewTab('collection');
                  setCurrentPage(1);
                }}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                  activeViewTab === 'collection'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 hover:bg-emerald-50'
                )}
              >
                <span>Customer Due Collected (বকেয়া আদায়)</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                  {summary.countCollected}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveViewTab('payout');
                  setCurrentPage(1);
                }}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                  activeViewTab === 'payout'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-700 hover:bg-rose-50'
                )}
              >
                <span>Supplier Paid (সাপ্লায়ারকে পরিশোধ)</span>
                <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded-full">
                  {summary.countPayout}
                </span>
              </button>
            </div>

            {/* Classification: Due Settlement vs All */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Type:</span>
              <select
                value={settlementFilter}
                onChange={e => {
                  setSettlementFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 bg-white"
              >
                <option value="all">All Movements (Due + Invoice Bills)</option>
                <option value="due_only">Due Recoveries & Settlements Only (শুধু বকেয়া ও দেনা শোধ)</option>
                <option value="spot_only">On-Spot Bill Payments Only (স্পট বিল)</option>
              </select>
            </div>
          </div>

          {/* Search & Account Dropdown Filter */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-8 relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by customer name, supplier, phone, voucher / receipt #, or remarks..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
              />
            </div>

            <div className="md:col-span-4">
              <select
                value={selectedAccountId}
                onChange={e => {
                  setSelectedAccountId(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50/50 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">-- All Accounts (সব অ্যাকাউন্ট) --</option>
                {paymentAccounts.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type || 'account'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-black text-slate-700 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Category / Flow</th>
                  <th className="py-3 px-4">Customer / Supplier Name</th>
                  <th className="py-3 px-4">Account / Mode</th>
                  <th className="py-3 px-4">Receipt / Voucher #</th>
                  <th className="py-3 px-4">Notes / Remarks</th>
                  <th className="py-3 px-4 text-right">Collected (Inflow)</th>
                  <th className="py-3 px-4 text-right">Paid (Outflow)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText size={36} className="text-slate-300" />
                        <p className="font-bold text-slate-600 text-sm">No transaction records found</p>
                        <p className="text-xs text-slate-400 max-w-sm">
                          No customer due collections or supplier payments matched the selected date or filter criteria.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((item, idx) => {
                    const isInflow = item.direction === 'in';
                    return (
                      <tr
                        key={item.id || idx}
                        className={cn(
                          'transition-colors hover:bg-slate-50/80',
                          isInflow ? 'hover:bg-emerald-50/20' : 'hover:bg-rose-50/20'
                        )}
                      >
                        {/* Date & Time */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-800">{item.dateStr}</div>
                          {item.timeStr && (
                            <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                              <Clock size={10} />
                              <span>{item.timeStr}</span>
                            </div>
                          )}
                        </td>

                        {/* Category / Flow */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isInflow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <ArrowDownLeft size={11} className="text-emerald-700" />
                              <span>বকেয়া আদায়</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200">
                              <ArrowUpRight size={11} className="text-rose-700" />
                              <span>সাপ্লায়ার পরিশোধ</span>
                            </span>
                          )}
                        </td>

                        {/* Customer / Supplier Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-slate-900">{item.partyName}</span>
                            {item.partyType === 'customer' && setActiveTab && (
                              <button
                                type="button"
                                onClick={() => setActiveTab('customer_due_list')}
                                className="text-[10px] text-blue-600 hover:underline font-bold no-print"
                                title="Open Customer Due List"
                              >
                                [Due]
                              </button>
                            )}
                            {item.partyType === 'vendor' && setActiveTab && (
                              <button
                                type="button"
                                onClick={() => setActiveTab('vendor_due_list')}
                                className="text-[10px] text-purple-600 hover:underline font-bold no-print"
                                title="Open Vendor Due List"
                              >
                                [Supplier]
                              </button>
                            )}
                          </div>
                          {item.partyPhone && (
                            <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                              <Phone size={10} className="text-slate-400" />
                              <span>{item.partyPhone}</span>
                            </div>
                          )}
                        </td>

                        {/* Account & Method */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] border border-slate-200">
                            {item.accountName}
                          </span>
                        </td>

                        {/* Receipt / Voucher # */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-600 text-[11px]">
                            {item.documentNumber || item.referenceId || '—'}
                          </span>
                        </td>

                        {/* Notes / Remarks */}
                        <td className="py-3 px-4 max-w-xs truncate" title={item.description}>
                          <span className="text-slate-600">{item.description}</span>
                        </td>

                        {/* Collected Inflow */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {isInflow ? (
                            <span className="font-mono font-black text-emerald-700 text-sm">
                              +{formatCurrency(item.amount, settings)}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-mono">—</span>
                          )}
                        </td>

                        {/* Paid Outflow */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {!isInflow ? (
                            <span className="font-mono font-black text-rose-700 text-sm">
                              -{formatCurrency(item.amount, settings)}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-mono">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Table Footer Summary Row */}
              {paginatedRecords.length > 0 && (
                <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-black text-slate-900 text-xs">
                  <tr>
                    <td colSpan={6} className="py-3 px-4 text-right uppercase tracking-wider text-[11px]">
                      Filtered Summary (ফিল্টারকৃত মোট):
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-800 font-mono text-sm whitespace-nowrap">
                      +{formatCurrency(
                        filteredRecords.reduce((acc, r) => acc + (r.direction === 'in' ? r.amount : 0), 0),
                        settings
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-rose-800 font-mono text-sm whitespace-nowrap">
                      -{formatCurrency(
                        filteredRecords.reduce((acc, r) => acc + (r.direction === 'out' ? r.amount : 0), 0),
                        settings
                      )}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-500">
                Showing {paginatedRecords.length} of {filteredRecords.length} records
              </span>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={page => setCurrentPage(page)}
              />
            </div>
          )}
        </div>

        {/* Printable Audit Signature Section */}
        <div className="hidden print:block pt-12 mt-12 border-t border-slate-300">
          <div className="grid grid-cols-3 gap-8 text-center text-xs">
            <div>
              <div className="border-t border-slate-900 pt-2 font-bold text-slate-800">
                Prepared By (Cashier / Staff)
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Signature & Date</p>
            </div>
            <div>
              <div className="border-t border-slate-900 pt-2 font-bold text-slate-800">
                Verified By (Accounts Officer)
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Signature & Date</p>
            </div>
            <div>
              <div className="border-t border-slate-900 pt-2 font-bold text-slate-800">
                Approved By (Proprietor / Manager)
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Signature & Seal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyCollectionPayoutReport;
