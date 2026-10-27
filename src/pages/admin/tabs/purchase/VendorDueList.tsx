import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, getDoc, addDoc, doc, updateDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { toast } from 'react-hot-toast';
import { useSettings } from '../../../../context/SettingsContext';
import { formatCurrency, cn } from '../../../../lib/utils';
import { Search, CreditCard, X, Check, Receipt, Filter } from 'lucide-react';
import { generatePDF } from '../../../../lib/pdf';
import { Vendor, Transaction, PaymentAccount } from '../../../../types';

import { where } from 'firebase/firestore';
import { useAuth } from '../../../../context/AuthContext';
import { logAudit } from '../../../../lib/audit';

export default function VendorDueList() {
  const { profile, user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedVendor, setSelectedVendor] = useState<{ id: string, name: string, due: number } | null>(null);
  const [historyVendor, setHistoryVendor] = useState<{ id: string, name: string } | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState<number | ''>('');
  const [editDate, setEditDate] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Bill-wise Due Settlement state
  const [settlementMode, setSettlementMode] = useState<'bill' | 'lump_sum'>('bill');
  const [purchaseAllocations, setPurchaseAllocations] = useState<Record<string, number>>({});

  // Opening Balance state
  const [showOpeningBalForm, setShowOpeningBalForm] = useState(false);
  const [obAmount, setObAmount] = useState<number | ''>('');
  const [obDate, setObDate] = useState('2026-01-01');
  const [obDescription, setObDescription] = useState('Previous outstanding balance');
  const [obSubmitting, setObSubmitting] = useState(false);

  const { settings } = useSettings();

  
  const handleViewInvoice = async (documentNumber: string) => {
    try {
      // 1. Try purchases collection
      let q = query(collection(db, 'purchases'), where('billNumber', '==', documentNumber));
      let snap = await getDocs(q);
      if (snap.empty) {
        q = query(collection(db, 'purchases'), where('documentNumber', '==', documentNumber));
        snap = await getDocs(q);
      }
      if (!snap.empty) {
        const pur = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
        const pseudoOrder: any = {
          id: pur.id,
          documentNumber: pur.billNumber || pur.documentNumber || documentNumber,
          customerName: pur.vendorName || 'Vendor',
          customerPhone: pur.vendorPhone || '',
          customerAddress: pur.vendorAddress || '',
          items: pur.items || [],
          total: pur.total || pur.grandTotal || 0,
          amountPaid: pur.paid || 0,
          due: (pur.total || 0) - (pur.paid || 0),
          createdAt: pur.date || pur.createdAt || new Date().toISOString(),
          paymentMethod: pur.paymentMethod || 'cash',
          type: 'purchase'
        };
        generatePDF(pseudoOrder as any, 'invoice', settings);
        return;
      }

      // Check purchase direct doc id
      const purDocSnap = await getDoc(doc(db, 'purchases', documentNumber));
      if (purDocSnap.exists()) {
        const pur = { id: purDocSnap.id, ...purDocSnap.data() } as any;
        const pseudoOrder: any = {
          id: pur.id,
          documentNumber: pur.billNumber || pur.documentNumber || documentNumber,
          customerName: pur.vendorName || 'Vendor',
          customerPhone: pur.vendorPhone || '',
          customerAddress: pur.vendorAddress || '',
          items: pur.items || [],
          total: pur.total || pur.grandTotal || 0,
          amountPaid: pur.paid || 0,
          due: (pur.total || 0) - (pur.paid || 0),
          createdAt: pur.date || pur.createdAt || new Date().toISOString(),
          paymentMethod: pur.paymentMethod || 'cash',
          type: 'purchase'
        };
        generatePDF(pseudoOrder as any, 'invoice', settings);
        return;
      }

      // 2. Fallback to orders collection
      const orderQ = query(collection(db, 'orders'), where('documentNumber', '==', documentNumber));
      const orderSnap = await getDocs(orderQ);
      if (!orderSnap.empty) {
        const order = { id: orderSnap.docs[0].id, ...orderSnap.docs[0].data() };
        generatePDF(order as any, 'invoice', settings);
        return;
      }

      const orderDocSnap = await getDoc(doc(db, 'orders', documentNumber));
      if (orderDocSnap.exists()) {
        const order = { id: orderDocSnap.id, ...orderDocSnap.data() };
        generatePDF(order as any, 'invoice', settings);
        return;
      }

      toast.error('Invoice not found');
    } catch (e) {
      console.error('Failed to view invoice:', e);
      toast.error('Failed to view invoice');
    }
  };
  const fetchData = async () => {
    try {
      setLoading(true);
      const [custSnap, txSnap, accSnap, purSnap] = await Promise.all([
        getDocs(collection(db, 'vendors')),
        getDocs(query(collection(db, 'transactions'), orderBy('date', 'desc'))),
        getDocs(collection(db, 'payment_accounts')),
        getDocs(collection(db, 'purchases'))
      ]);

      setVendors(custSnap.docs.map(d => ({ id: d.id, ...d.data() } as Vendor)));

      // Safely preserve all transactions without deleting anything
      const allTxList: Transaction[] = txSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      setTransactions(allTxList);
      
      const allAccs = accSnap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentAccount));
      setPaymentAccounts(allAccs);

      const allPurchases = purSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPurchases(allPurchases);
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

  // Calculate dues
  // A positive balance indicates the vendor owes us money (Due)
  const calculateDues = () => {
    const balances: Record<string, number> = {};
    
    transactions.forEach(t => {
      const isVendorTx = t.entityType === 'vendor' || (!t.entityType && t.type === 'purchase_return');
      if (isVendorTx && t.entityId) {
        if (!balances[t.entityId]) balances[t.entityId] = 0;
        
        if (t.type === 'purchase' || t.type === 'opening_balance') {
          balances[t.entityId] += Number(t.amount);
        } else if (t.type === 'payment_made' || ((t.type === 'purchase_return' || t.type === 'return') && (t.paymentMethod === 'supplier_credit' || !t.paymentMethod || t.paymentMethod === 'credit'))) {
          balances[t.entityId] -= Number(t.amount);
        }
      }
    });

    const dueList = vendors
      .map(c => ({
        ...c,
        due: balances[c.id] || 0
      }))
      .filter(c => c.due > 0)
      .sort((a, b) => b.due - a.due);

    return dueList;
  };

  const dueVendors = calculateDues().filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone && c.phone.includes(searchTerm))
  );

  const totalOverallDue = dueVendors.reduce((acc, curr) => acc + curr.due, 0);

  
  const handleDeleteTransaction = async (txId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this transaction? This will alter the ledger balance.")) return;
    try {
      await deleteDoc(doc(db, 'transactions', txId));
      await logAudit(
        'DELETE',
        'Payment',
        `Deleted transaction #${txId.slice(0, 8)} from ledger for vendor "${historyVendor?.name || 'Vendor'}"`,
        profile?.displayName || user?.displayName || user?.email || 'Admin',
        { entityId: txId }
      );
      toast.success('Transaction deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };

  const handleAddOpeningBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!historyVendor || !obAmount || Number(obAmount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    try {
      setObSubmitting(true);
      await addDoc(collection(db, 'transactions'), {
        type: 'opening_balance',
        entityId: historyVendor.id,
        entityName: historyVendor.name,
        entityType: 'vendor',
        amount: Number(obAmount),
        date: new Date(obDate).toISOString(),
        description: obDescription || 'Previous outstanding balance',
        paymentMethod: 'n/a',
        createdAt: new Date().toISOString(),
      });
      await logAudit(
        'CREATE',
        'Payment',
        `Added opening balance of ৳${obAmount} for vendor "${historyVendor.name}"`,
        profile?.displayName || user?.displayName || user?.email || 'Admin',
        { entityId: historyVendor.id }
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

  // Unpaid Purchases for the selected vendor in Payment Modal
  const vendorUnpaidPurchases = useMemo(() => {
    if (!selectedVendor) return [];
    return purchases.filter(p => {
      const matchesId = p.vendorId === selectedVendor.id;
      const matchesName = p.vendorName && selectedVendor.name && p.vendorName.toLowerCase().trim() === selectedVendor.name.toLowerCase().trim();
      if (!matchesId && !matchesName) return false;
      const total = Number(p.total || p.grandTotal || 0);
      const paid = Number(p.paidAmount || p.paid || 0);
      return (total - paid) > 0.01;
    }).sort((a, b) => new Date(a.createdAt || a.date || 0).getTime() - new Date(b.createdAt || b.date || 0).getTime());
  }, [selectedVendor, purchases]);

  // Open Payment Modal and initialize state
  const handleOpenPaymentModal = (vendor: { id: string; name: string; due: number }) => {
    setSelectedVendor(vendor);
    setPaymentNotes('');

    const unpaid = purchases.filter(p => {
      const matchesId = p.vendorId === vendor.id;
      const matchesName = p.vendorName && vendor.name && p.vendorName.toLowerCase().trim() === vendor.name.toLowerCase().trim();
      if (!matchesId && !matchesName) return false;
      const total = Number(p.total || p.grandTotal || 0);
      const paid = Number(p.paidAmount || p.paid || 0);
      return (total - paid) > 0.01;
    });

    if (unpaid.length > 0) {
      setSettlementMode('bill');
      setPurchaseAllocations({});
      setPaymentAmount('');
    } else {
      setSettlementMode('lump_sum');
      setPurchaseAllocations({});
      setPaymentAmount(vendor.due > 0 ? vendor.due : '');
    }
  };

  const handleTogglePurchaseSelection = (purId: string, purDue: number) => {
    setPurchaseAllocations(prev => {
      const next = { ...prev };
      if (next[purId] && next[purId] > 0) {
        delete next[purId];
      } else {
        next[purId] = purDue;
      }
      const totalAlloc = Object.values(next).reduce((s, a) => s + (Number(a) || 0), 0);
      setPaymentAmount(totalAlloc > 0 ? totalAlloc : '');
      return next;
    });
  };

  const handleAllocationAmountChange = (purId: string, amount: number, maxDue: number) => {
    const validAmount = Math.max(0, Math.min(amount, maxDue));
    setPurchaseAllocations(prev => {
      const next = { ...prev };
      if (validAmount > 0) {
        next[purId] = validAmount;
      } else {
        delete next[purId];
      }
      const totalAlloc = Object.values(next).reduce((s, a) => s + (Number(a) || 0), 0);
      setPaymentAmount(totalAlloc > 0 ? totalAlloc : '');
      return next;
    });
  };

  const handleSelectAllPurchases = () => {
    const next: Record<string, number> = {};
    vendorUnpaidPurchases.forEach(p => {
      const due = Math.max(0, (Number(p.total || p.grandTotal || 0)) - (Number(p.paidAmount || p.paid || 0)));
      if (due > 0) next[p.id] = due;
    });
    setPurchaseAllocations(next);
    const totalAlloc = Object.values(next).reduce((s, a) => s + (Number(a) || 0), 0);
    setPaymentAmount(totalAlloc > 0 ? totalAlloc : '');
  };

  const handleClearAllAllocations = () => {
    setPurchaseAllocations({});
    setPaymentAmount('');
  };

  const handleMakePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error('Enter a valid payment amount');
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
      const allocatedEntries = Object.entries(purchaseAllocations).filter(([_, amt]) => Number(amt) > 0);

      if (settlementMode === 'bill' && allocatedEntries.length > 0) {
        // Bill-Wise Purchase Settlement
        const updatedVendorDue = Math.max(0, selectedVendor.due - Number(paymentAmount));
        const settledDocNumbers: string[] = [];

        for (const [purId, allocAmt] of allocatedEntries) {
          const pur = purchases.find(p => p.id === purId);
          if (!pur) continue;

          const currentPaid = Number(pur.paidAmount || pur.paid || 0);
          const purTotal = Number(pur.total || pur.grandTotal || 0);
          const newPaid = currentPaid + Number(allocAmt);
          const newStatus = newPaid >= purTotal ? 'paid' : 'partial';

          // 1. Update purchase in Firestore
          await updateDoc(doc(db, 'purchases', purId), {
            paidAmount: newPaid,
            paid: newPaid,
            paymentStatus: newStatus
          });

          const docNum = pur.billNumber || pur.documentNumber || pur.id;
          settledDocNumbers.push(docNum);

          // 2. Add Transaction in Firestore
          await addDoc(collection(db, 'transactions'), {
            type: 'payment_made',
            amount: Number(allocAmt),
            date: paymentDate,
            description: paymentNotes 
              ? `${paymentNotes} - Paid for Purchase Bill #${docNum}`
              : `Paid for Purchase Bill #${docNum}`,
            entityId: selectedVendor.id,
            entityName: selectedVendor.name,
            entityType: 'vendor',
            documentNumber: docNum,
            referenceId: pur.id,
            paymentAccountId: paymentAccountId,
            paymentMethod: acc?.type || 'cash',
            createdAt: paymentDate,
            previousDue: selectedVendor.due,
            currentBalance: updatedVendorDue
          });
        }

        // Generate voucher PDF
        const savedTx = { 
          id: `VOU-${Date.now().toString().slice(-6)}`, 
          referenceId: `VOU-${Date.now().toString().slice(-6)}`, 
          type: 'payment_made',
          amount: Number(paymentAmount),
          date: paymentDate,
          description: `Settled ${allocatedEntries.length} purchase bill(s): ${settledDocNumbers.join(', ')}`,
          entityId: selectedVendor.id,
          entityName: selectedVendor.name,
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
          `Paid vendor bill-wise payment of ৳${paymentAmount} to "${selectedVendor.name}" across ${allocatedEntries.length} bill(s): ${settledDocNumbers.join(', ')} (${acc?.type || 'cash'})`,
          profile?.displayName || user?.displayName || user?.email || 'Admin',
          {
            entityId: selectedVendor.id,
            previousState: { due: selectedVendor.due },
            newState: {
              due: updatedVendorDue,
              amount: Number(paymentAmount),
              settledBills: settledDocNumbers
            }
          }
        );

        toast.success(`Payment of ৳${Number(paymentAmount).toLocaleString()} recorded for ${allocatedEntries.length} purchase bill(s)!`);
      } else {
        // Lump Sum Payment (General / FIFO fallback)
        const txData = {
          type: 'payment_made',
          amount: Number(paymentAmount),
          date: paymentDate,
          description: paymentNotes || 'Paid vendor due payment (General / Lump Sum)',
          entityId: selectedVendor.id,
          entityName: selectedVendor.name,
          entityType: 'vendor',
          paymentAccountId: paymentAccountId,
          paymentMethod: acc?.type || 'cash',
          createdAt: paymentDate,
          previousDue: selectedVendor.due,
          currentBalance: selectedVendor.due - Number(paymentAmount)
        };

        const txRef = await addDoc(collection(db, 'transactions'), txData);

        // Auto FIFO sync
        try {
          let remPay = Number(paymentAmount);
          const unpaidPurchases = purchases
            .filter(p => {
              const matchesId = p.vendorId === selectedVendor.id;
              const matchesName = p.vendorName && selectedVendor.name && p.vendorName.toLowerCase().trim() === selectedVendor.name.toLowerCase().trim();
              if (!matchesId && !matchesName) return false;
              const tot = Number(p.total || p.grandTotal || 0);
              const pd = Number(p.paidAmount || p.paid || 0);
              return (tot - pd) > 0.01;
            })
            .sort((a, b) => new Date(a.createdAt || a.date || 0).getTime() - new Date(b.createdAt || b.date || 0).getTime());

          for (const pur of unpaidPurchases) {
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
        } catch (err) {
          console.warn('FIFO sync error:', err);
        }

        const savedTx = { id: txRef.id, referenceId: `VOU-${Date.now().toString().slice(-6)}`, ...txData, _autoPrint: true };
        try {
          generatePDF(savedTx as any, 'receipt', settings);
        } catch (err) {
          console.error('Failed to generate receipt PDF', err);
        }

        await logAudit(
          'CREATE',
          'Payment',
          `Paid vendor due of ৳${paymentAmount} to "${selectedVendor.name}" (${acc?.type || 'cash'})`,
          profile?.displayName || user?.displayName || user?.email || 'Admin',
          {
            entityId: selectedVendor.id,
            previousState: { due: selectedVendor.due },
            newState: {
              due: selectedVendor.due - Number(paymentAmount),
              amount: Number(paymentAmount)
            }
          }
        );

        toast.success(`Payment of ৳${Number(paymentAmount).toLocaleString()} recorded!`);
      }

      setSelectedVendor(null);
      setPurchaseAllocations({});
      setPaymentAmount('');
      setPaymentAccountId('');
      setPaymentNotes('');
      fetchData();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="text-blue-600" /> Vendor Due List
            </h2>
            <p className="text-sm text-gray-500 mt-1">Manage and collect outstanding payments from vendors</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-100 flex flex-col items-end">
              <span className="text-xs font-bold uppercase">Total Due</span>
              <span className="text-lg font-black">{formatCurrency(totalOverallDue, settings)}</span>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Vendor Name</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4 text-right">Due Amount</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                      Loading due list...
                    </div>
                  </td>
                </tr>
              ) : dueVendors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    <Check className="mx-auto text-green-500 mb-2" size={24} />
                    No pending dues found.
                  </td>
                </tr>
              ) : (
                dueVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{vendor.name}</td>
                    <td className="px-6 py-4">{vendor.phone || 'N/A'}</td>
                    <td className="px-6 py-4 text-right font-black text-red-600">
                      {formatCurrency(vendor.due, settings)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setHistoryVendor({ id: vendor.id, name: vendor.name })}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                        >
                          History
                        </button>
                        <button
                          onClick={() => handleOpenPaymentModal({ id: vendor.id, name: vendor.name, due: vendor.due })}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer"
                        >
                          Make Payment
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

      {/* Bill-Wise Due Settlement Modal */}
      {selectedVendor && (
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
                    Pay Vendor / Supplier Due
                  </h3>
                  <span className="text-[11px] text-slate-300">
                    Settle outstanding dues by specific purchase bill or lump sum
                  </span>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedVendor(null);
                  setPurchaseAllocations({});
                }}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleMakePayment} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Vendor Info Card */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Vendor Account</span>
                  <div className="font-black text-base text-slate-900 mt-0.5">{selectedVendor.name}</div>
                  <span className="text-[11px] text-slate-500">
                    {vendorUnpaidPurchases.length} unpaid / partial bill(s) on file
                  </span>
                </div>
                <div className="bg-white border border-rose-200 px-4 py-2 rounded-xl text-right shadow-2xs">
                  <span className="text-[10px] font-bold text-rose-600 block uppercase">Total Balance Due</span>
                  <span className="font-black text-lg text-rose-700">{formatCurrency(selectedVendor.due, settings)}</span>
                </div>
              </div>

              {/* Settlement Mode Switcher */}
              <div className="flex border border-slate-200 bg-slate-100/70 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setSettlementMode('bill')}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    settlementMode === 'bill'
                      ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <Receipt size={14} /> Pay by Specific Purchase Bill ({vendorUnpaidPurchases.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSettlementMode('lump_sum');
                    setPaymentAmount(selectedVendor.due > 0 ? selectedVendor.due : '');
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

              {/* Purchase Bills Table (When in Bill Mode) */}
              {settlementMode === 'bill' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 text-xs">
                      Unpaid Purchase Bills ({vendorUnpaidPurchases.length})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllPurchases}
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

                  {vendorUnpaidPurchases.length === 0 ? (
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
                          {vendorUnpaidPurchases.map(p => {
                            const tot = Number(p.total || p.grandTotal || 0);
                            const pd = Number(p.paidAmount || p.paid || 0);
                            const purDue = Math.max(0, tot - pd);
                            const isAllocated = (purchaseAllocations[p.id] || 0) > 0;
                            const currentAlloc = purchaseAllocations[p.id] || '';
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
                                    onChange={() => handleTogglePurchaseSelection(p.id, purDue)}
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
                  )}

                  {/* Allocation Bottom Summary */}
                  {Object.keys(purchaseAllocations).length > 0 && (
                    <div className="p-3 bg-blue-50/80 border-t border-blue-200 flex items-center justify-between font-bold text-xs">
                      <span className="text-blue-900 flex items-center gap-1.5">
                        <Check size={14} className="text-blue-700" />
                        Selected for settlement: {Object.values(purchaseAllocations).filter(v => v > 0).length} bill(s)
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
                    {settlementMode === 'bill' ? 'Total Settlement Amount (BDT)' : 'Payment Amount (BDT)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    max={selectedVendor.due}
                    value={paymentAmount}
                    onChange={(e) => {
                      setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value));
                    }}
                    placeholder="Enter amount"
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-black text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                  {settlementMode === 'lump_sum' && selectedVendor.due > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(selectedVendor.due)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      >
                        Full Due ({formatCurrency(selectedVendor.due, settings)})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(Math.round(selectedVendor.due / 2))}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      >
                        50% Due
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Pay From Account
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
                  placeholder="e.g., Paid via Bank Transfer / Cheque #... / Cash Voucher #..."
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedVendor(null);
                    setPurchaseAllocations({});
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
                  {submitting ? 'Processing Payment...' : `Confirm Payment (${formatCurrency(Number(paymentAmount) || 0, settings)})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historyVendor && (() => {
        // Reverse so oldest is first for running balance calculation
        let runningBalance = 0;
        let totalDebit = 0;
        let totalCredit = 0;
        
        const allEntityTx = [...transactions]
          .filter(t => t.entityId === historyVendor.id)
          .reverse()
          .map(t => {
            const isDebit = t.type === 'purchase' || t.type === 'opening_balance';
            const isCredit = t.type === 'payment_made' || t.type === 'deposit' || ((t.type === 'purchase_return' || t.type === 'return') && (t.paymentMethod === 'supplier_credit' || !t.paymentMethod || t.paymentMethod === 'credit'));
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
        
        const vendorTx = filteredTx.map(t => {
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
                  <h2 className="text-xl font-black tracking-tight">{historyVendor.name}</h2>
                  <span className="inline-block mt-1 text-[11px] font-semibold bg-white/10 text-blue-200 px-2.5 py-0.5 rounded-full tracking-wide">Vendor Account</span>
                </div>
                <button
                  onClick={() => setHistoryVendor(null)}
                  className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* ── Filter + Action Bar ── */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex flex-wrap items-center gap-4 flex-shrink-0">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">From Date</label>
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <span className="text-gray-300 mt-4">—</span>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">To Date</label>
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  {(fromDate || toDate) && (
                    <button
                      onClick={() => { setFromDate(''); setToDate(''); }}
                      className="mt-4 text-xs text-gray-400 hover:text-red-500 transition-colors"
                      title="Clear filters"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const vDue = closingBalance > 0 ? closingBalance : 0;
                      handleOpenPaymentModal({ id: historyVendor.id, name: historyVendor.name, due: vDue });
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    <CreditCard size={13} /> Make Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowOpeningBalForm(v => !v); setObAmount(''); setObDescription('Previous outstanding balance'); }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
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
                    {vendorTx.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center text-gray-400 italic text-sm">No transactions found for the selected period.</td>
                      </tr>
                    ) : (
                      [...vendorTx].reverse().map((t, idx) => (
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
                              {(t.type === 'payment_received' || t.type === 'payment_made' || t.type === 'opening_balance' || t.type === 'purchase') && (
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
                    const msg = `Dear ${historyVendor.name}, your current due is ${formatCurrency(closingBalance, settings)}. Please clear the due as soon as possible.`;
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
                          <title>Ledger - ${historyVendor.name}</title>
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
                          <h1>Ledger History: ${historyVendor.name}</h1>
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
                              ${[...vendorTx].reverse().map(t => `
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
                  onClick={() => setHistoryVendor(null)}
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
