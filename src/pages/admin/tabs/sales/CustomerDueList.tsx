import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, getDoc, addDoc, doc, updateDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { toast } from 'react-hot-toast';
import { useSettings } from '../../../../context/SettingsContext';
import { formatCurrency, cn } from '../../../../lib/utils';
import { 
  Search, 
  CreditCard, 
  X, 
  Check, 
  Trash2, 
  Clock, 
  AlertTriangle, 
  MessageCircle, 
  AlertCircle, 
  Calendar,
  Layers,
  Receipt,
  CheckSquare,
  Square,
  Filter,
  Printer,
  Download,
  ArrowUpDown,
  Phone,
  MapPin,
  User,
  FileText,
  CheckCircle2,
  DollarSign,
  Users
} from 'lucide-react';
import { generatePDF } from '../../../../lib/pdf';
import { Customer, Transaction, PaymentAccount, Order } from '../../../../types';

import { where } from 'firebase/firestore';
import { useAuth } from '../../../../context/AuthContext';
import { logAudit } from '../../../../lib/audit';
import { recordSensitiveAlert } from '../../../../lib/alerts';

export type AgingBucket = 'all' | '0_30' | '31_60' | '61_90' | '90_plus';

export default function CustomerDueList() {
  const { profile, user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'due_desc' | 'due_asc' | 'aging_desc' | 'name_asc'>('due_desc');
  
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string, name: string, due: number } | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<{ id: string, name: string } | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState<number | ''>('');
  const [editDate, setEditDate] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [agingFilter, setAgingFilter] = useState<AgingBucket>('all');

  // Invoice / Project Wise Due Settlement state
  const [settlementMode, setSettlementMode] = useState<'invoice' | 'lump_sum'>('invoice');
  const [modalProjectFilter, setModalProjectFilter] = useState<string>('all');
  const [orderAllocations, setOrderAllocations] = useState<Record<string, number>>({});

  // Opening Balance state
  const [showOpeningBalForm, setShowOpeningBalForm] = useState(false);
  const [obAmount, setObAmount] = useState<number | ''>('');
  const [obDate, setObDate] = useState('2026-01-01');
  const [obDescription, setObDescription] = useState('Previous outstanding balance');
  const [obSubmitting, setObSubmitting] = useState(false);
  const [ledgerBranchFilter, setLedgerBranchFilter] = useState<string>('all');

  const { settings } = useSettings();

  
  const handleViewInvoice = async (documentNumber: string) => {
    try {
      const q = query(collection(db, 'orders'), where('documentNumber', '==', documentNumber));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const order = { id: snap.docs[0].id, ...snap.docs[0].data() };
        generatePDF(order as any, 'invoice', settings);
        return;
      }

      // Check by direct order ID
      const orderDocSnap = await getDoc(doc(db, 'orders', documentNumber));
      if (orderDocSnap.exists()) {
        const order = { id: orderDocSnap.id, ...orderDocSnap.data() };
        generatePDF(order as any, 'invoice', settings);
        return;
      }

      // Fallback: generate PDF from matching transaction so it never fails
      const matchedTx = transactions.find(t => t.documentNumber === documentNumber || t.referenceId === documentNumber);
      if (matchedTx) {
        const pseudoOrder = {
          id: matchedTx.referenceId || matchedTx.id,
          documentNumber: matchedTx.documentNumber || documentNumber,
          customerName: matchedTx.entityName || historyCustomer?.name || 'Customer',
          customerPhone: (historyCustomer as any)?.phone || '',
          shippingAddress: (historyCustomer as any)?.address || '',
          total: Number(matchedTx.amount) || 0,
          paidAmount: Number(matchedTx.amount) || 0,
          subtotal: Number(matchedTx.amount) || 0,
          paymentStatus: 'paid',
          createdAt: matchedTx.date || matchedTx.createdAt || new Date().toISOString(),
          status: 'delivered',
          items: [{
            productId: 'tx-item',
            name: matchedTx.description || `Invoice #${documentNumber}`,
            quantity: 1,
            price: Number(matchedTx.amount) || 0,
            hasWarranty: false,
          }],
        };
        generatePDF(pseudoOrder as any, 'invoice', settings);
        return;
      }

      toast.error('Invoice details not found');
    } catch (e) {
      console.error('Failed to view invoice:', e);
      toast.error('Failed to view invoice');
    }
  };
  const fetchData = async () => {
    try {
      setLoading(true);
      const [custSnap, txSnap, accSnap, ordSnap] = await Promise.all([
        getDocs(collection(db, 'customers')),
        getDocs(query(collection(db, 'transactions'), orderBy('date', 'desc'))),
        getDocs(collection(db, 'payment_accounts')),
        getDocs(collection(db, 'orders'))
      ]);

      setCustomers(custSnap.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));

      // Set all transactions safely without deleting anything
      const allTxList: Transaction[] = txSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      setTransactions(allTxList);
      
      const allAccs = accSnap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentAccount));
      setPaymentAccounts(allAccs);

      const allOrders: Order[] = ordSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      setOrders(allOrders);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // WhatsApp Reminder handler
  const handleSendWhatsAppReminder = (customer: any) => {
    if (!customer.phone) {
      toast.error('Customer phone number not available');
      return;
    }
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('880') ? cleanPhone : cleanPhone.startsWith('0') ? `88${cleanPhone}` : `880${cleanPhone}`;
    const daysText = customer.daysOld > 0 ? ` (যা প্রায় ${customer.daysOld} দিন ধরে বকেয়া আছে)` : '';
    const message = `আসসালামু আলাইকুম ${customer.name} ভাই,\nClick2IT-তে আপনার বর্তমান বকেয়া (Due) টাকার পরিমাণ ৳${Number(customer.due).toLocaleString()}${daysText}।\n\nঅনুরোধপূর্বক বকেয়া পরিশোধ করার জন্য যোগাযোগ করুন।\nধন্যবাদ,\nClick2IT`;
    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Calculate dues and Due Aging
  // A positive balance indicates the customer owes us money (Due)
  const calculateDues = () => {
    const balances: Record<string, number> = {};
    const customerDebits: Record<string, { oldestDate: string; daysOld: number; bucket: '0_30' | '31_60' | '61_90' | '90_plus'; oldestDocNumber?: string }> = {};
    const now = Date.now();

    // Sort transactions by date asc so oldest debit comes first
    const sortedTxs = [...transactions].sort((a, b) => new Date(a.date || a.createdAt || 0).getTime() - new Date(b.date || b.createdAt || 0).getTime());

    sortedTxs.forEach(t => {
      const isCustomerTx = t.entityType === 'customer' || (!t.entityType && (t.type === 'sale_return' || t.type === 'return'));
      if (isCustomerTx && t.entityId) {
        if (!balances[t.entityId]) balances[t.entityId] = 0;
        
        if (t.type === 'sale' || t.type === 'opening_balance') {
          balances[t.entityId] += Number(t.amount);
          const txDate = t.date || t.createdAt;
          if (txDate && !customerDebits[t.entityId]) {
            const days = Math.max(0, Math.floor((now - new Date(txDate).getTime()) / (1000 * 60 * 60 * 24)));
            let b: '0_30' | '31_60' | '61_90' | '90_plus' = '0_30';
            if (days > 90) b = '90_plus';
            else if (days > 60) b = '61_90';
            else if (days > 30) b = '31_60';

            customerDebits[t.entityId] = {
              oldestDate: txDate,
              daysOld: days,
              bucket: b,
              oldestDocNumber: t.documentNumber || t.referenceId
            };
          }
        } else if (t.type === 'payment_received' || t.type === 'money_receipt' || ((t.type === 'return' || t.type === 'sale_return') && (t.paymentMethod === 'store_credit' || !t.paymentMethod || t.paymentMethod === 'credit'))) {
          balances[t.entityId] -= Number(t.amount);
        }
      }
    });

    const dueList = customers
      .map(c => {
        const due = balances[c.id] || 0;
        const aging = customerDebits[c.id] || {
          oldestDate: new Date().toISOString(),
          daysOld: 0,
          bucket: '0_30' as const,
        };
        return {
          ...c,
          due,
          daysOld: aging.daysOld,
          agingBucket: aging.bucket,
          oldestDocNumber: aging.oldestDocNumber,
          oldestDate: aging.oldestDate,
        };
      })
      .filter(c => showAll ? true : c.due > 0)
      .sort((a, b) => b.due - a.due);

    return dueList;
  };

  const allDueCustomers = calculateDues();

  // Aging summary statistics
  const agingStats = {
    all: { count: allDueCustomers.filter(c => c.due > 0).length, total: allDueCustomers.reduce((acc, c) => acc + (c.due > 0 ? c.due : 0), 0) },
    '0_30': { count: 0, total: 0 },
    '31_60': { count: 0, total: 0 },
    '61_90': { count: 0, total: 0 },
    '90_plus': { count: 0, total: 0 },
  };

  allDueCustomers.forEach(c => {
    if (c.due > 0 && c.agingBucket) {
      agingStats[c.agingBucket].count += 1;
      agingStats[c.agingBucket].total += c.due;
    }
  });

  const dueCustomers = useMemo(() => {
    let list = allDueCustomers
      .filter(c => agingFilter === 'all' || c.agingBucket === agingFilter)
      .filter(c => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          (c.name || '').toLowerCase().includes(q) ||
          (c.phone || '').includes(searchTerm) ||
          (c.address || '').toLowerCase().includes(q) ||
          (c.branchName || '').toLowerCase().includes(q) ||
          (c.branches || []).some(b => b.toLowerCase().includes(q))
        );
      });

    list.sort((a, b) => {
      if (sortBy === 'due_desc') return b.due - a.due;
      if (sortBy === 'due_asc') return a.due - b.due;
      if (sortBy === 'aging_desc') return (b.daysOld || 0) - (a.daysOld || 0);
      if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      return b.due - a.due;
    });

    return list;
  }, [allDueCustomers, agingFilter, searchTerm, sortBy]);

  const totalOverallDue = dueCustomers.reduce((acc, curr) => acc + curr.due, 0);

  // Export Customer Due List to CSV
  const handleExportCSV = () => {
    if (dueCustomers.length === 0) {
      toast.error('No customer due records to export');
      return;
    }
    const headers = ['Customer Name', 'Phone', 'Address', 'Branch / Project', 'Days Overdue', 'Oldest Due Date', 'Aging Status', 'Due Amount (BDT)'];
    const rows = dueCustomers.map(c => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      `"${(c.branchName || (c.branches && c.branches[0]) || '').replace(/"/g, '""')}"`,
      c.daysOld || 0,
      c.oldestDate ? new Date(c.oldestDate).toLocaleDateString() : 'N/A',
      c.agingBucket ? c.agingBucket.replace('_', '-') + ' days' : 'Current',
      c.due || 0
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `customer_due_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Customer Due List exported successfully!');
  };

  // Print Due Report
  const handlePrintReport = () => {
    if (dueCustomers.length === 0) {
      toast.error('No due records to print');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups for this site.');
      return;
    }
    const storeName = settings?.storeName || 'Click2IT';
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    
    const rowsHtml = dueCustomers.map((c, idx) => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; color: #0f172a;">
          ${c.name}
          ${c.branchName ? `<br><span style="font-size: 10px; color: #64748b; font-weight: normal;">Branch / Project: ${c.branchName}</span>` : ''}
        </td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #334155;">${c.phone || 'N/A'}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #475569;">${c.address || 'N/A'}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: center;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; background: ${c.daysOld > 60 ? '#ffe4e6; color: #9f1239' : c.daysOld > 30 ? '#fef3c7; color: #92400e' : '#ecfdf5; color: #065f46'};">
            ${c.daysOld} Days Overdue
          </span>
        </td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 800; text-align: right; color: #dc2626;">৳${Number(c.due).toLocaleString()}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Customer Due Aging Report - ${dateStr}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #0f172a; color: #ffffff; padding: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
        </style>
      </head>
      <body>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
          <div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #0f172a;">${storeName}</h1>
            <p style="margin: 3px 0 0; font-size: 12px; color: #64748b;">Customer Outstanding & Aging Summary Report</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 12px; font-weight: bold; color: #0f172a;">Date: ${dateStr}</p>
            <p style="margin: 3px 0 0; font-size: 11px; color: #64748b;">Total Outstanding: <strong style="color: #dc2626; font-size: 14px;">৳${Number(totalOverallDue).toLocaleString()}</strong></p>
            <p style="margin: 2px 0 0; font-size: 11px; color: #64748b;">Total Due Accounts: <strong>${dueCustomers.length}</strong></p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">#</th>
              <th>Customer Name</th>
              <th>Phone</th>
              <th>Address</th>
              <th style="text-align: center;">Aging Status</th>
              <th style="text-align: right;">Due Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr style="background: #f8fafc; font-weight: bold;">
              <td colspan="5" style="padding: 12px 10px; text-align: right; font-size: 13px; text-transform: uppercase;">Total Outstanding:</td>
              <td style="padding: 12px 10px; text-align: right; font-size: 15px; color: #dc2626; font-weight: 900;">৳${Number(totalOverallDue).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
          <span>Report Generated automatically on ${new Date().toLocaleString()}</span>
          <span>Printed from Click2IT ERP</span>
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  
  const handleDeleteTransaction = async (txId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this transaction? This will alter the ledger balance.")) return;
    try {
      await deleteDoc(doc(db, 'transactions', txId));
      await logAudit(
        'DELETE',
        'Payment',
        `Deleted transaction #${txId.slice(0, 8)} from ledger for customer "${historyCustomer?.name || 'Customer'}"`,
        profile?.displayName || user?.displayName || user?.email || 'Admin',
        { entityId: txId }
      );
      // Sensitive alert for deleting a payment transaction
      recordSensitiveAlert({
        type: 'PAYMENT_DELETED',
        severity: 'critical',
        title: 'Payment Transaction Deleted',
        message: `${profile?.displayName || user?.displayName || 'Staff'} deleted transaction #${txId.slice(0, 8)} from ledger of "${historyCustomer?.name || 'Customer'}"`,
        entityId: txId,
        performedBy: profile?.displayName || user?.displayName || user?.email || 'Staff',
      }).catch(() => {});
      toast.success('Transaction deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };

  const handleAddOpeningBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!historyCustomer || !obAmount || Number(obAmount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    try {
      setObSubmitting(true);
      await addDoc(collection(db, 'transactions'), {
        type: 'opening_balance',
        entityId: historyCustomer.id,
        entityName: historyCustomer.name,
        entityType: 'customer',
        amount: Number(obAmount),
        date: new Date(obDate).toISOString(),
        description: obDescription || 'Previous outstanding balance',
        paymentMethod: 'n/a',
        createdAt: new Date().toISOString(),
      });
      await logAudit(
        'CREATE',
        'Payment',
        `Added opening balance of ৳${obAmount} for customer "${historyCustomer.name}"`,
        profile?.displayName || user?.displayName || user?.email || 'Admin',
        { entityId: historyCustomer.id }
      );
      toast.success('Opening balance added');
      setShowOpeningBalForm(false);
      setObAmount('');
      setObDescription('Previous outstanding balance');
      fetchData();
    } catch (error) {
      console.error('Error adding opening balance:', error);
      toast.error('Failed to add opening balance');
    } finally {
      setObSubmitting(false);
    }
  };

  const handleEditTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTx || !editAmount) return;
    try {
      await updateDoc(doc(db, 'transactions', editTx.id), {
        amount: Number(editAmount),
        date: new Date(editDate).toISOString(),
      });
      toast.success('Transaction updated');
      setEditTx(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to update transaction');
    }
  };

  // Unpaid Orders for the selected customer in Payment Modal
  const customerUnpaidOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    return orders.filter(o => {
      if (o.status === 'cancelled' || o.type === 'quotation') return false;
      const matchesId = o.customerId === selectedCustomer.id;
      const matchesName = o.customerName && selectedCustomer.name && o.customerName.toLowerCase().trim() === selectedCustomer.name.toLowerCase().trim();
      if (!matchesId && !matchesName) return false;
      const total = Number(o.total || 0);
      const paid = Number(o.paidAmount || (o as any).amountPaid || 0);
      return (total - paid) > 0.01;
    }).sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
  }, [selectedCustomer, orders]);

  // Distinct projects / branches for this customer's unpaid orders
  const customerProjects = useMemo(() => {
    const set = new Set<string>();
    customerUnpaidOrders.forEach(o => {
      const proj = (o.projectName || o.branchName || '').trim();
      if (proj) set.add(proj);
    });
    return Array.from(set).sort();
  }, [customerUnpaidOrders]);

  // Filtered unpaid orders based on modal project dropdown
  const displayedUnpaidOrders = useMemo(() => {
    if (modalProjectFilter === 'all') return customerUnpaidOrders;
    return customerUnpaidOrders.filter(o => 
      (o.projectName || '').trim() === modalProjectFilter || 
      (o.branchName || '').trim() === modalProjectFilter
    );
  }, [customerUnpaidOrders, modalProjectFilter]);

  // Open Payment Modal and initialize state
  const handleOpenPaymentModal = (customer: { id: string; name: string; due: number }) => {
    setSelectedCustomer(customer);
    setPaymentNotes('');
    setModalProjectFilter('all');

    const unpaid = orders.filter(o => {
      if (o.status === 'cancelled') return false;
      const matchesId = o.customerId === customer.id;
      const matchesName = o.customerName && customer.name && o.customerName.toLowerCase().trim() === customer.name.toLowerCase().trim();
      if (!matchesId && !matchesName) return false;
      const total = Number(o.total || 0);
      const paid = Number(o.paidAmount || (o as any).amountPaid || 0);
      return (total - paid) > 0.01;
    });

    if (unpaid.length > 0) {
      setSettlementMode('invoice');
      setOrderAllocations({});
      setPaymentAmount('');
    } else {
      setSettlementMode('lump_sum');
      setOrderAllocations({});
      setPaymentAmount(customer.due > 0 ? customer.due : '');
    }
  };

  const handleToggleOrderSelection = (orderId: string, orderDue: number) => {
    setOrderAllocations(prev => {
      const next = { ...prev };
      if (next[orderId] && next[orderId] > 0) {
        delete next[orderId];
      } else {
        next[orderId] = orderDue;
      }
      const totalAlloc = Object.values(next).reduce((s, a) => s + (Number(a) || 0), 0);
      setPaymentAmount(totalAlloc > 0 ? totalAlloc : '');
      return next;
    });
  };

  const handleAllocationAmountChange = (orderId: string, amount: number, maxDue: number) => {
    const validAmount = Math.max(0, Math.min(amount, maxDue));
    setOrderAllocations(prev => {
      const next = { ...prev };
      if (validAmount > 0) {
        next[orderId] = validAmount;
      } else {
        delete next[orderId];
      }
      const totalAlloc = Object.values(next).reduce((s, a) => s + (Number(a) || 0), 0);
      setPaymentAmount(totalAlloc > 0 ? totalAlloc : '');
      return next;
    });
  };

  const handleSelectAllOrders = () => {
    const next: Record<string, number> = {};
    displayedUnpaidOrders.forEach(o => {
      const due = Math.max(0, (Number(o.total || 0)) - (Number(o.paidAmount || (o as any).amountPaid || 0)));
      if (due > 0) next[o.id] = due;
    });
    setOrderAllocations(next);
    const totalAlloc = Object.values(next).reduce((s, a) => s + (Number(a) || 0), 0);
    setPaymentAmount(totalAlloc > 0 ? totalAlloc : '');
  };

  const handleClearAllAllocations = () => {
    setOrderAllocations({});
    setPaymentAmount('');
  };

  const handleReceivePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!paymentAccountId) {
      toast.error('Select a payment account');
      return;
    }

    try {
      setSubmitting(true);
      const acc = paymentAccounts.find(a => a.id === paymentAccountId);
      const paymentDate = new Date().toISOString();
      const allocatedEntries = Object.entries(orderAllocations).filter(([_, amt]) => Number(amt) > 0);

      if (settlementMode === 'invoice' && allocatedEntries.length > 0) {
        // Specific Invoice / Order Settlement
        const updatedCustomerDue = Math.max(0, selectedCustomer.due - Number(paymentAmount));
        const settledDocNumbers: string[] = [];

        for (const [ordId, allocAmt] of allocatedEntries) {
          const ord = orders.find(o => o.id === ordId);
          if (!ord) continue;

          const currentPaid = Number(ord.paidAmount || (ord as any).amountPaid || 0);
          const ordTotal = Number(ord.total || 0);
          const newPaid = currentPaid + Number(allocAmt);
          const newStatus = newPaid >= ordTotal ? 'paid' : 'partial';

          // 1. Update Order in Firestore
          await updateDoc(doc(db, 'orders', ordId), {
            paidAmount: newPaid,
            amountPaid: newPaid,
            paymentStatus: newStatus
          });

          const docNum = ord.documentNumber || ord.id;
          const rawP = (ord.branchName || ord.projectName || '').trim();
          const isRealP = rawP && !['main', 'main office', 'none', 'n/a', '-- main office / none --', '-- none / no project --', '-- main / default --', 'corporate', 'default'].includes(rawP.toLowerCase());
          const projInfo = isRealP ? ` (Project: ${rawP})` : '';

          // 2. Add Transaction in Firestore
          await addDoc(collection(db, 'transactions'), {
            type: 'payment_received',
            amount: Number(allocAmt),
            date: paymentDate,
            description: paymentNotes 
              ? `${paymentNotes} - Settled Invoice #${docNum}${projInfo}`
              : `Payment received for Invoice #${docNum}${projInfo}`,
            entityId: selectedCustomer.id,
            entityName: selectedCustomer.name,
            entityType: 'customer',
            documentNumber: docNum,
            referenceId: ord.id,
            paymentAccountId: paymentAccountId,
            paymentMethod: acc?.type || 'cash',
            createdAt: paymentDate,
            previousDue: selectedCustomer.due,
            currentBalance: updatedCustomerDue
          });
        }

        // Generate PDF receipt immediately
        const savedTx = { 
          id: `REC-${Date.now().toString().slice(-6)}`, 
          referenceId: `REC-${Date.now().toString().slice(-6)}`, 
          type: 'payment_received',
          amount: Number(paymentAmount),
          date: paymentDate,
          description: `Settled ${allocatedEntries.length} invoice(s): ${settledDocNumbers.join(', ')}`,
          entityId: selectedCustomer.id,
          entityName: selectedCustomer.name,
          paymentMethod: acc?.type || 'cash',
          _autoPrint: true 
        };
        try {
          generatePDF(savedTx as any, 'receipt', settings);
        } catch (err) {
          console.error('Failed to generate receipt PDF', err);
        }

        await logAudit(
          'CREATE',
          'Payment',
          `Received order-wise payment of ৳${paymentAmount} from "${selectedCustomer.name}" across ${allocatedEntries.length} invoice(s): ${settledDocNumbers.join(', ')} (${acc?.type || 'cash'})`,
          profile?.displayName || user?.displayName || user?.email || 'Admin',
          {
            entityId: selectedCustomer.id,
            previousState: { due: selectedCustomer.due },
            newState: {
              due: updatedCustomerDue,
              amount: Number(paymentAmount),
              settledInvoices: settledDocNumbers
            }
          }
        );

        toast.success(`Payment of ৳${Number(paymentAmount).toLocaleString()} received for ${allocatedEntries.length} invoice(s)!`);
      } else {
        // Lump Sum Payment (General / FIFO fallback)
        const txData = {
          type: 'payment_received',
          amount: Number(paymentAmount),
          date: paymentDate,
          description: paymentNotes || 'Received customer due payment (General / Lump Sum)',
          entityId: selectedCustomer.id,
          entityName: selectedCustomer.name,
          entityType: 'customer',
          paymentAccountId: paymentAccountId,
          paymentMethod: acc?.type || 'cash',
          createdAt: paymentDate,
          previousDue: selectedCustomer.due,
          currentBalance: selectedCustomer.due - Number(paymentAmount)
        };

        const txRef = await addDoc(collection(db, 'transactions'), txData);

        // Auto FIFO sync
        try {
          let remPay = Number(paymentAmount);
          const unpaidOrders = orders
            .filter(o => {
              if (o.status === 'cancelled' || o.type === 'quotation') return false;
              const matchesId = o.customerId === selectedCustomer.id;
              const matchesName = o.customerName && selectedCustomer.name && o.customerName.toLowerCase().trim() === selectedCustomer.name.toLowerCase().trim();
              if (!matchesId && !matchesName) return false;
              const tot = Number(o.total || 0);
              const pd = Number(o.paidAmount || (o as any).amountPaid || 0);
              return (tot - pd) > 0.01;
            })
            .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

          for (const ord of unpaidOrders) {
            if (remPay <= 0) break;
            const dueOnOrder = (Number(ord.total) || 0) - (Number(ord.paidAmount || (ord as any).amountPaid) || 0);
            const payAmt = Math.min(remPay, dueOnOrder);
            const updatedPaid = (Number(ord.paidAmount || (ord as any).amountPaid) || 0) + payAmt;
            const updatedStatus = updatedPaid >= (Number(ord.total) || 0) ? 'paid' : 'partial';
            await updateDoc(doc(db, 'orders', ord.id), {
              paidAmount: updatedPaid,
              amountPaid: updatedPaid,
              paymentStatus: updatedStatus
            });
            remPay -= payAmt;
          }
        } catch (err) {
          console.warn('Failed to sync order payment status:', err);
        }

        const savedTx = { id: txRef.id, referenceId: `REC-${Date.now().toString().slice(-6)}`, ...txData, _autoPrint: true };
        try {
          generatePDF(savedTx as any, 'receipt', settings);
        } catch (err) {
          console.error('Failed to generate receipt PDF', err);
        }

        await logAudit(
          'CREATE',
          'Payment',
          `Received customer due payment of ৳${paymentAmount} from "${selectedCustomer.name}" (${acc?.type || 'cash'})`,
          profile?.displayName || user?.displayName || user?.email || 'Admin',
          {
            entityId: selectedCustomer.id,
            previousState: { due: selectedCustomer.due },
            newState: {
              due: selectedCustomer.due - Number(paymentAmount),
              amount: Number(paymentAmount)
            }
          }
        );

        toast.success(`Payment of ৳${Number(paymentAmount).toLocaleString()} received!`);
      }

      setSelectedCustomer(null);
      setOrderAllocations({});
      setPaymentAmount('');
      setPaymentAccountId('');
      setPaymentNotes('');
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header Area */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 to-[#081621] text-white rounded-2xl shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-black uppercase tracking-widest mb-3">
              <CreditCard size={12} className="text-blue-400" /> Outstanding Management
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              Customer Due List
              <span className="text-xs font-bold text-slate-300 bg-white/10 px-3 py-1 rounded-full border border-white/5">
                {agingStats.all.count} Overdue Accounts
              </span>
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">
              Track aging balances, collect overdue payments, and dispatch WhatsApp payment reminders to clients.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Quick Summary Card */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Outstanding</span>
              <span className="text-xl font-black text-rose-400">{formatCurrency(agingStats.all.total, settings)}</span>
            </div>

            {/* Action Buttons */}
            <button
              type="button"
              onClick={handlePrintReport}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
              title="Print Customer Due Aging Report"
            >
              <Printer size={15} /> Print Report
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20"
              title="Download Due List as CSV Excel sheet"
            >
              <Download size={15} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Due Aging Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setAgingFilter('all')}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer",
            agingFilter === 'all'
              ? "bg-[#081621] text-white border-[#081621] shadow-lg ring-2 ring-blue-500/30"
              : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:shadow-sm"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={cn("text-[10px] font-black uppercase tracking-wider", agingFilter === 'all' ? "text-slate-300" : "text-slate-500")}>
              All Outstandings
            </span>
            <Layers size={14} className={agingFilter === 'all' ? "text-blue-400" : "text-slate-400"} />
          </div>
          <div className="text-lg sm:text-xl font-black tracking-tight">{formatCurrency(agingStats.all.total, settings)}</div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/10 text-[11px]">
            <span className={agingFilter === 'all' ? "text-slate-300 font-medium" : "text-slate-500"}>
              {agingStats.all.count} Customers
            </span>
            <span className={cn("font-bold text-[10px] px-1.5 py-0.5 rounded", agingFilter === 'all' ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600")}>
              100%
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setAgingFilter('0_30')}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer",
            agingFilter === '0_30'
              ? "bg-emerald-600 text-white border-emerald-600 shadow-lg ring-2 ring-emerald-500/30"
              : "bg-white text-emerald-950 border-emerald-200 hover:border-emerald-300 hover:shadow-sm"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={cn("text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5", agingFilter === '0_30' ? "text-emerald-100" : "text-emerald-700")}>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> 0 - 30 Days
            </span>
            <CheckCircle2 size={14} className={agingFilter === '0_30' ? "text-emerald-200" : "text-emerald-500"} />
          </div>
          <div className="text-lg sm:text-xl font-black tracking-tight">{formatCurrency(agingStats['0_30'].total, settings)}</div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/10 text-[11px]">
            <span className={agingFilter === '0_30' ? "text-emerald-100 font-medium" : "text-emerald-700"}>
              {agingStats['0_30'].count} Fresh Due
            </span>
            <span className={cn("font-bold text-[10px] px-1.5 py-0.5 rounded", agingFilter === '0_30' ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-800")}>
              {agingStats.all.total > 0 ? `${Math.round((agingStats['0_30'].total / agingStats.all.total) * 100)}%` : '0%'}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setAgingFilter('31_60')}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer",
            agingFilter === '31_60'
              ? "bg-amber-600 text-white border-amber-600 shadow-lg ring-2 ring-amber-500/30"
              : "bg-white text-amber-950 border-amber-200 hover:border-amber-300 hover:shadow-sm"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={cn("text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5", agingFilter === '31_60' ? "text-amber-100" : "text-amber-700")}>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> 31 - 60 Days
            </span>
            <Clock size={14} className={agingFilter === '31_60' ? "text-amber-200" : "text-amber-500"} />
          </div>
          <div className="text-lg sm:text-xl font-black tracking-tight">{formatCurrency(agingStats['31_60'].total, settings)}</div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/10 text-[11px]">
            <span className={agingFilter === '31_60' ? "text-amber-100 font-medium" : "text-amber-700"}>
              {agingStats['31_60'].count} Follow Up
            </span>
            <span className={cn("font-bold text-[10px] px-1.5 py-0.5 rounded", agingFilter === '31_60' ? "bg-white/20 text-white" : "bg-amber-50 text-amber-800")}>
              {agingStats.all.total > 0 ? `${Math.round((agingStats['31_60'].total / agingStats.all.total) * 100)}%` : '0%'}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setAgingFilter('61_90')}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer",
            agingFilter === '61_90'
              ? "bg-orange-600 text-white border-orange-600 shadow-lg ring-2 ring-orange-500/30"
              : "bg-white text-orange-950 border-orange-200 hover:border-orange-300 hover:shadow-sm"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={cn("text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5", agingFilter === '61_90' ? "text-orange-100" : "text-orange-700")}>
              <span className="w-2 h-2 rounded-full bg-orange-400"></span> 61 - 90 Days
            </span>
            <AlertCircle size={14} className={agingFilter === '61_90' ? "text-orange-200" : "text-orange-500"} />
          </div>
          <div className="text-lg sm:text-xl font-black tracking-tight">{formatCurrency(agingStats['61_90'].total, settings)}</div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/10 text-[11px]">
            <span className={agingFilter === '61_90' ? "text-orange-100 font-medium" : "text-orange-700"}>
              {agingStats['61_90'].count} Overdue
            </span>
            <span className={cn("font-bold text-[10px] px-1.5 py-0.5 rounded", agingFilter === '61_90' ? "bg-white/20 text-white" : "bg-orange-50 text-orange-800")}>
              {agingStats.all.total > 0 ? `${Math.round((agingStats['61_90'].total / agingStats.all.total) * 100)}%` : '0%'}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setAgingFilter('90_plus')}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer",
            agingFilter === '90_plus'
              ? "bg-rose-600 text-white border-rose-600 shadow-lg ring-2 ring-rose-500/30"
              : "bg-white text-rose-950 border-rose-200 hover:border-rose-300 hover:shadow-sm"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={cn("text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5", agingFilter === '90_plus' ? "text-rose-100" : "text-rose-700")}>
              <AlertTriangle size={12} className={agingFilter === '90_plus' ? "text-rose-200 animate-bounce" : "text-rose-500"} /> 90+ Days
            </span>
            <AlertTriangle size={14} className={agingFilter === '90_plus' ? "text-rose-200" : "text-rose-500"} />
          </div>
          <div className="text-lg sm:text-xl font-black tracking-tight">{formatCurrency(agingStats['90_plus'].total, settings)}</div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/10 text-[11px]">
            <span className={agingFilter === '90_plus' ? "text-rose-100 font-medium" : "text-rose-700"}>
              {agingStats['90_plus'].count} Critical
            </span>
            <span className={cn("font-bold text-[10px] px-1.5 py-0.5 rounded", agingFilter === '90_plus' ? "bg-white/20 text-white" : "bg-rose-50 text-rose-800")}>
              {agingStats.all.total > 0 ? `${Math.round((agingStats['90_plus'].total / agingStats.all.total) * 100)}%` : '0%'}
            </span>
          </div>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Controls Row: Search, Sort, Filter */}
        <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search customers by name, phone, branch / project, address..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
              >
                <option value="due_desc">Highest Due First</option>
                <option value="due_asc">Lowest Due First</option>
                <option value="aging_desc">Most Overdue (Days)</option>
                <option value="name_asc">Customer Name (A-Z)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end">
            {/* Show All Toggle */}
            <label className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 cursor-pointer shadow-2xs hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={showAll}
                onChange={e => setShowAll(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-700 font-bold whitespace-nowrap">Show All Customers</span>
            </label>

            {/* Filtered Total Badge */}
            <div className="bg-red-50 text-red-700 border border-red-200/80 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider">Filtered Due:</span>
              <span className="text-sm font-black">{formatCurrency(totalOverallDue, settings)}</span>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-300 text-[11px] font-black uppercase tracking-wider">
                <th className="px-6 py-4">Customer Profile</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Aging Status</th>
                <th className="px-6 py-4 text-right">Due Amount</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="h-7 w-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <span className="text-sm font-semibold">Calculating customer outstandings...</span>
                    </div>
                  </td>
                </tr>
              ) : dueCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center text-slate-400">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
                        <Check size={24} />
                      </div>
                      <h4 className="text-slate-800 font-bold text-sm">No Pending Dues</h4>
                      <p className="text-xs text-slate-400 mt-1">All customers in this category have cleared their balances.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                dueCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Customer Profile & Branches */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm shadow-inner shrink-0 bg-blue-50 text-blue-700 border border-blue-200/80">
                          {(customer.name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-slate-900 block group-hover:text-blue-600 transition-colors">
                            {customer.name}
                          </span>
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            {((customer.branches && customer.branches.length > 0) || customer.branchName) && (
                              <div className="flex flex-wrap gap-1">
                                {(customer.branches && customer.branches.length > 0 ? customer.branches : [customer.branchName]).filter(Boolean).map((br, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                                    Branch / Project: {br}
                                  </span>
                                ))}
                              </div>
                            )}
                            {customer.address && (
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <MapPin size={11} className="text-slate-400 shrink-0" />
                                <span className="truncate max-w-[200px]">{customer.address}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Phone & WhatsApp */}
                    <td className="px-6 py-4">
                      {customer.phone ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${customer.phone}`}
                            className="text-slate-700 hover:text-blue-600 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                          >
                            <Phone size={13} className="text-slate-400" /> {customer.phone}
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No phone</span>
                      )}
                    </td>

                    {/* Aging Status Badge */}
                    <td className="px-6 py-4">
                      {customer.daysOld > 0 ? (
                        <div className="flex flex-col gap-1">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black w-fit",
                            customer.agingBucket === '90_plus' ? "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse" :
                            customer.agingBucket === '61_90' ? "bg-orange-100 text-orange-800 border border-orange-200" :
                            customer.agingBucket === '31_60' ? "bg-amber-100 text-amber-800 border border-amber-200" :
                            "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          )}>
                            <Clock size={11} /> {customer.daysOld} Days Overdue
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Since {customer.oldestDate ? new Date(customer.oldestDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                          Current (0d)
                        </span>
                      )}
                    </td>

                    {/* Due Amount */}
                    <td className="px-6 py-4 text-right">
                      <span className="font-black text-base text-red-600 tracking-tight">
                        {formatCurrency(customer.due, settings)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center gap-1.5">
                        {customer.phone && (
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppReminder(customer)}
                            title="Send WhatsApp Due Reminder"
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 p-2 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1"
                          >
                            <MessageCircle size={14} className="text-emerald-600" />
                            <span className="hidden xl:inline">WhatsApp</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setHistoryCustomer({ id: customer.id, name: customer.name });
                            setLedgerBranchFilter('all');
                          }}
                          title="View Customer Ledger History"
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
                        >
                          <FileText size={13} className="text-slate-500" />
                          <span>History</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenPaymentModal({ id: customer.id, name: customer.name, due: customer.due })}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <DollarSign size={13} />
                          <span>Receive</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice & Project-Wise Due Settlement Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-[#081621] via-indigo-950 to-[#081621] text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-400/20">
                  <Receipt size={18} />
                </div>
                <div>
                  <h3 className="font-black text-base tracking-tight text-white flex items-center gap-2">
                    Receive Due Payment
                  </h3>
                  <span className="text-[11px] text-slate-300">
                    Settle outstanding dues by specific invoice or lump sum
                  </span>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedCustomer(null);
                  setOrderAllocations({});
                }}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleReceivePayment} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Customer Info Card */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Customer Account</span>
                  <div className="font-black text-base text-slate-900 mt-0.5">{selectedCustomer.name}</div>
                  <span className="text-[11px] text-slate-500">
                    {customerUnpaidOrders.length} unpaid / partial invoice(s) on file
                  </span>
                </div>
                <div className="bg-white border border-rose-200 px-4 py-2 rounded-xl text-right shadow-2xs">
                  <span className="text-[10px] font-bold text-rose-600 block uppercase">Total Balance Due</span>
                  <span className="font-black text-lg text-rose-700">{formatCurrency(selectedCustomer.due, settings)}</span>
                </div>
              </div>

              {/* Settlement Mode Switcher */}
              <div className="flex border border-slate-200 bg-slate-100/70 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setSettlementMode('invoice')}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    settlementMode === 'invoice'
                      ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <Receipt size={14} /> Pay by Specific Invoice / Project ({customerUnpaidOrders.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSettlementMode('lump_sum');
                    setPaymentAmount(selectedCustomer.due > 0 ? selectedCustomer.due : '');
                  }}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    settlementMode === 'lump_sum'
                      ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <CreditCard size={14} /> General / Lump Sum Payment
                </button>
              </div>

              {/* Order / Invoice Table (When in Invoice Mode) */}
              {settlementMode === 'invoice' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-xs">Unpaid Invoices</span>
                      {customerProjects.length > 1 && (
                        <select
                          value={modalProjectFilter}
                          onChange={e => setModalProjectFilter(e.target.value)}
                          className="text-[11px] font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="all">All Branches / Projects ({customerUnpaidOrders.length})</option>
                          {customerProjects.map((p, idx) => (
                            <option key={idx} value={p}>Branch / Project: {p}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllOrders}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-md transition-colors cursor-pointer"
                      >
                        Select All Full
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllAllocations}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {displayedUnpaidOrders.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 bg-slate-50/50">
                      <Receipt size={24} className="mx-auto mb-1 text-slate-400 opacity-50" />
                      <p className="font-bold text-xs">No unpaid invoices found under this project filter.</p>
                      <p className="text-[11px] text-slate-500 mt-1">Switch to "General / Lump Sum Payment" to record a direct payment.</p>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100/70 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 sticky top-0 bg-slate-100">
                          <tr>
                            <th className="py-2 px-3 text-center w-8">#</th>
                            <th className="py-2 px-3">Invoice & Date</th>
                            <th className="py-2 px-3">Branch / Project</th>
                            <th className="py-2 px-3 text-right">Bill Total</th>
                            <th className="py-2 px-3 text-right">Paid</th>
                            <th className="py-2 px-3 text-right">Due</th>
                            <th className="py-2 px-3 text-right w-36">Pay Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {displayedUnpaidOrders.map(o => {
                            const tot = Number(o.total || 0);
                            const pd = Number(o.paidAmount || (o as any).amountPaid || 0);
                            const ordDue = Math.max(0, tot - pd);
                            const isAllocated = (orderAllocations[o.id] || 0) > 0;
                            const currentAlloc = orderAllocations[o.id] || '';
                            const rawProj = (o.projectName || o.branchName || '').trim();
                            const isRealProj = rawProj && !['main', 'main office', 'none', 'n/a', '-- main office / none --', '-- none / no project --', '-- main / default --', 'corporate', 'default'].includes(rawProj.toLowerCase());
                            const projName = isRealProj ? rawProj : '';

                            return (
                              <tr 
                                key={o.id} 
                                className={cn(
                                  "transition-colors",
                                  isAllocated ? "bg-blue-50/40" : "hover:bg-slate-50"
                                )}
                              >
                                <td className="py-2 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isAllocated}
                                    onChange={() => handleToggleOrderSelection(o.id, ordDue)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <span className="font-black text-slate-900 block">{o.documentNumber || o.id}</span>
                                  <span className="text-[10px] text-slate-400">
                                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB') : 'N/A'}
                                  </span>
                                </td>
                                <td className="py-2 px-3">
                                  {projName ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      {projName}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px]">—</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-right font-medium text-slate-700">
                                  {formatCurrency(tot, settings)}
                                </td>
                                <td className="py-2 px-3 text-right text-emerald-600 font-bold">
                                  {formatCurrency(pd, settings)}
                                </td>
                                <td className="py-2 px-3 text-right font-black text-rose-600">
                                  {formatCurrency(ordDue, settings)}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      max={ordDue}
                                      placeholder="0"
                                      value={currentAlloc}
                                      onChange={(e) => handleAllocationAmountChange(o.id, Number(e.target.value), ordDue)}
                                      className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-md text-right font-black text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleAllocationAmountChange(o.id, ordDue, ordDue)}
                                      className="text-[9px] font-black uppercase px-1.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors cursor-pointer whitespace-nowrap"
                                      title="Pay entire bill due"
                                    >
                                      Full
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Allocation Bottom Summary */}
                  {Object.keys(orderAllocations).length > 0 && (
                    <div className="p-3 bg-blue-50/80 border-t border-blue-200 flex items-center justify-between font-bold text-xs">
                      <span className="text-blue-900 flex items-center gap-1.5">
                        <Check size={14} className="text-blue-700" />
                        Selected for settlement: {Object.values(orderAllocations).filter(v => v > 0).length} invoice(s)
                      </span>
                      <span className="text-blue-900 font-black text-sm">
                        Total: {formatCurrency(Number(paymentAmount) || 0, settings)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Total Amount Input & Account Select */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    {settlementMode === 'invoice' ? 'Total Settlement Amount (BDT)' : 'Payment Amount (BDT)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    max={selectedCustomer.due}
                    value={paymentAmount}
                    onChange={(e) => {
                      setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value));
                    }}
                    placeholder="Enter amount"
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-black text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                  {settlementMode === 'lump_sum' && selectedCustomer.due > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(selectedCustomer.due)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      >
                        Full Due ({formatCurrency(selectedCustomer.due, settings)})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(Math.round(selectedCustomer.due / 2))}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      >
                        50% Due
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Receive In Account
                  </label>
                  <select
                    value={paymentAccountId}
                    onChange={(e) => setPaymentAccountId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white cursor-pointer"
                    required
                  >
                    <option value="">-- Select Account --</option>
                    {paymentAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Notes / Reference / Bank Cheque No. (Optional)
                </label>
                <textarea
                  rows={2}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g., Paid via Bkash / Cheque #... / Ref order #..."
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setOrderAllocations({});
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !paymentAmount || !paymentAccountId}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-black text-xs transition-all shadow-md shadow-blue-900/20 flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? 'Processing Receipt...' : `Confirm Receipt (${formatCurrency(Number(paymentAmount) || 0, settings)})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historyCustomer && (() => {
        const targetCustomer = customers.find(c => c.id === historyCustomer.id);
        const targetCompany = (targetCustomer as any)?.company;
        const isCorporate = targetCompany && targetCompany !== 'main';

        // Gather related customer IDs if corporate
        const relatedCustomerIds = new Set<string>([historyCustomer.id]);
        if (isCorporate) {
          customers.forEach(c => {
            if ((c as any)?.company === targetCompany) {
              relatedCustomerIds.add(c.id);
            }
          });
        }

        // Available branches for this customer / corporate entity
        const availableBranches = new Set<string>();
        if (targetCustomer?.branchName) availableBranches.add(targetCustomer.branchName);
        (targetCustomer?.branches || []).forEach(b => b && availableBranches.add(b));

        if (isCorporate) {
          customers.forEach(c => {
            if ((c as any)?.company === targetCompany) {
              if (c.branchName) availableBranches.add(c.branchName);
              (c.branches || []).forEach(b => b && availableBranches.add(b));
              if (c.name.toLowerCase().startsWith(targetCompany.toLowerCase())) {
                const stripped = c.name.slice(targetCompany.length).trim();
                if (stripped) availableBranches.add(stripped);
              }
            }
          });
        }

        // Also scan transactions for any branchName or projectName
        transactions.forEach(t => {
          if (relatedCustomerIds.has(t.entityId) || (isCorporate && (t as any).company === targetCompany)) {
            const br = (t as any).branchName || (t as any).projectName;
            if (br) availableBranches.add(br);
          }
        });

        const branchOptions = Array.from(availableBranches).filter(Boolean);

        // Reverse so oldest is first for running balance calculation
        let runningBalance = 0;
        let totalDebit = 0;
        let totalCredit = 0;
        
        const allEntityTx = [...transactions]
          .filter(t => {
            const matchesEntity = relatedCustomerIds.has(t.entityId) || (isCorporate && (t as any).company === targetCompany);
            if (!matchesEntity) return false;

            if (ledgerBranchFilter !== 'all') {
              const txBranch = (t as any).branchName || (t as any).projectName || '';
              const matchesBranchName = txBranch === ledgerBranchFilter || (t.entityName && t.entityName.includes(ledgerBranchFilter));
              if (!matchesBranchName) return false;
            }

            return true;
          })
          .reverse()
          .map(t => {
            const isDebit = t.type === 'sale' || t.type === 'opening_balance';
            const isCredit = t.type === 'payment_received' || t.type === 'deposit' || t.type === 'money_receipt' || ((t.type === 'return' || t.type === 'sale_return') && (t.paymentMethod === 'store_credit' || !t.paymentMethod || t.paymentMethod === 'credit'));
            const amt = Number(t.amount) || 0;
            return { ...t, isDebit, isCredit, amt };
          });

        let openingBalance = 0;
        
        const filteredTx = allEntityTx.filter(t => {
            if (fromDate && new Date(t.date) < new Date(fromDate)) {
                if (t.isDebit) openingBalance += t.amt;
                if (t.isCredit) openingBalance -= t.amt;
                return false;
            }
            if (toDate && new Date(t.date) > new Date(toDate + 'T23:59:59')) {
                return false;
            }
            return true;
        });

        runningBalance = openingBalance;
        
        const customerTx = filteredTx.map(t => {
            if (t.isDebit) {
                runningBalance += t.amt;
                totalDebit += t.amt;
            }
            if (t.isCredit) {
                runningBalance -= t.amt;
                totalCredit += t.amt;
            }
            return { ...t, runningBalance };
        });

        const closingBalance = runningBalance;

        return (

          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

              {/* ── Modal Header ── */}
              <div className="bg-[#081621] text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-black tracking-tight">{historyCustomer.name}</h2>
                    {isCorporate && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full">
                        Corporate Client ({targetCompany})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-semibold bg-white/10 text-slate-300 px-2.5 py-0.5 rounded-full tracking-wide">
                      {ledgerBranchFilter !== 'all' ? `Branch / Project: ${ledgerBranchFilter}` : (isCorporate ? 'Company Total Ledger' : 'Customer Account')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setHistoryCustomer(null)}
                  className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* ── Filter + Action Bar ── */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex flex-wrap items-center gap-4 flex-shrink-0">
                <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">From Date</label>
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <span className="text-gray-300 mt-4">—</span>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">To Date</label>
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  {branchOptions.length > 0 && (
                    <div className="flex flex-col ml-0 sm:ml-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Filter Branch / Project</label>
                      <select
                        value={ledgerBranchFilter}
                        onChange={e => setLedgerBranchFilter(e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                      >
                        <option value="all">All Branches / Projects (Entire Company)</option>
                        {branchOptions.map((br, bi) => (
                          <option key={bi} value={br}>{br}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {(fromDate || toDate || ledgerBranchFilter !== 'all') && (
                    <button
                      onClick={() => { setFromDate(''); setToDate(''); setLedgerBranchFilter('all'); }}
                      className="mt-4 text-xs text-gray-400 hover:text-red-500 transition-colors"
                      title="Clear filters"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cust = customers.find(c => c.id === historyCustomer.id);
                      handleOpenPaymentModal({ 
                        id: historyCustomer.id, 
                        name: historyCustomer.name, 
                        due: closingBalance > 0 ? closingBalance : ((cust as any)?.due || 0) 
                      });
                    }}
                    className="flex-shrink-0 mt-0 inline-flex items-center gap-1.5 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    <CreditCard size={13} /> Receive Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowOpeningBalForm(v => !v); setObAmount(''); setObDescription('Previous outstanding balance'); }}
                    className="flex-shrink-0 mt-0 inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    + Opening Balance
                  </button>
                </div>
              </div>

              {/* ── Summary Cards ── */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-gray-200 border-b border-gray-200 flex-shrink-0">
                <div className="bg-white px-4 py-3 flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Debit</span>
                  <span className="text-base font-black text-red-600">{formatCurrency(totalDebit, settings)}</span>
                </div>
                <div className="bg-white px-4 py-3 flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Credit</span>
                  <span className="text-base font-black text-green-600">{formatCurrency(totalCredit, settings)}</span>
                </div>
                <div className="bg-white px-4 py-3 flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Opening Bal.</span>
                  <span className="text-base font-black text-gray-600">{formatCurrency(openingBalance, settings)}</span>
                </div>
                <div className="bg-white px-4 py-3 flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Closing Bal.</span>
                  <span className="text-base font-black text-violet-600">{formatCurrency(closingBalance, settings)}</span>
                </div>
                <div className={`px-4 py-3 flex flex-col gap-0.5 ${runningBalance > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Net Due</span>
                  <span className={`text-base font-black ${runningBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(Math.max(0, runningBalance), settings)}</span>
                </div>
              </div>

              {/* ── Opening Balance Form (inline panel) ── */}
              {showOpeningBalForm && (
                <div className="bg-indigo-50 border-b border-indigo-200 px-6 py-4 flex-shrink-0">
                  <p className="text-xs font-bold text-indigo-600 uppercase mb-3 tracking-wide">Add Opening Balance</p>
                  <form onSubmit={handleAddOpeningBalance} className="flex flex-wrap gap-3 items-end">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Amount</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={obAmount}
                        onChange={e => setObAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="0.00"
                        className="border border-indigo-200 rounded-lg p-2 w-36 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Date</label>
                      <input
                        type="date"
                        value={obDate}
                        onChange={e => setObDate(e.target.value)}
                        className="border border-indigo-200 rounded-lg p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                        required
                      />
                    </div>
                    <div className="flex-1 min-w-[180px]">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Description</label>
                      <input
                        type="text"
                        value={obDescription}
                        onChange={e => setObDescription(e.target.value)}
                        className="border border-indigo-200 rounded-lg p-2 w-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={obSubmitting || !obAmount}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                      >
                        {obSubmitting ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowOpeningBalForm(false)}
                        className="bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ── Transaction Table ── */}
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-5 py-3 font-bold text-gray-500 text-xs uppercase tracking-wide">Date</th>
                      <th className="px-5 py-3 font-bold text-gray-500 text-xs uppercase tracking-wide">Description</th>
                      <th className="px-5 py-3 font-bold text-gray-500 text-xs uppercase tracking-wide text-right">Debit</th>
                      <th className="px-5 py-3 font-bold text-gray-500 text-xs uppercase tracking-wide text-right">Credit</th>
                      <th className="px-5 py-3 font-bold text-gray-500 text-xs uppercase tracking-wide text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerTx.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center text-gray-400 italic text-sm">No transactions found for the selected period.</td>
                      </tr>
                    ) : (
                      [...customerTx].reverse().map((t, idx) => (
                        <tr key={t.id} className={`border-b border-gray-100 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'} hover:bg-blue-50/40`}>
                          <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                            <div className="font-medium text-gray-700 text-xs">{new Date(t.date).toLocaleDateString()}</div>
                            <div className="text-[11px] text-gray-400">{new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                          </td>
                          <td className="px-5 py-3 text-gray-800 font-medium">
                            {t.description}
                            {t.type === 'opening_balance' && (
                              <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-bold">OPENING BAL</span>
                            )}
                            {t.documentNumber && (
                              <span
                                onClick={(e) => { e.stopPropagation(); handleViewInvoice(t.documentNumber); }}
                                className="ml-2 cursor-pointer hover:bg-blue-100 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 font-semibold"
                              >
                                #{t.documentNumber}
                              </span>
                            )}
                            {(() => {
                              const br = (t as any).branchName || (t as any).projectName;
                              if (br) {
                                return (
                                  <span className="ml-2 text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 font-semibold">
                                    📁 {br}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </td>
                          <td className="px-5 py-3 text-right font-mono font-semibold text-red-600 text-sm">
                            {t.isDebit ? formatCurrency(t.amt, settings) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-5 py-3 text-right font-mono font-semibold text-green-600 text-sm">
                            {t.isCredit ? formatCurrency(t.amt, settings) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className={`font-mono font-bold text-sm ${t.runningBalance > 0 ? 'text-blue-600' : 'text-green-600'}`}>
                                {formatCurrency(Math.max(0, t.runningBalance), settings)}
                              </span>
                              {(t.type === 'payment_received' || t.type === 'payment_made' || t.type === 'opening_balance' || t.type === 'sale') && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => { setEditTx(t); setEditAmount(t.amt); setEditDate(t.date.slice(0, 16)); }}
                                    className="text-[11px] bg-gray-100 hover:bg-gray-200 px-1.5 py-0.5 rounded text-gray-600 font-medium transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTransaction(t.id)}
                                    className="text-[11px] bg-red-50 hover:bg-red-100 px-1.5 py-0.5 rounded text-red-500 font-medium transition-colors"
                                  >
                                    Del
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Footer ── */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-wrap items-center justify-end gap-3 flex-shrink-0">
                <button
                  onClick={() => {
                    const msg = `Dear ${historyCustomer.name}, your current due is ${formatCurrency(closingBalance, settings)}. Please clear the due as soon as possible.`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
                >
                  📲 WhatsApp
                </button>
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) return;
                    const html = `
                      <html>
                        <head>
                          <title>Ledger - ${historyCustomer.name}</title>
                          <style>
                            body { font-family: sans-serif; padding: 20px; color: #333; }
                            h1 { font-size: 20px; margin-bottom: 5px; }
                            .summary { display: flex; gap: 20px; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                            .summary div { font-size: 14px; }
                            table { width: 100%; border-collapse: collapse; font-size: 12px; }
                            th, td { padding: 8px; border-bottom: 1px solid #eee; text-align: left; }
                            th { background-color: #f9fafb; font-weight: bold; }
                            .text-right { text-align: right; }
                            .text-red { color: #dc2626; }
                            .text-green { color: #16a34a; }
                            .text-blue { color: #2563eb; }
                            .text-gray { color: #6b7280; }
                          </style>
                        </head>
                        <body>
                          <h1>Ledger History: ${historyCustomer.name}</h1>
                          <div class="summary">
                            <div><strong>Total Debit:</strong> <span class="text-red">${formatCurrency(totalDebit, settings)}</span></div>
                            <div><strong>Total Credit:</strong> <span class="text-green">${formatCurrency(totalCredit, settings)}</span></div>
                            <div><strong>Opening Balance:</strong> ${formatCurrency(openingBalance, settings)}</div>
                            <div><strong>Closing Balance:</strong> ${formatCurrency(closingBalance, settings)}</div>
                            <div><strong>Net Due:</strong> <span class="text-blue">${formatCurrency(Math.max(0, runningBalance), settings)}</span></div>
                          </div>
                          <table>
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th class="text-right">Debit</th>
                                <th class="text-right">Credit</th>
                                <th class="text-right">Balance</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${[...customerTx].reverse().map(t => `
                                <tr>
                                  <td>${new Date(t.date).toLocaleDateString()} ${new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                  <td>${t.description} ${t.documentNumber ? `(#${t.documentNumber})` : ''}</td>
                                  <td class="text-right text-red">${t.isDebit ? formatCurrency(t.amt, settings) : '-'}</td>
                                  <td class="text-right text-green">${t.isCredit ? formatCurrency(t.amt, settings) : '-'}</td>
                                  <td class="text-right font-bold text-blue">${formatCurrency(Math.max(0, t.runningBalance), settings)}</td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                          <div style="margin-top: 30px; font-size: 10px; text-align: center; color: #888;">
                            Generated on ${new Date().toLocaleString()}
                          </div>
                          <script>
                            window.onload = function() { window.print(); window.close(); }
                          </script>
                        </body>
                      </html>
                    `;
                    printWindow.document.write(html);
                    printWindow.document.close();
                  }}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
                >
                  🖨 Print Ledger
                </button>
                <button
                  onClick={() => setHistoryCustomer(null)}
                  className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-5 py-2 rounded-lg text-sm font-bold transition-colors"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Edit Tx Modal */}
      {editTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">Edit Payment</h3>
              <button onClick={() => setEditTx(null)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditTransaction} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount</label>
                <input type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value === '' ? '' : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-3" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                <input type="datetime-local" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full border border-gray-200 rounded-lg p-3" required />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold">Update Payment</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
