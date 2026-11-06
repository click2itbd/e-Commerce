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
  Building2,
  Clock,
  Phone,
  FileText,
  Wallet,
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
  const [itemsPerPage] = useState<number>(25);

  // Quick Date Selectors
  const handleSetQuickDate = (mode: 'today' | 'yesterday' | '7days' | '30days') => {
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
    } else if (mode === '7days') {
      const first = new Date(now);
      first.setDate(first.getDate() - 7);
      setStartDate(first.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (mode === '30days') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(now.toISOString().split('T')[0]);
    }
    setCurrentPage(1);
  };

  // Process transactions into unified records
  const processedRecords = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      timeStr: string;
      dateStr: string;
      direction: 'in' | 'out';
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

      const matchedAcc = paymentAccounts.find(a => a.id === tx.paymentAccountId);
      const accountName = matchedAcc?.name || tx.paymentMethod || 'Cash Counter';

      // Customer payments / collections
      const isCustomerPayment =
        txType === 'payment_received' ||
        txType === 'money_receipt' ||
        (txType === 'payment' && entityType === 'customer') ||
        (entityType === 'customer' && (descLower.includes('due') || descLower.includes('receipt') || descLower.includes('collection')));

      // Supplier / vendor payments
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
          partyName: tx.entityName || customer?.name || 'Walk-in Customer',
          partyPhone: customer?.phone || '',
          partyId: tx.entityId || customer?.id || '',
          amount: Number(tx.amount) || 0,
          accountName,
          paymentMethod: tx.paymentMethod || matchedAcc?.type || 'cash',
          referenceId: tx.referenceId || '',
          documentNumber: tx.documentNumber || tx.referenceId || '',
          description: desc || 'Customer Due Collection',
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
          description: desc || 'Supplier Due Payment',
          isDueSettlement,
        });
      }
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, customers, vendors, paymentAccounts, startDate, endDate]);

  // Filter records
  const filteredRecords = useMemo(() => {
    return processedRecords.filter(item => {
      if (activeViewTab === 'collection' && item.direction !== 'in') return false;
      if (activeViewTab === 'payout' && item.direction !== 'out') return false;

      if (settlementFilter === 'due_only' && !item.isDueSettlement) return false;
      if (settlementFilter === 'spot_only' && item.isDueSettlement) return false;

      if (selectedAccountId !== 'all') {
        const matched = paymentAccounts.find(a => a.id === selectedAccountId);
        const accTarget = (matched?.name || '').toLowerCase();
        if (item.accountName.toLowerCase() !== accTarget && item.paymentMethod.toLowerCase() !== accTarget) {
          return false;
        }
      }

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

  // Overall KPIs
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

  const handlePrintDailySheet = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'Date & Time',
      'Transaction Type',
      'Party Name',
      'Phone Number',
      'Payment Account',
      'Reference / Voucher',
      'Notes',
      'Collected Inflow (BDT)',
      'Paid Outflow (BDT)',
    ];

    const rows = filteredRecords.map(r => [
      `"${new Date(r.date).toLocaleString()}"`,
      `"${r.direction === 'in' ? 'Customer Due Collection' : 'Supplier Due Payment'}"`,
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
    link.setAttribute('download', `Daily_Collection_Payout_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Print Styles */}
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
            padding: 16px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Container */}
      <div id="daily-sheet-printable" className="space-y-5">
        {/* Printable Letterhead */}
        <div className="hidden print:block border-b border-slate-900 pb-3 mb-4 text-center">
          <h1 className="text-xl font-bold text-slate-900 uppercase tracking-wider">
            {settings?.brandName || 'Store Name'}
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            {settings?.companyAddress || settings?.address || 'Dhaka, Bangladesh'}
          </p>
          <div className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-900">
            Daily Collection & Supplier Payout Statement
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            Period: {startDate === endDate ? startDate : `${startDate} to ${endDate}`} | Generated: {new Date().toLocaleString()}
          </p>
        </div>

        {/* Clean Header Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 no-print shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowLeftRight size={18} className="text-blue-600" />
                Daily Collection & Payout
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of customer due recoveries and supplier payments
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintDailySheet}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer size={13} />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download size={13} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Date Range Bar */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-slate-200 rounded-md px-2 py-1 text-xs font-medium text-slate-800 bg-white"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-slate-200 rounded-md px-2 py-1 text-xs font-medium text-slate-800 bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSetQuickDate('today')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-medium transition-all border cursor-pointer',
                  startDate === todayStr && endDate === todayStr
                    ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                )}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDate('yesterday')}
                className="px-2.5 py-1 rounded-md text-xs font-medium transition-all border bg-white text-slate-600 border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDate('7days')}
                className="px-2.5 py-1 rounded-md text-xs font-medium transition-all border bg-white text-slate-600 border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDate('30days')}
                className="px-2.5 py-1 rounded-md text-xs font-medium transition-all border bg-white text-slate-600 border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                This Month
              </button>
            </div>
          </div>
        </div>

        {/* Clean Metrics: 3 Minimal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Card 1: Collections */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Customer Collections</span>
              <span className="text-[11px] text-slate-400">{summary.countCollected} receipts</span>
            </div>
            <div className="mt-2 text-xl font-bold text-emerald-600 tracking-tight">
              +{formatCurrency(summary.totalCollected, settings)}
            </div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
              <ArrowDownLeft size={12} className="text-emerald-500" />
              <span>Total cash/bank inflow</span>
            </div>
          </div>

          {/* Card 2: Payouts */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Supplier Payouts</span>
              <span className="text-[11px] text-slate-400">{summary.countPayout} vouchers</span>
            </div>
            <div className="mt-2 text-xl font-bold text-rose-600 tracking-tight">
              -{formatCurrency(summary.totalPayout, settings)}
            </div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
              <ArrowUpRight size={12} className="text-rose-500" />
              <span>Total supplier disbursements</span>
            </div>
          </div>

          {/* Card 3: Net Cash Position */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Net Cash Position</span>
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded font-semibold',
                  summary.netFlow >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                )}
              >
                {summary.netFlow >= 0 ? 'Surplus' : 'Deficit'}
              </span>
            </div>
            <div
              className={cn(
                'mt-2 text-xl font-bold tracking-tight',
                summary.netFlow >= 0 ? 'text-blue-600' : 'text-slate-900'
              )}
            >
              {summary.netFlow >= 0 ? '+' : ''}
              {formatCurrency(summary.netFlow, settings)}
            </div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
              <Wallet size={12} className="text-slate-400" />
              <span>Collections minus payouts</span>
            </div>
          </div>
        </div>

        {/* Minimal Account Breakdown Strip */}
        {Object.keys(summary.accountSummary).length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-3 text-xs shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium mb-2 text-[11px] uppercase tracking-wider">
              <Building2 size={12} />
              <span>Accounts Summary</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(summary.accountSummary).map(([accName, vals]) => (
                <div
                  key={accName}
                  className="bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1 text-xs flex items-center gap-2"
                >
                  <span className="font-semibold text-slate-700">{accName}:</span>
                  <span className="text-emerald-600 font-medium">+{formatCurrency(vals.in, settings)}</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-rose-600 font-medium">-{formatCurrency(vals.out, settings)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter & View Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-3 no-print shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* View Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg w-fit text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveViewTab('all');
                  setCurrentPage(1);
                }}
                className={cn(
                  'px-3 py-1 rounded-md font-medium transition-all cursor-pointer',
                  activeViewTab === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                All Movements ({processedRecords.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveViewTab('collection');
                  setCurrentPage(1);
                }}
                className={cn(
                  'px-3 py-1 rounded-md font-medium transition-all cursor-pointer',
                  activeViewTab === 'collection'
                    ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-emerald-700'
                )}
              >
                Collections ({summary.countCollected})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveViewTab('payout');
                  setCurrentPage(1);
                }}
                className={cn(
                  'px-3 py-1 rounded-md font-medium transition-all cursor-pointer',
                  activeViewTab === 'payout'
                    ? 'bg-white text-rose-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-rose-700'
                )}
              >
                Payouts ({summary.countPayout})
              </button>
            </div>

            {/* Type selector */}
            <select
              value={settlementFilter}
              onChange={e => {
                setSettlementFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 bg-white"
            >
              <option value="all">All Transactions</option>
              <option value="due_only">Due Recoveries Only</option>
              <option value="spot_only">Spot Bill Payments Only</option>
            </select>
          </div>

          {/* Search & Account select */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
            <div className="md:col-span-8 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by customer, supplier, phone, voucher #, notes..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 bg-white focus:outline-none focus:border-slate-400"
              />
            </div>
            <div className="md:col-span-4">
              <select
                value={selectedAccountId}
                onChange={e => {
                  setSelectedAccountId(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:border-slate-400"
              >
                <option value="all">All Accounts</option>
                {paymentAccounts.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Clean Data Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3.5">Date & Time</th>
                  <th className="py-2.5 px-3.5">Type</th>
                  <th className="py-2.5 px-3.5">Party Name</th>
                  <th className="py-2.5 px-3.5">Account</th>
                  <th className="py-2.5 px-3.5">Voucher / Ref</th>
                  <th className="py-2.5 px-3.5">Remarks</th>
                  <th className="py-2.5 px-3.5 text-right">Inflow (+)</th>
                  <th className="py-2.5 px-3.5 text-right">Outflow (-)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <FileText size={28} className="text-slate-300" />
                        <p className="font-semibold text-slate-600 text-xs">No records found</p>
                        <p className="text-[11px] text-slate-400">
                          No collections or payouts recorded for the selected date range.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((item, idx) => {
                    const isInflow = item.direction === 'in';
                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        {/* Date & Time */}
                        <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-700">
                          <span className="font-medium">{item.dateStr}</span>
                          {item.timeStr && (
                            <span className="text-[11px] text-slate-400 ml-1.5">{item.timeStr}</span>
                          )}
                        </td>

                        {/* Type badge */}
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          {isInflow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Collection
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              Payout
                            </span>
                          )}
                        </td>

                        {/* Party Name */}
                        <td className="py-2.5 px-3.5">
                          <div className="font-semibold text-slate-900">{item.partyName}</div>
                          {item.partyPhone && (
                            <div className="text-[10px] text-slate-400">{item.partyPhone}</div>
                          )}
                        </td>

                        {/* Account */}
                        <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-600">
                          {item.accountName}
                        </td>

                        {/* Voucher / Ref */}
                        <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-[11px] text-slate-500">
                          {item.documentNumber || item.referenceId || '—'}
                        </td>

                        {/* Remarks */}
                        <td className="py-2.5 px-3.5 max-w-xs truncate text-slate-600" title={item.description}>
                          {item.description}
                        </td>

                        {/* Inflow */}
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap font-mono">
                          {isInflow ? (
                            <span className="text-emerald-600 font-semibold">
                              +{formatCurrency(item.amount, settings)}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Outflow */}
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap font-mono">
                          {!isInflow ? (
                            <span className="text-rose-600 font-semibold">
                              -{formatCurrency(item.amount, settings)}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Table Footer */}
              {paginatedRecords.length > 0 && (
                <tfoot className="bg-slate-50 border-t border-slate-200 text-xs font-semibold text-slate-800">
                  <tr>
                    <td colSpan={6} className="py-2.5 px-3.5 text-right uppercase tracking-wider text-[11px] text-slate-500">
                      Total:
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-emerald-700 font-mono">
                      +{formatCurrency(
                        filteredRecords.reduce((acc, r) => acc + (r.direction === 'in' ? r.amount : 0), 0),
                        settings
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-rose-700 font-mono">
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-slate-200 no-print flex items-center justify-between text-xs text-slate-500">
              <span>
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

        {/* Printable Signatures */}
        <div className="hidden print:block pt-8 mt-8 border-t border-slate-200">
          <div className="grid grid-cols-3 gap-6 text-center text-xs">
            <div>
              <div className="border-t border-slate-900 pt-1 font-semibold text-slate-800">
                Prepared By (Cashier)
              </div>
            </div>
            <div>
              <div className="border-t border-slate-900 pt-1 font-semibold text-slate-800">
                Verified By (Accounts)
              </div>
            </div>
            <div>
              <div className="border-t border-slate-900 pt-1 font-semibold text-slate-800">
                Approved By (Manager)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyCollectionPayoutReport;
