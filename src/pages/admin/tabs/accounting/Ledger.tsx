import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../../firebase';
import { collection, getDocs, addDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { Transaction, Customer, Vendor, Order, PaymentAccount } from '../../../../types';
import { formatCurrency, cn } from '../../../../lib/utils';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
import { Book, X, User, Download, Printer, Plus, ArrowLeft, Receipt, Check, CreditCard, Filter } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generatePDF } from '../../../../lib/pdf';
import { logAudit } from '../../../../lib/audit';

interface LedgerTabProps {
  selectedLedgerEntity?: { id: string; name: string; type: 'customer' | 'vendor' } | null;
  setSelectedLedgerEntity?: (v: { id: string; name: string; type: 'customer' | 'vendor' } | null) => void;
}

const LedgerTab: React.FC<LedgerTabProps> = ({
  selectedLedgerEntity,
  setSelectedLedgerEntity,
}) => {
  const { hasPermission } = useAuth();
  const { settings } = useSettings();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [generalLedgerFilterType, setGeneralLedgerFilterType] = useState<'daily' | 'monthly'>('daily');
  const [generalLedgerStartDate, setGeneralLedgerStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [generalLedgerEndDate, setGeneralLedgerEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [showLedgerReportModal, setShowLedgerReportModal] = useState<boolean>(false);
  const [ledgerReportModalData, setLedgerReportModalData] = useState<any[]>([]);
  const [ledgerReportType, setLedgerReportType] = useState<'income' | 'expense' | null>(null);

  // Quick Payment Recording State
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [settlementMode, setSettlementMode] = useState<'specific' | 'lump_sum'>('specific');
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [modalProjectFilter, setModalProjectFilter] = useState('all');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const [showEntityDropdown, setShowEntityDropdown] = useState(false);
  const [entitySearchQuery, setEntitySearchQuery] = useState('');
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showEntityDropdown && searchInputRef.current) {
      // Use setTimeout to ensure the element is rendered before focusing
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [showEntityDropdown]);

  const fetchTransactions = async () => {
    try {
      const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load transactions');
    }
  };

  const fetchEntities = async () => {
    try {
      const [cSnap, vSnap, ordSnap, purSnap, accSnap] = await Promise.all([
        getDocs(query(collection(db, 'customers'), orderBy('name'))),
        getDocs(query(collection(db, 'vendors'), orderBy('name'))),
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'purchases')),
        getDocs(collection(db, 'payment_accounts'))
      ]);
      setCustomers(cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));
      setVendors(vSnap.docs.map(d => ({ id: d.id, ...d.data() } as Vendor)));
      setOrders(ordSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      setPurchases(purSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
      setPaymentAccounts(accSnap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentAccount)));
    } catch (err) {
      console.error('Error loading ledger entities:', err);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchEntities();
  }, []);

  // 1. General Ledger Calculations
  const getLedgerData = () => {
    const data: { [key: string]: { date: string; income: number; expense: number; balance: number; details: any[] } } = {};

    transactions.forEach(tx => {
      const txDateStr = new Date(tx.date).toISOString().split('T')[0];
      if (txDateStr >= generalLedgerStartDate && txDateStr <= generalLedgerEndDate) {
        const key = generalLedgerFilterType === 'monthly' ? txDateStr.substring(0, 7) : txDateStr;
        const displayDate =
          generalLedgerFilterType === 'monthly'
            ? new Date(tx.date).toLocaleString('default', { month: 'long', year: 'numeric' })
            : txDateStr;

        if (!data[key]) {
          data[key] = { date: displayDate, income: 0, expense: 0, balance: 0, details: [] };
        }

        const isIncome = ['sale', 'income', 'purchase_return'].includes(tx.type) || (tx.type === 'opening_balance' && tx.entityType === 'customer');
        const isExpense = ['purchase', 'expense', 'salary', 'conveyance', 'sale_return'].includes(tx.type) || (tx.type === 'opening_balance' && tx.entityType === 'vendor');
          
          if (isIncome) {
            data[key].income += tx.amount;
          }
          if (isExpense) {
            data[key].expense += tx.amount;
          }

        data[key].balance = data[key].income - data[key].expense;
        data[key].details.push(tx);
      }
    });

    return Object.keys(data)
      .sort((a, b) => b.localeCompare(a))
      .map(k => data[k]);
  };

  // 2. Entity Party Ledger Calculations
  const getEntityTransactions = () => {
    if (!selectedLedgerEntity) return [];
    return transactions.filter(t => {
      const matchesEntity = t.entityId === selectedLedgerEntity.id || t.entityName === selectedLedgerEntity.name;
      const tDate = new Date(t.date).toISOString().split('T')[0];
      const matchesDate = tDate >= generalLedgerStartDate && tDate <= generalLedgerEndDate;
      return matchesEntity && matchesDate;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const entityTxList = getEntityTransactions();
  const isCustomer = selectedLedgerEntity?.type === 'customer';

  // Calculate Running Balance
  let runningBal = 0;
  const entityLedgerRows = entityTxList.map(tx => {
    const isDebit = isCustomer ? ['sale', 'opening_balance'].includes(tx.type) : ['payment_made', 'purchase_return'].includes(tx.type);
    const isCredit = isCustomer ? ['payment_received', 'money_receipt', 'sale_return', 'return'].includes(tx.type) : ['purchase', 'opening_balance'].includes(tx.type);

    const debitAmt = isDebit ? tx.amount : 0;
    const creditAmt = isCredit ? tx.amount : 0;

    if (isCustomer) {
      runningBal += debitAmt - creditAmt;
    } else {
      runningBal += creditAmt - debitAmt;
    }

    return {
      ...tx,
      debit: debitAmt,
      credit: creditAmt,
      balance: runningBal,
    };
  });

  const totalDebit = entityLedgerRows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredit = entityLedgerRows.reduce((sum, r) => sum + r.credit, 0);
  const finalBalance = isCustomer ? totalDebit - totalCredit : totalCredit - totalDebit;

  // Unpaid Orders & Projects for Customer in Ledger
  const entityUnpaidOrders = useMemo(() => {
    if (!selectedLedgerEntity || selectedLedgerEntity.type !== 'customer') return [];
    return orders.filter(o => {
      if (o.status === 'cancelled') return false;
      const matchesId = o.customerId === selectedLedgerEntity.id;
      const matchesName = o.customerName && selectedLedgerEntity.name && o.customerName.toLowerCase().trim() === selectedLedgerEntity.name.toLowerCase().trim();
      if (!matchesId && !matchesName) return false;
      const total = Number(o.total || 0);
      const paid = Number(o.paidAmount || (o as any).amountPaid || 0);
      return (total - paid) > 0.01;
    }).sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
  }, [selectedLedgerEntity, orders]);

  const entityProjects = useMemo(() => {
    const projs = new Set<string>();
    entityUnpaidOrders.forEach(o => {
      const p = o.projectName || o.branchName;
      if (p) projs.add(p);
    });
    return Array.from(projs);
  }, [entityUnpaidOrders]);

  const displayedUnpaidOrders = useMemo(() => {
    if (modalProjectFilter === 'all') return entityUnpaidOrders;
    return entityUnpaidOrders.filter(o => (o.projectName || o.branchName) === modalProjectFilter);
  }, [entityUnpaidOrders, modalProjectFilter]);

  // Unpaid Purchases for Vendor in Ledger
  const entityUnpaidPurchases = useMemo(() => {
    if (!selectedLedgerEntity || selectedLedgerEntity.type !== 'vendor') return [];
    return purchases.filter(p => {
      const matchesId = p.vendorId === selectedLedgerEntity.id;
      const matchesName = p.vendorName && selectedLedgerEntity.name && p.vendorName.toLowerCase().trim() === selectedLedgerEntity.name.toLowerCase().trim();
      if (!matchesId && !matchesName) return false;
      const total = Number(p.total || p.grandTotal || 0);
      const paid = Number(p.paidAmount || p.paid || 0);
      return (total - paid) > 0.01;
    }).sort((a, b) => new Date(a.createdAt || a.date || 0).getTime() - new Date(b.createdAt || b.date || 0).getTime());
  }, [selectedLedgerEntity, purchases]);

  // Open Payment Modal and initialize state
  const handleOpenPaymentModal = () => {
    if (!selectedLedgerEntity) return;
    setAllocations({});
    setPaymentDescription('');
    setModalProjectFilter('all');
    setPaymentDate(new Date().toISOString().split('T')[0]);

    if (selectedLedgerEntity.type === 'customer') {
      const unpaid = orders.filter(o => {
        if (o.status === 'cancelled') return false;
        const matchesId = o.customerId === selectedLedgerEntity.id;
        const matchesName = o.customerName && selectedLedgerEntity.name && o.customerName.toLowerCase().trim() === selectedLedgerEntity.name.toLowerCase().trim();
        if (!matchesId && !matchesName) return false;
        const total = Number(o.total || 0);
        const paid = Number(o.paidAmount || (o as any).amountPaid || 0);
        return (total - paid) > 0.01;
      });
      if (unpaid.length > 0) {
        setSettlementMode('specific');
        setPaymentAmount(0);
      } else {
        setSettlementMode('lump_sum');
        setPaymentAmount(finalBalance > 0 ? finalBalance : 0);
      }
    } else {
      const unpaid = purchases.filter(p => {
        const matchesId = p.vendorId === selectedLedgerEntity.id;
        const matchesName = p.vendorName && selectedLedgerEntity.name && p.vendorName.toLowerCase().trim() === selectedLedgerEntity.name.toLowerCase().trim();
        if (!matchesId && !matchesName) return false;
        const total = Number(p.total || p.grandTotal || 0);
        const paid = Number(p.paidAmount || p.paid || 0);
        return (total - paid) > 0.01;
      });
      if (unpaid.length > 0) {
        setSettlementMode('specific');
        setPaymentAmount(0);
      } else {
        setSettlementMode('lump_sum');
        setPaymentAmount(finalBalance > 0 ? finalBalance : 0);
      }
    }

    if (paymentAccounts.length > 0 && !paymentAccountId) {
      setPaymentAccountId(paymentAccounts[0].id);
    }
    setIsRecordingPayment(true);
  };

  const handleToggleAllocation = (id: string, maxDue: number) => {
    setAllocations(prev => {
      const next = { ...prev };
      if (next[id] && next[id] > 0) {
        delete next[id];
      } else {
        next[id] = maxDue;
      }
      const totalAlloc = Object.values(next).reduce((s, a) => s + (Number(a) || 0), 0);
      setPaymentAmount(totalAlloc);
      return next;
    });
  };

  const handleAllocationAmountChange = (id: string, amount: number, maxDue: number) => {
    const validAmount = Math.max(0, Math.min(amount, maxDue));
    setAllocations(prev => {
      const next = { ...prev };
      if (validAmount > 0) {
        next[id] = validAmount;
      } else {
        delete next[id];
      }
      const totalAlloc = Object.values(next).reduce((s, a) => s + (Number(a) || 0), 0);
      setPaymentAmount(totalAlloc);
      return next;
    });
  };

  const handleSelectAllAllocations = () => {
    const next: Record<string, number> = {};
    if (selectedLedgerEntity?.type === 'customer') {
      displayedUnpaidOrders.forEach(o => {
        const due = Math.max(0, (Number(o.total) || 0) - (Number(o.paidAmount || (o as any).amountPaid) || 0));
        if (due > 0) next[o.id] = due;
      });
    } else {
      entityUnpaidPurchases.forEach(p => {
        const due = Math.max(0, (Number(p.total || p.grandTotal) || 0) - (Number(p.paidAmount || p.paid) || 0));
        if (due > 0) next[p.id] = due;
      });
    }
    setAllocations(next);
    const totalAlloc = Object.values(next).reduce((s, a) => s + (Number(a) || 0), 0);
    setPaymentAmount(totalAlloc);
  };

  const handleClearAllAllocations = () => {
    setAllocations({});
    setPaymentAmount(0);
  };

  // Handle Recording New Payment / Due Collection
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLedgerEntity) return;
    if (paymentAmount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    try {
      setSubmittingPayment(true);
      const isCust = selectedLedgerEntity.type === 'customer';
      const allocatedEntries = Object.entries(allocations).filter(([_, amt]) => Number(amt) > 0);
      const acc = paymentAccounts.find(a => a.id === paymentAccountId);
      const chosenMethod = acc?.type || paymentMethod || 'cash';
      const dateIso = new Date(paymentDate).toISOString();

      if (settlementMode === 'specific' && allocatedEntries.length > 0) {
        // Specific order/purchase bill settlement
        const settledDocNumbers: string[] = [];

        if (isCust) {
          for (const [ordId, allocAmt] of allocatedEntries) {
            const ord = orders.find(o => o.id === ordId);
            if (!ord) continue;

            const currentPaid = Number(ord.paidAmount || (ord as any).amountPaid || 0);
            const ordTotal = Number(ord.total || 0);
            const newPaid = currentPaid + Number(allocAmt);
            const newStatus = newPaid >= ordTotal ? 'paid' : 'partial';

            await updateDoc(doc(db, 'orders', ordId), {
              paidAmount: newPaid,
              amountPaid: newPaid,
              paymentStatus: newStatus
            });

            const docNum = ord.documentNumber || ord.id;
            settledDocNumbers.push(docNum);
            const projInfo = ord.projectName ? ` [Project: ${ord.projectName}]` : (ord.branchName ? ` [Branch: ${ord.branchName}]` : '');

            await addDoc(collection(db, 'transactions'), {
              type: 'payment_received',
              amount: Number(allocAmt),
              date: dateIso,
              description: paymentDescription 
                ? `${paymentDescription} - Settled Invoice #${docNum}${projInfo}`
                : `Payment received for Invoice #${docNum}${projInfo}`,
              entityId: selectedLedgerEntity.id,
              entityName: selectedLedgerEntity.name,
              entityType: 'customer',
              documentNumber: docNum,
              referenceId: ord.id,
              paymentAccountId: paymentAccountId || '',
              paymentMethod: chosenMethod,
              createdAt: dateIso,
            });
          }

          toast.success(`Payment of ৳${paymentAmount.toLocaleString()} received across ${allocatedEntries.length} invoice(s)!`);
        } else {
          // Vendor specific purchase bills
          for (const [purId, allocAmt] of allocatedEntries) {
            const pur = purchases.find(p => p.id === purId);
            if (!pur) continue;

            const currentPaid = Number(pur.paidAmount || pur.paid || 0);
            const purTotal = Number(pur.total || pur.grandTotal || 0);
            const newPaid = currentPaid + Number(allocAmt);
            const newStatus = newPaid >= purTotal ? 'paid' : 'partial';

            await updateDoc(doc(db, 'purchases', purId), {
              paidAmount: newPaid,
              paid: newPaid,
              paymentStatus: newStatus
            });

            const docNum = pur.billNumber || pur.documentNumber || pur.id;
            settledDocNumbers.push(docNum);

            await addDoc(collection(db, 'transactions'), {
              type: 'payment_made',
              amount: Number(allocAmt),
              date: dateIso,
              description: paymentDescription 
                ? `${paymentDescription} - Paid Purchase Bill #${docNum}`
                : `Paid Purchase Bill #${docNum}`,
              entityId: selectedLedgerEntity.id,
              entityName: selectedLedgerEntity.name,
              entityType: 'vendor',
              documentNumber: docNum,
              referenceId: pur.id,
              paymentAccountId: paymentAccountId || '',
              paymentMethod: chosenMethod,
              createdAt: dateIso,
            });
          }

          toast.success(`Payment of ৳${paymentAmount.toLocaleString()} paid across ${allocatedEntries.length} bill(s)!`);
        }

        // Receipt/Voucher PDF
        const savedTx = {
          id: `${isCust ? 'REC' : 'VOU'}-${Date.now().toString().slice(-6)}`,
          referenceId: `${isCust ? 'REC' : 'VOU'}-${Date.now().toString().slice(-6)}`,
          type: isCust ? 'payment_received' : 'payment_made',
          amount: Number(paymentAmount),
          date: dateIso,
          description: `Settled ${allocatedEntries.length} ${isCust ? 'invoice(s)' : 'purchase bill(s)'}: ${settledDocNumbers.join(', ')}`,
          entityId: selectedLedgerEntity.id,
          entityName: selectedLedgerEntity.name,
          paymentMethod: chosenMethod,
          _autoPrint: true
        };
        try {
          generatePDF(savedTx as any, 'receipt', settings);
        } catch (err) {
          console.error('Failed to generate receipt PDF', err);
        }

        // Audit Log
        await logAudit(
          'CREATE',
          'Payment',
          `${isCust ? 'Received customer' : 'Paid vendor'} bill-wise payment of ৳${paymentAmount} for "${selectedLedgerEntity.name}" across ${allocatedEntries.length} document(s): ${settledDocNumbers.join(', ')} (${chosenMethod})`,
          (settings as any)?.companyName || 'Admin',
          {
            entityId: selectedLedgerEntity.id,
            previousState: { due: finalBalance },
            newState: {
              due: Math.max(0, finalBalance - paymentAmount),
              amount: Number(paymentAmount),
              settledDocs: settledDocNumbers
            }
          }
        );
      } else {
        // Lump Sum Payment (General / FIFO fallback)
        const type = isCust ? 'payment_received' : 'payment_made';
        const newTx = {
          date: dateIso,
          amount: Number(paymentAmount),
          type,
          paymentMethod: chosenMethod,
          paymentAccountId: paymentAccountId || '',
          description: paymentDescription || `${isCust ? 'Received from' : 'Paid to'} ${selectedLedgerEntity.name} (General / Lump Sum)`,
          entityId: selectedLedgerEntity.id,
          entityName: selectedLedgerEntity.name,
          entityType: selectedLedgerEntity.type,
          createdAt: dateIso,
        };

        const txRef = await addDoc(collection(db, 'transactions'), newTx);

        // Auto FIFO sync
        try {
          let remPay = Number(paymentAmount);
          if (isCust) {
            for (const ord of entityUnpaidOrders) {
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
          } else {
            for (const pur of entityUnpaidPurchases) {
              if (remPay <= 0) break;
              const dueOnPur = (Number(pur.total || pur.grandTotal) || 0) - (Number(pur.paidAmount || pur.paid) || 0);
              const payAmt = Math.min(remPay, dueOnPur);
              const updatedPaid = (Number(pur.paidAmount || pur.paid) || 0) + payAmt;
              const updatedStatus = updatedPaid >= (Number(pur.total || pur.grandTotal) || 0) ? 'paid' : 'partial';
              await updateDoc(doc(db, 'purchases', pur.id), {
                paidAmount: updatedPaid,
                paid: updatedPaid,
                paymentStatus: updatedStatus
              });
              remPay -= payAmt;
            }
          }
        } catch (err) {
          console.warn('FIFO sync error:', err);
        }

        const savedTx = { id: txRef.id, referenceId: `${isCust ? 'REC' : 'VOU'}-${Date.now().toString().slice(-6)}`, ...newTx, _autoPrint: true };
        try {
          generatePDF(savedTx as any, 'receipt', settings);
        } catch (err) {
          console.error('Failed to generate receipt PDF', err);
        }

        await logAudit(
          'CREATE',
          'Payment',
          `${isCust ? 'Received customer' : 'Paid vendor'} payment of ৳${paymentAmount} for "${selectedLedgerEntity.name}" (${chosenMethod})`,
          (settings as any)?.companyName || 'Admin',
          {
            entityId: selectedLedgerEntity.id,
            previousState: { due: finalBalance },
            newState: {
              due: Math.max(0, finalBalance - paymentAmount),
              amount: Number(paymentAmount)
            }
          }
        );

        toast.success('Payment recorded successfully!');
      }

      setIsRecordingPayment(false);
      setAllocations({});
      setPaymentAmount(0);
      setPaymentDescription('');
      fetchTransactions();
      fetchEntities();
    } catch (err) {
      console.error(err);
      toast.error('Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Export Entity Statement to CSV
  const exportEntityCSV = () => {
    if (!selectedLedgerEntity || entityLedgerRows.length === 0) {
      toast.error('No statement records to export');
      return;
    }
    const headers = ['Date', 'Type', 'Description', 'Method', 'Debit', 'Credit', 'Balance'];
    const rows = entityLedgerRows.map(r => [
      new Date(r.date).toLocaleDateString(),
      r.type,
      `"${r.description || ''}"`,
      r.paymentMethod || 'cash',
      r.debit,
      r.credit,
      r.balance,
    ]);
    const csv = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedLedgerEntity.name}_statement_${generalLedgerStartDate}_to_${generalLedgerEndDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Export Entity Statement to PDF
  const exportEntityPDF = () => {
    if (!selectedLedgerEntity || entityLedgerRows.length === 0) {
      toast.error('No statement records to export');
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(settings?.siteName || 'Click2IT', 14, 18);
    doc.setFontSize(11);
    doc.text(`Account Statement: ${selectedLedgerEntity.name} (${selectedLedgerEntity.type.toUpperCase()})`, 14, 25);
    doc.setFontSize(9);
    doc.text(`Period: ${generalLedgerStartDate} to ${generalLedgerEndDate} | Generated: ${new Date().toLocaleDateString()}`, 14, 31);

    const body = entityLedgerRows.map(r => [
      new Date(r.date).toLocaleDateString(),
      r.type.replace('_', ' ').toUpperCase(),
      r.description || '-',
      r.paymentMethod || 'cash',
      r.debit > 0 ? formatCurrency(r.debit, settings) : '-',
      r.credit > 0 ? formatCurrency(r.credit, settings) : '-',
      formatCurrency(r.balance, settings),
    ]);

    autoTable(doc, {
      startY: 36,
      head: [['Date', 'Type', 'Description', 'Method', 'Debit', 'Credit', 'Balance']],
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [8, 22, 33] },
      styles: { fontSize: 8 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Total Debit: ${formatCurrency(totalDebit, settings)}`, 14, finalY);
    doc.text(`Total Credit: ${formatCurrency(totalCredit, settings)}`, 14, finalY + 6);
    doc.text(`Net Outstanding Balance: ${formatCurrency(finalBalance, settings)}`, 14, finalY + 12);

    doc.save(`${selectedLedgerEntity.name}_Statement.pdf`);
  };

  if (!hasPermission('manage_finances')) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden space-y-6">
      {/* ── Top Bar ── */}
      <div className="p-6 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {selectedLedgerEntity && (
            <button
              onClick={() => setSelectedLedgerEntity && setSelectedLedgerEntity(null)}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-all"
              title="Back to General Ledger"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Book className="text-[#EF4444]" />
              {selectedLedgerEntity ? `${selectedLedgerEntity.name}'s Statement` : 'General Accounting Ledger'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {selectedLedgerEntity
                ? `Individual ${selectedLedgerEntity.type} party ledger with debits, credits, and running balance.`
                : 'Double-entry debit/credit journals, monthly aggregates, and party statements.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Party Picker Dropdown (Searchable) */}
          <div className="relative">
            <div 
              className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setShowEntityDropdown(!showEntityDropdown)}
            >
              <User size={14} className="text-gray-400" />
              <div className="text-xs font-bold text-gray-800 select-none whitespace-nowrap min-w-[150px]">
                {selectedLedgerEntity ? `${selectedLedgerEntity.name} (${selectedLedgerEntity.type})` : '-- All (General Ledger) --'}
              </div>
            </div>

            {showEntityDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowEntityDropdown(false)}
                ></div>
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 shadow-xl rounded-lg z-50 flex flex-col overflow-hidden" style={{ maxHeight: '400px' }}>
                  <div className="p-2 border-b border-gray-100 bg-gray-50">
                   <input
                     ref={searchInputRef}
                     type="text"
                     placeholder="Search party by name..."
                     className="w-full text-xs p-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#EF4444] bg-white text-gray-800"
                     value={entitySearchQuery}
                     onChange={e => setEntitySearchQuery(e.target.value)}
                   />
                </div>
                <div className="overflow-y-auto p-1 text-xs bg-white">
                  <div 
                    className="p-2 hover:bg-red-50 cursor-pointer font-bold text-gray-800 rounded mb-1 transition-colors"
                    onClick={() => {
                      if (setSelectedLedgerEntity) setSelectedLedgerEntity(null);
                      setShowEntityDropdown(false);
                      setEntitySearchQuery('');
                    }}
                  >
                    -- All (General Ledger) --
                  </div>
                  
                  {customers.filter(c => c.name.toLowerCase().includes(entitySearchQuery.toLowerCase())).length > 0 && (
                    <div className="font-black text-[10px] text-gray-400 uppercase mt-2 px-2 mb-1">Customers</div>
                  )}
                  {customers.filter(c => c.name.toLowerCase().includes(entitySearchQuery.toLowerCase())).map(c => (
                     <div 
                       key={`c-${c.id}`} 
                       className="p-2 hover:bg-gray-100 cursor-pointer rounded flex items-center gap-2 transition-colors"
                       onClick={() => {
                         if (setSelectedLedgerEntity) setSelectedLedgerEntity({ id: c.id, name: c.name, type: 'customer' });
                         setShowEntityDropdown(false);
                         setEntitySearchQuery('');
                       }}
                     >
                       <span>👤</span> <span className="font-medium text-gray-700">{c.name}</span>
                     </div>
                  ))}
                  
                  {vendors.filter(v => v.name.toLowerCase().includes(entitySearchQuery.toLowerCase())).length > 0 && (
                    <div className="font-black text-[10px] text-gray-400 uppercase mt-2 px-2 mb-1">Vendors / Suppliers</div>
                  )}
                  {vendors.filter(v => v.name.toLowerCase().includes(entitySearchQuery.toLowerCase())).map(v => (
                     <div 
                       key={`v-${v.id}`} 
                       className="p-2 hover:bg-gray-100 cursor-pointer rounded flex items-center gap-2 transition-colors"
                       onClick={() => {
                         if (setSelectedLedgerEntity) setSelectedLedgerEntity({ id: v.id, name: v.name, type: 'vendor' });
                         setShowEntityDropdown(false);
                         setEntitySearchQuery('');
                       }}
                     >
                       <span>🏢</span> <span className="font-medium text-gray-700">{v.name}</span>
                     </div>
                  ))}
                  
                  {(customers.filter(c => c.name.toLowerCase().includes(entitySearchQuery.toLowerCase())).length === 0 && 
                    vendors.filter(v => v.name.toLowerCase().includes(entitySearchQuery.toLowerCase())).length === 0) && (
                      <div className="p-3 text-center text-gray-400 italic font-medium">No matches found</div>
                  )}
                </div>
              </div>
              </>
            )}
          </div>

          {/* Date Pickers */}
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
            <label className="text-[10px] font-bold text-gray-500 uppercase">From</label>
            <input
              type="date"
              value={generalLedgerStartDate}
              onChange={e => setGeneralLedgerStartDate(e.target.value)}
              className="border-none bg-transparent text-xs font-bold text-gray-800 p-0 focus:ring-0"
            />
          </div>
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
            <label className="text-[10px] font-bold text-gray-500 uppercase">To</label>
            <input
              type="date"
              value={generalLedgerEndDate}
              onChange={e => setGeneralLedgerEndDate(e.target.value)}
              className="border-none bg-transparent text-xs font-bold text-gray-800 p-0 focus:ring-0"
            />
          </div>
        </div>
      </div>

      {/* ── VIEW 1: Individual Entity Party Ledger ── */}
      {selectedLedgerEntity ? (
        <div className="space-y-6">
          {/* Entity Summary Banner */}
          <div className="mx-6 p-4 rounded-xl bg-gradient-to-r from-[#081621] to-[#122b3f] text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-300 border border-red-400/30">
                  {selectedLedgerEntity.type} Account
                </span>
                <span className="text-xs text-gray-300">ID: #{selectedLedgerEntity.id.slice(0, 8)}</span>
              </div>
              <h3 className="text-2xl font-black mt-1">{selectedLedgerEntity.name}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleOpenPaymentModal}
                className="bg-[#EF4444] hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Plus size={14} /> {isCustomer ? 'Collect Due / Receive' : 'Make Payment'}
              </button>
              <button
                onClick={exportEntityCSV}
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <Download size={14} /> CSV
              </button>
              <button
                onClick={exportEntityPDF}
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <Printer size={14} /> PDF Statement
              </button>
            </div>
          </div>

          {/* KPI Cards for Entity */}
          <div className="px-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Total Billed (Debit)</span>
              <span className="text-xl font-black text-blue-900 mt-1 block">{formatCurrency(totalDebit, settings)}</span>
            </div>
            <div className="bg-green-50/70 border border-green-100 rounded-xl p-4">
              <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider block">Total Paid (Credit)</span>
              <span className="text-xl font-black text-green-900 mt-1 block">{formatCurrency(totalCredit, settings)}</span>
            </div>
            <div className={cn(
              "border rounded-xl p-4",
              finalBalance > 0 ? "bg-amber-50/70 border-amber-200" : "bg-emerald-50/70 border-emerald-200"
            )}>
              <span className="text-[10px] font-bold uppercase tracking-wider block text-gray-600">
                {isCustomer ? 'Due Outstanding' : 'Payable Outstanding'}
              </span>
              <span className={cn(
                "text-xl font-black mt-1 block",
                finalBalance > 0 ? "text-amber-700" : "text-emerald-700"
              )}>
                {formatCurrency(finalBalance, settings)}
              </span>
            </div>
          </div>

          {/* Bill-Wise Due Settlement Modal */}
          {isRecordingPayment && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh] border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-[#081621] via-indigo-950 to-[#081621] text-white">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-400/20">
                      <Receipt size={18} />
                    </div>
                    <div>
                      <h3 className="font-black text-base tracking-tight text-white flex items-center gap-2">
                        {isCustomer ? 'Receive Due Payment from Customer' : 'Make Payment to Supplier / Vendor'}
                      </h3>
                      <span className="text-[11px] text-slate-300">
                        {isCustomer 
                          ? 'Settle outstanding customer dues by specific invoice or lump sum' 
                          : 'Settle outstanding supplier dues by specific purchase bill or lump sum'}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setIsRecordingPayment(false);
                      setAllocations({});
                    }} 
                    className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSavePayment} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
                  {/* Entity Info Card */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        {selectedLedgerEntity.type} Account
                      </span>
                      <div className="font-black text-base text-slate-900 mt-0.5">{selectedLedgerEntity.name}</div>
                      <span className="text-[11px] text-slate-500">
                        {isCustomer 
                          ? `${entityUnpaidOrders.length} unpaid / partial invoice(s) on file`
                          : `${entityUnpaidPurchases.length} unpaid / partial bill(s) on file`}
                      </span>
                    </div>
                    <div className="bg-white border border-rose-200 px-4 py-2 rounded-xl text-right shadow-2xs">
                      <span className="text-[10px] font-bold text-rose-600 block uppercase">Current Ledger Due</span>
                      <span className="font-black text-lg text-rose-700">{formatCurrency(finalBalance, settings)}</span>
                    </div>
                  </div>

                  {/* Settlement Mode Switcher */}
                  <div className="flex border border-slate-200 bg-slate-100/70 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setSettlementMode('specific')}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                        settlementMode === 'specific'
                          ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      <Receipt size={14} /> 
                      {isCustomer 
                        ? `Pay by Specific Invoice / Project (${entityUnpaidOrders.length})` 
                        : `Pay by Specific Purchase Bill (${entityUnpaidPurchases.length})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSettlementMode('lump_sum');
                        setPaymentAmount(finalBalance > 0 ? finalBalance : 0);
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

                  {/* Specific Document Table */}
                  {settlementMode === 'specific' && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                      <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-xs">
                            {isCustomer ? 'Unpaid Customer Invoices' : 'Unpaid Purchase Bills'}
                          </span>
                          {isCustomer && entityProjects.length > 1 && (
                            <select
                              value={modalProjectFilter}
                              onChange={e => setModalProjectFilter(e.target.value)}
                              className="text-[11px] font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                            >
                              <option value="all">All Projects / Branches ({entityUnpaidOrders.length})</option>
                              {entityProjects.map((p, idx) => (
                                <option key={idx} value={p}>Project: {p}</option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSelectAllAllocations}
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

                      {/* Items */}
                      {isCustomer ? (
                        displayedUnpaidOrders.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 bg-slate-50/50">
                            <Receipt size={24} className="mx-auto mb-1 text-slate-400 opacity-50" />
                            <p className="font-bold text-xs">No unpaid invoices found for this customer.</p>
                            <p className="text-[11px] text-slate-500 mt-1">Switch to "General / Lump Sum Payment" to record a direct payment.</p>
                          </div>
                        ) : (
                          <div className="max-h-60 overflow-y-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-slate-100/70 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 sticky top-0 bg-slate-100">
                                <tr>
                                  <th className="py-2 px-3 text-center w-8">#</th>
                                  <th className="py-2 px-3">Invoice & Date</th>
                                  <th className="py-2 px-3">Project / Branch</th>
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
                                  const isAllocated = (allocations[o.id] || 0) > 0;
                                  const currentAlloc = allocations[o.id] || '';
                                  const projName = o.projectName || o.branchName || '';

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
                                          onChange={() => handleToggleAllocation(o.id, ordDue)}
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
                                          <span className="text-slate-400 text-[10px]">Main Store</span>
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
                        )
                      ) : (
                        entityUnpaidPurchases.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 bg-slate-50/50">
                            <Receipt size={24} className="mx-auto mb-1 text-slate-400 opacity-50" />
                            <p className="font-bold text-xs">No active unpaid purchase bills found for this vendor.</p>
                            <p className="text-[11px] text-slate-500 mt-1">Switch to "General / Lump Sum Payment" to record a direct payment.</p>
                          </div>
                        ) : (
                          <div className="max-h-60 overflow-y-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-slate-100/70 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 sticky top-0 bg-slate-100">
                                <tr>
                                  <th className="py-2 px-3 text-center w-8">#</th>
                                  <th className="py-2 px-3">Bill # & Date</th>
                                  <th className="py-2 px-3">Items</th>
                                  <th className="py-2 px-3 text-right">Bill Total</th>
                                  <th className="py-2 px-3 text-right">Paid</th>
                                  <th className="py-2 px-3 text-right">Due</th>
                                  <th className="py-2 px-3 text-right w-36">Pay Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {entityUnpaidPurchases.map(p => {
                                  const tot = Number(p.total || p.grandTotal || 0);
                                  const pd = Number(p.paidAmount || p.paid || 0);
                                  const purDue = Math.max(0, tot - pd);
                                  const isAllocated = (allocations[p.id] || 0) > 0;
                                  const currentAlloc = allocations[p.id] || '';
                                  const docNum = p.billNumber || p.documentNumber || p.id;
                                  const dateStr = p.date || p.createdAt;

                                  return (
                                    <tr 
                                      key={p.id} 
                                      className={cn(
                                        "transition-colors",
                                        isAllocated ? "bg-blue-50/40" : "hover:bg-slate-50"
                                      )}
                                    >
                                      <td className="py-2 px-3 text-center">
                                        <input
                                          type="checkbox"
                                          checked={isAllocated}
                                          onChange={() => handleToggleAllocation(p.id, purDue)}
                                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                      </td>
                                      <td className="py-2 px-3">
                                        <span className="font-black text-slate-900 block">{docNum}</span>
                                        <span className="text-[10px] text-slate-400">
                                          {dateStr ? new Date(dateStr).toLocaleDateString('en-GB') : 'N/A'}
                                        </span>
                                      </td>
                                      <td className="py-2 px-3 text-slate-600">
                                        {p.items?.length ? `${p.items.length} item(s)` : '-'}
                                      </td>
                                      <td className="py-2 px-3 text-right font-medium text-slate-700">
                                        {formatCurrency(tot, settings)}
                                      </td>
                                      <td className="py-2 px-3 text-right text-emerald-600 font-bold">
                                        {formatCurrency(pd, settings)}
                                      </td>
                                      <td className="py-2 px-3 text-right font-black text-rose-600">
                                        {formatCurrency(purDue, settings)}
                                      </td>
                                      <td className="py-2 px-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            max={purDue}
                                            placeholder="0"
                                            value={currentAlloc}
                                            onChange={(e) => handleAllocationAmountChange(p.id, Number(e.target.value), purDue)}
                                            className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-md text-right font-black text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => handleAllocationAmountChange(p.id, purDue, purDue)}
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
                        )
                      )}

                      {/* Allocation Bottom Summary */}
                      {Object.keys(allocations).length > 0 && (
                        <div className="p-3 bg-blue-50/80 border-t border-blue-200 flex items-center justify-between font-bold text-xs">
                          <span className="text-blue-900 flex items-center gap-1.5">
                            <Check size={14} className="text-blue-700" />
                            Selected for settlement: {Object.values(allocations).filter(v => v > 0).length} document(s)
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
                        {settlementMode === 'specific' ? 'Total Settlement Amount (৳)' : 'Payment Amount (৳)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={paymentAmount || ''}
                        onChange={(e) => {
                          setPaymentAmount(e.target.value === '' ? 0 : Number(e.target.value));
                        }}
                        placeholder="Enter amount"
                        className="w-full border border-slate-200 rounded-xl p-2.5 font-black text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        required
                      />
                      {settlementMode === 'lump_sum' && finalBalance > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <button
                            type="button"
                            onClick={() => setPaymentAmount(finalBalance)}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                          >
                            Full Due ({formatCurrency(finalBalance, settings)})
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentAmount(Math.round(finalBalance / 2))}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                          >
                            50% Due
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Payment Account / Method
                      </label>
                      {paymentAccounts.length > 0 ? (
                        <select
                          value={paymentAccountId}
                          onChange={(e) => {
                            setPaymentAccountId(e.target.value);
                            const acc = paymentAccounts.find(a => a.id === e.target.value);
                            if (acc) setPaymentMethod(acc.type || 'cash');
                          }}
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
                      ) : (
                        <select
                          value={paymentMethod}
                          onChange={e => setPaymentMethod(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                        >
                          <option value="cash">Cash</option>
                          <option value="bank">Bank Transfer</option>
                          <option value="bkash">bKash</option>
                          <option value="nagad">Nagad</option>
                          <option value="card">Card / POS</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Date</label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={e => setPaymentDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Note / Reference / Cheque No. (Optional)
                      </label>
                      <input
                        type="text"
                        value={paymentDescription}
                        onChange={e => setPaymentDescription(e.target.value)}
                        placeholder="e.g., Money receipt #MR-001 / Cheque #..."
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecordingPayment(false);
                        setAllocations({});
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingPayment || paymentAmount <= 0}
                      className="bg-[#EF4444] hover:bg-red-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-black text-xs transition-all shadow-md shadow-red-900/20 flex items-center gap-2 cursor-pointer"
                    >
                      {submittingPayment 
                        ? 'Processing...' 
                        : isCustomer 
                          ? `Confirm Receipt (${formatCurrency(paymentAmount || 0, settings)})`
                          : `Confirm Payment (${formatCurrency(paymentAmount || 0, settings)})`}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Statement Table */}
          <div className="overflow-x-auto border-t border-gray-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Transaction Type</th>
                  <th className="px-6 py-3.5">Description / Ref</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5 text-right">Debit (৳)</th>
                  <th className="px-6 py-3.5 text-right">Credit (৳)</th>
                  <th className="px-6 py-3.5 text-right">Running Balance (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entityLedgerRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">
                      No transaction records found for this {selectedLedgerEntity.type} in the selected date range.
                    </td>
                  </tr>
                ) : (
                  entityLedgerRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5 text-gray-500">{new Date(row.date).toLocaleDateString()}</td>
                      <td className="px-6 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-700">
                          {row.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-medium text-gray-800">{row.description || '-'}</td>
                      <td className="px-6 py-3.5 text-gray-500 uppercase text-[10px]">{row.paymentMethod || 'cash'}</td>
                      <td className="px-6 py-3.5 text-right font-medium text-blue-600">
                        {row.debit > 0 ? formatCurrency(row.debit, settings) : '-'}
                      </td>
                      <td className="px-6 py-3.5 text-right font-medium text-green-600">
                        {row.credit > 0 ? formatCurrency(row.credit, settings) : '-'}
                      </td>
                      <td className={cn(
                        "px-6 py-3.5 text-right font-bold",
                        row.balance > 0 ? "text-amber-600" : "text-gray-900"
                      )}>
                        {formatCurrency(row.balance, settings)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {entityLedgerRows.length > 0 && (
                <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-right uppercase text-[10px] text-gray-500 tracking-wider">Total</td>
                    <td className="px-6 py-4 text-right text-blue-700">{formatCurrency(totalDebit, settings)}</td>
                    <td className="px-6 py-4 text-right text-green-700">{formatCurrency(totalCredit, settings)}</td>
                    <td className="px-6 py-4 text-right text-red-600 text-sm">{formatCurrency(finalBalance, settings)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      ) : (
        /* ── VIEW 2: General Ledger (Daily / Monthly) ── */
        <div className="space-y-6">
          {/* Daily/Monthly Filter Switches */}
          <div className="px-6 flex items-center justify-between">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setGeneralLedgerFilterType('daily')}
                className={cn(
                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                  generalLedgerFilterType === 'daily' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Daily View
              </button>
              <button
                onClick={() => setGeneralLedgerFilterType('monthly')}
                className={cn(
                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                  generalLedgerFilterType === 'monthly' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Monthly Summary
              </button>
            </div>
          </div>

          {/* Income / Expense Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6">
            <button
              onClick={() => {
                const allDetails = getLedgerData().flatMap(item => item.details);
                setLedgerReportModalData(
                  allDetails.filter(tx => ['sale', 'income', 'purchase_return', 'opening_balance'].includes(tx.type))
                );
                setLedgerReportType('income');
                setShowLedgerReportModal(true);
              }}
              className="bg-green-50/60 border border-green-100 p-4 rounded-xl flex flex-col hover:shadow-md transition-shadow text-left"
            >
              <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1">Total Income (Credit)</span>
              <span className="text-2xl font-black text-green-700">
                {formatCurrency(getLedgerData().reduce((sum, item) => sum + item.income, 0), settings)}
              </span>
              <span className="text-[10px] text-green-600 mt-1">Click to view credit breakdown</span>
            </button>

            <button
              onClick={() => {
                const allDetails = getLedgerData().flatMap(item => item.details);
                setLedgerReportModalData(
                  allDetails.filter(tx => !['sale', 'payment_received', 'money_receipt', 'income', 'purchase_return'].includes(tx.type))
                );
                setLedgerReportType('expense');
                setShowLedgerReportModal(true);
              }}
              className="bg-red-50/60 border border-red-100 p-4 rounded-xl flex flex-col hover:shadow-md transition-shadow text-left"
            >
              <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1">Total Expenditure (Debit)</span>
              <span className="text-2xl font-black text-red-700">
                {formatCurrency(getLedgerData().reduce((sum, item) => sum + item.expense, 0), settings)}
              </span>
              <span className="text-[10px] text-red-600 mt-1">Click to view debit breakdown</span>
            </button>

            <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-xl flex flex-col">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1">Net Balance</span>
              <span className="text-2xl font-black text-blue-700">
                {formatCurrency(getLedgerData().reduce((sum, item) => sum + item.balance, 0), settings)}
              </span>
              <span className="text-[10px] text-blue-600 mt-1">Surplus / Deficit</span>
            </div>
          </div>

          {/* General Ledger Table */}
          <div className="overflow-x-auto border-t border-gray-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5">Date / Period</th>
                  <th className="px-6 py-3.5 text-right">Income (Credit)</th>
                  <th className="px-6 py-3.5 text-right">Expenditure (Debit)</th>
                  <th className="px-6 py-3.5 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {getLedgerData().map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-gray-800">{row.date}</td>
                    <td className="px-6 py-3.5 text-right font-medium text-green-600">{formatCurrency(row.income, settings)}</td>
                    <td className="px-6 py-3.5 text-right font-medium text-red-600">{formatCurrency(row.expense, settings)}</td>
                    <td className={cn("px-6 py-3.5 text-right font-bold", row.balance >= 0 ? "text-blue-600" : "text-red-600")}>
                      {formatCurrency(row.balance, settings)}
                    </td>
                  </tr>
                ))}
                {getLedgerData().length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">No ledger records found for the selected period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Drill-down Modal */}
          {showLedgerReportModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#081621] text-white">
                  <h2 className="text-lg font-bold capitalize">{ledgerReportType} Breakdown Details</h2>
                  <button onClick={() => setShowLedgerReportModal(false)} className="text-gray-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>
                <div className="overflow-y-auto p-6 text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-bold">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Method</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ledgerReportModalData.map((tx, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-gray-500">{new Date(tx.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{tx.description || '-'}</td>
                          <td className="px-4 py-3 capitalize">{tx.type.replace('_', ' ')}</td>
                          <td className="px-4 py-3 uppercase text-[10px]">{tx.paymentMethod || 'cash'}</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(tx.amount, settings)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-gray-100 flex justify-end">
                  <button onClick={() => setShowLedgerReportModal(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md font-bold text-xs">
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LedgerTab;
