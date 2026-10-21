import React, { useState, useEffect } from 'react';
import { db } from '../../../../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  limit,
  increment,
  deleteDoc,
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
import {
  RotateCcw,
  Plus,
  Download,
  Printer,
  CheckSquare,
  Search,
  FileText,
  Check,
  X,
  Eye,
  Trash2,
  AlertCircle,
  ShoppingBag,
  RefreshCw,
} from 'lucide-react';
import { generateDocumentNumber } from '../../../../lib/numbering';
import { Pagination } from '../../../../components/common/Pagination';
import { logAudit } from '../../../../lib/audit';
import { PaymentAccount } from '../../../../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PurchaseReturnItem {
  productId: string;
  name: string;
  code?: string;
  currentStock: number;
  returnQty: number;
  unitPrice: number;
  availableSerials: string[];
  selectedReturnSerials: string[];
}

export const PurchaseReturnTab: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useSettings();

  const [activeView, setActiveView] = useState<'create' | 'history'>('create');
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);

  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedPurchaseId, setSelectedPurchaseId] = useState('');
  const [selectedPurchaseDoc, setSelectedPurchaseDoc] = useState<any | null>(null);
  const [referenceNo, setReferenceNo] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState('');
  const [returnItems, setReturnItems] = useState<PurchaseReturnItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'supplier_credit' | 'cash' | 'bank' | 'bkash'>('supplier_credit');
  const [selectedPaymentAccountId, setSelectedPaymentAccountId] = useState<string>('');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // History State
  const [returnsHistory, setReturnsHistory] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPerPage, setHistoryPerPage] = useState(15);
  const [viewingReturnModal, setViewingReturnModal] = useState<any | null>(null);

  useEffect(() => {
    fetchInitialData();
    generateRefNo();
  }, []);

  const generateRefNo = async () => {
    try {
      const ref = await generateDocumentNumber('PR');
      setReferenceNo(ref);
    } catch {
      setReferenceNo(`PR-${Date.now().toString().slice(-6)}`);
    }
  };

  const fetchInitialData = async () => {
    try {
      const [vendorsSnap, productsSnap, purchasesSnap, accsSnap] = await Promise.all([
        getDocs(query(collection(db, 'vendors'), orderBy('name'))),
        getDocs(query(collection(db, 'products'), orderBy('name'))),
        getDocs(query(collection(db, 'purchases'), orderBy('createdAt', 'desc'), limit(100))),
        getDocs(query(collection(db, 'payment_accounts'), orderBy('name'))),
      ]);

      setVendors(vendorsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setPurchases(purchasesSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const accs = accsSnap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentAccount));
      setPaymentAccounts(accs);
      if (accs.length > 0 && !selectedPaymentAccountId) {
        setSelectedPaymentAccountId(accs[0].id);
      }

      fetchReturnsHistory();
    } catch (err) {
      console.error('Error loading initial data:', err);
      toast.error('Failed to load initial data');
    }
  };

  const fetchReturnsHistory = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'purchase_returns'), orderBy('createdAt', 'desc')));
      setReturnsHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error loading purchase returns:', err);
    }
  };

  const handleSelectPurchase = (purchaseId: string) => {
    setSelectedPurchaseId(purchaseId);
    if (!purchaseId) {
      setSelectedPurchaseDoc(null);
      setReturnItems([]);
      setRefundAmount(0);
      return;
    }

    const purchase = purchases.find(p => p.id === purchaseId);
    if (purchase) {
      setSelectedPurchaseDoc(purchase);
      if (purchase.vendorId) setSelectedVendorId(purchase.vendorId);

      const items: PurchaseReturnItem[] = (purchase.items || []).map((item: any) => {
        const prod = products.find(p => p.id === item.productId || p.id === item.id);
        const availSerials = prod?.availableSerials || [];
        const currentStock = Number(prod?.stock) || 0;

        return {
          productId: item.productId || item.id,
          name: item.name || prod?.name || 'Product',
          code: item.code || prod?.sku || '',
          currentStock,
          returnQty: Math.min(currentStock, Number(item.quantity) || 1),
          unitPrice: Number(item.costPrice || item.unitPrice || prod?.costPrice || 0),
          availableSerials: availSerials,
          selectedReturnSerials: availSerials.slice(0, Math.min(currentStock, Number(item.quantity) || 1)),
        };
      });

      setReturnItems(items);
      recalculateRefund(items);
    }
  };

  const handleAddProductManually = (prodId: string) => {
    if (!prodId) return;
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    if (returnItems.some(i => i.productId === prod.id)) {
      toast.error('Product already added to return table');
      return;
    }

    const currentStock = Number(prod.stock) || 0;
    if (currentStock <= 0) {
      toast.error(`Cannot return ${prod.name}: Current stock is 0!`);
      return;
    }

    const newItem: PurchaseReturnItem = {
      productId: prod.id,
      name: prod.name,
      code: prod.sku || '',
      currentStock,
      returnQty: 1,
      unitPrice: Number(prod.costPrice || prod.price || 0),
      availableSerials: prod.availableSerials || [],
      selectedReturnSerials: (prod.availableSerials || []).slice(0, 1),
    };

    const updated = [...returnItems, newItem];
    setReturnItems(updated);
    recalculateRefund(updated);
    setSelectedProductToAdd('');
  };

  const handleRemoveItem = (index: number) => {
    const updated = returnItems.filter((_, idx) => idx !== index);
    setReturnItems(updated);
    recalculateRefund(updated);
  };

  const handleReturnQtyChange = (index: number, qty: number) => {
    const updated = [...returnItems];
    const item = updated[index];
    const clampedQty = Math.max(1, Math.min(item.currentStock || 9999, qty));
    item.returnQty = clampedQty;

    if (item.selectedReturnSerials.length > clampedQty) {
      item.selectedReturnSerials = item.selectedReturnSerials.slice(0, clampedQty);
    }

    setReturnItems(updated);
    recalculateRefund(updated);
  };

  const handleSelectAllReturn = () => {
    const updated = returnItems.map(item => {
      const targetQty = Math.max(1, item.currentStock);
      const selectedSerials = item.availableSerials ? item.availableSerials.slice(0, targetQty) : [];
      return {
        ...item,
        returnQty: targetQty,
        selectedReturnSerials: selectedSerials,
      };
    });
    setReturnItems(updated);
    recalculateRefund(updated);
  };

  const handleClearAllReturn = () => {
    setReturnItems([]);
    setRefundAmount(0);
    setSelectedPurchaseId('');
    setSelectedPurchaseDoc(null);
  };

  const handleToggleSerial = (index: number, serial: string) => {
    const updated = [...returnItems];
    const item = updated[index];
    const exists = item.selectedReturnSerials.includes(serial);

    if (exists) {
      item.selectedReturnSerials = item.selectedReturnSerials.filter(s => s !== serial);
    } else {
      if (item.selectedReturnSerials.length >= item.returnQty) {
        if (item.returnQty < item.currentStock) {
          item.returnQty += 1;
          item.selectedReturnSerials.push(serial);
        } else {
          toast.error(`Cannot select more serials than current stock (${item.currentStock})`);
          return;
        }
      } else {
        item.selectedReturnSerials.push(serial);
      }
    }

    setReturnItems(updated);
    recalculateRefund(updated);
  };

  const recalculateRefund = (items: PurchaseReturnItem[]) => {
    const total = items.reduce((sum, i) => sum + i.returnQty * i.unitPrice, 0);
    setRefundAmount(total);
  };

  const grandTotalReturn = returnItems.reduce((sum, i) => sum + i.returnQty * i.unitPrice, 0);
  const totalReturnUnits = returnItems.reduce((sum, i) => sum + i.returnQty, 0);

  // Generate Debit Note / Return Slip PDF
  const generateDebitNotePDF = (returnRecord: any, autoPrint = false) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const storeName = settings?.siteName || 'CLICK2IT E-COMMERCE & POS';
      const storePhone = settings?.contactPhone || '+880 1888-019699';
      const storeAddress = settings?.address || 'Dhaka, Bangladesh';

      // Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(storeName, 14, 18);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`${storeAddress} | Phone: ${storePhone}`, 14, 23);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text('DEBIT NOTE / PURCHASE RETURN VOUCHER', 14, 32);
      doc.setTextColor(0, 0, 0);

      // Meta Box
      doc.setDrawColor(220, 220, 220);
      doc.rect(14, 36, 182, 24);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Debit Note #: ${returnRecord.referenceNumber || 'N/A'}`, 18, 43);
      doc.text(
        `Purchase Bill: ${returnRecord.purchaseDocumentNumber || returnRecord.purchaseId || 'Direct Return'}`,
        18,
        49
      );
      doc.text(`Return Date: ${returnRecord.returnDate || new Date(returnRecord.createdAt).toLocaleDateString()}`, 18, 55);

      doc.text(`Supplier: ${returnRecord.vendorName || 'N/A'}`, 110, 43);
      doc.text(`Phone: ${returnRecord.vendorPhone || 'N/A'}`, 110, 49);
      doc.text(`Settlement: ${(returnRecord.paymentMethod || 'supplier_credit').toUpperCase()}`, 110, 55);

      // Table of Returned Items
      const tableData = (returnRecord.items || []).map((itm: any, idx: number) => {
        let nameCol = itm.name || 'Item';
        if (Array.isArray(itm.returnedSerials) && itm.returnedSerials.length > 0) {
          nameCol += `\nSerials: ${itm.returnedSerials.join(', ')}`;
        }
        return [
          idx + 1,
          nameCol,
          itm.returnQty,
          `৳${Number(itm.unitPrice || 0).toLocaleString()}`,
          `৳${Number(itm.total || itm.returnQty * itm.unitPrice || 0).toLocaleString()}`,
        ];
      });

      autoTable(doc, {
        startY: 64,
        head: [['#', 'Item Description / Stock Serials', 'Return Qty', 'Cost Price', 'Total']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [8, 22, 33], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
        styles: { cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 95 },
          2: { cellWidth: 22, halign: 'center' },
          3: { cellWidth: 25, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' },
        },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 8;

      // Summary Box
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Returned Quantity: ${returnRecord.totalUnits || 0} Units`, 14, finalY);

      doc.setFontSize(11);
      doc.setTextColor(220, 38, 38);
      doc.text(
        `Debit / Refund Amount: ৳${Number(returnRecord.refundAmount || returnRecord.grandTotal || 0).toLocaleString()}`,
        110,
        finalY
      );
      doc.setTextColor(0, 0, 0);

      if (returnRecord.note) {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.text(`Reason/Remarks: ${returnRecord.note}`, 14, finalY + 8);
      }

      // Signatures
      const sigY = finalY + 28;
      doc.setFontSize(8);
      doc.line(14, sigY, 65, sigY);
      doc.text('Authorized Receiver (Vendor)', 18, sigY + 5);

      doc.line(140, sigY, 195, sigY);
      doc.text('Authorized Store Manager', 148, sigY + 5);

      if (autoPrint) {
        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
      } else {
        doc.save(`DebitNote-${returnRecord.referenceNumber || 'Voucher'}.pdf`);
      }
    } catch (err) {
      console.error('Error generating Debit Note PDF:', err);
      toast.error('Failed to generate return voucher');
    }
  };

  // Submit Purchase Return
  const handleSubmitReturn = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedVendorId) {
      toast.error('দয়া করে সরবরাহকারী (Supplier / Vendor) সিলেক্ট করুন!');
      return;
    }
    if (returnItems.length === 0 || totalReturnUnits === 0) {
      toast.error('দয়া করে ফেরত দেওয়ার জন্য অন্তত ১টি পণ্য যুক্ত করুন!');
      return;
    }

    // Verify stock & serial constraints
    for (const item of returnItems) {
      if (item.returnQty > item.currentStock) {
        toast.error(`Return quantity for ${item.name} exceeds available stock (${item.currentStock})`);
        return;
      }
      // Fixed serial bug: If product has serials, require exact selection
      if (item.availableSerials && item.availableSerials.length > 0) {
        if (item.selectedReturnSerials.length !== item.returnQty) {
          toast.error(`Please select exactly ${item.returnQty} serial(s) for ${item.name}`);
          return;
        }
      }
    }

    // Resolve payment account if cash refund received
    let chosenAccountId = selectedPaymentAccountId;
    if (refundAmount > 0 && paymentMethod !== 'supplier_credit') {
      if (!chosenAccountId && paymentAccounts.length > 0) {
        chosenAccountId = paymentAccounts[0].id;
        setSelectedPaymentAccountId(chosenAccountId);
      }
      if (!chosenAccountId) {
        toast.error('Please select an Account to receive the cash refund into!');
        return;
      }
    }
    const selectedAcc = paymentAccounts.find(a => a.id === chosenAccountId);
    const vendor = vendors.find(v => v.id === selectedVendorId);

    setIsSubmitting(true);
    try {
      const safeRefundAmount = Math.max(0, Number(refundAmount) || 0);
      const safeRefNo = referenceNo || `PR-${Date.now().toString().slice(-6)}`;

      // 1. Write purchase_returns document
      const returnRecord = {
        referenceNumber: safeRefNo,
        vendorId: selectedVendorId,
        vendorName: vendor?.name || 'Vendor',
        vendorPhone: vendor?.phone || '',
        purchaseId: selectedPurchaseId || null,
        purchaseDocumentNumber: selectedPurchaseDoc?.documentNumber || '',
        items: returnItems.map(i => ({
          productId: i.productId || '',
          name: i.name || 'Product',
          code: i.code || '',
          returnQty: Number(i.returnQty) || 0,
          unitPrice: Number(i.unitPrice) || 0,
          total: (Number(i.returnQty) || 0) * (Number(i.unitPrice) || 0),
          returnedSerials: Array.isArray(i.selectedReturnSerials) ? i.selectedReturnSerials : [],
        })),
        totalUnits: totalReturnUnits,
        grandTotal: grandTotalReturn,
        refundAmount: safeRefundAmount,
        paymentMethod: paymentMethod || 'supplier_credit',
        paymentAccountId: paymentMethod !== 'supplier_credit' ? (selectedAcc?.id || '') : '',
        paymentAccountName: paymentMethod !== 'supplier_credit' ? (selectedAcc?.name || '') : '',
        note: note || '',
        returnDate: returnDate || new Date().toISOString().split('T')[0],
        createdBy: user?.displayName || user?.email || 'admin',
        createdAt: new Date().toISOString(),
      };

      const returnDocRef = await addDoc(collection(db, 'purchase_returns'), returnRecord);

      // 2. Deduct product inventory & remove returned serials
      for (const item of returnItems) {
        if (item.productId) {
          const productRef = doc(db, 'products', item.productId);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const currentProd = productSnap.data();
            const updates: any = {
              stock: Math.max(0, (Number(currentProd.stock) || 0) - item.returnQty),
            };

            if (item.selectedReturnSerials && item.selectedReturnSerials.length > 0) {
              const currentAvail: string[] = currentProd.availableSerials || [];
              const returnSet = new Set(item.selectedReturnSerials);
              updates.availableSerials = currentAvail.filter(s => !returnSet.has(s));
            }

            await updateDoc(productRef, updates);
          }
        }
      }

      // 3. Update original Purchase document if selected
      if (selectedPurchaseId) {
        try {
          const purchaseRef = doc(db, 'purchases', selectedPurchaseId);
          const pSnap = await getDoc(purchaseRef);
          if (pSnap.exists()) {
            await updateDoc(purchaseRef, {
              hasReturn: true,
              returnedAmount: increment(safeRefundAmount),
              lastReturnReference: safeRefNo,
              lastReturnedAt: new Date().toISOString(),
            });
          }
        } catch (pErr) {
          console.error('Error updating purchase bill:', pErr);
        }
      }

      // 4. Update Payment Account balance if Cash/Bank refund was received
      if (safeRefundAmount > 0 && paymentMethod !== 'supplier_credit' && selectedAcc?.id) {
        try {
          await updateDoc(doc(db, 'payment_accounts', selectedAcc.id), {
            balance: increment(safeRefundAmount),
            updatedAt: new Date().toISOString(),
          });
        } catch (accErr) {
          console.error('Error updating payment account balance:', accErr);
        }
      }

      // 5. Log Accounting Transaction
      if (safeRefundAmount > 0) {
        await addDoc(collection(db, 'transactions'), {
          type: 'purchase_return',
          amount: safeRefundAmount,
          date: returnDate,
          description: `Purchase Return ${safeRefNo} to Vendor ${vendor?.name || ''} (${paymentMethod === 'supplier_credit' ? 'Debit Note / Credit Adjusted' : 'Cash/Bank Refund Received'})`,
          entityId: selectedVendorId,
          entityName: vendor?.name || 'Vendor',
          entityType: 'vendor',
          referenceId: returnDocRef.id,
          documentNumber: safeRefNo,
          paymentAccountId: paymentMethod !== 'supplier_credit' ? (selectedAcc?.id || '') : '',
          paymentMethod:
            paymentMethod === 'supplier_credit'
              ? 'supplier_credit'
              : (selectedAcc?.type || selectedAcc?.name || paymentMethod),
          createdAt: new Date().toISOString(),
          createdBy: user?.displayName || user?.email || 'Admin',
        });
      }

      // 6. Log Audit Trail
      try {
        await logAudit(
          'CREATE',
          'PurchaseReturn',
          `Recorded Purchase Return #${safeRefNo} (Vendor: ${vendor?.name || 'Vendor'}, Items: ${totalReturnUnits}, Refund: ৳${safeRefundAmount})`,
          user?.displayName || user?.email || 'Admin',
          {
            entityId: returnDocRef.id,
            newState: {
              referenceNumber: safeRefNo,
              vendorId: selectedVendorId,
              refundAmount: safeRefundAmount,
              paymentMethod,
            },
          }
        );
      } catch (auditErr) {
        console.error('Audit log error:', auditErr);
      }

      toast.success(`Purchase Return ${safeRefNo} submitted! Inventory stock deducted.`);

      // Open print prompt
      try {
        generateDebitNotePDF({ id: returnDocRef.id, ...returnRecord }, false);
      } catch (pdfErr) {
        console.error('PDF error:', pdfErr);
      }

      // Reset form
      setSelectedPurchaseId('');
      setSelectedPurchaseDoc(null);
      setSelectedVendorId('');
      setReturnItems([]);
      setRefundAmount(0);
      setNote('');
      generateRefNo();
      fetchInitialData();
      setActiveView('history');
    } catch (err: any) {
      console.error('Error processing purchase return:', err);
      toast.error('Failed to submit purchase return: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete & Revert Purchase Return
  const handleDeleteReturn = async (returnRecord: any) => {
    if (
      !window.confirm(
        `Are you sure you want to delete and revert Purchase Return ${returnRecord.referenceNumber}? This will restore product stock, recover serial numbers, and revert financial transactions.`
      )
    ) {
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Restore product stock & serials
      for (const item of returnRecord.items || []) {
        if (item.productId) {
          const productRef = doc(db, 'products', item.productId);
          const prodSnap = await getDoc(productRef);
          if (prodSnap.exists()) {
            const prodData = prodSnap.data();
            const qtyToRestore = Number(item.returnQty) || 0;
            const updates: any = {
              stock: (Number(prodData.stock) || 0) + qtyToRestore,
            };

            // Restore serials back to availableSerials
            if (Array.isArray(item.returnedSerials) && item.returnedSerials.length > 0) {
              const currentAvail = prodData.availableSerials || [];
              updates.availableSerials = Array.from(new Set([...currentAvail, ...item.returnedSerials]));
            }

            await updateDoc(productRef, updates);
          }
        }
      }

      // 2. Revert payment account balance if money was received into account
      if (
        returnRecord.paymentMethod !== 'supplier_credit' &&
        returnRecord.paymentAccountId &&
        Number(returnRecord.refundAmount) > 0
      ) {
        try {
          await updateDoc(doc(db, 'payment_accounts', returnRecord.paymentAccountId), {
            balance: increment(-Number(returnRecord.refundAmount)),
            updatedAt: new Date().toISOString(),
          });
        } catch (accErr) {
          console.error('Error reverting payment account balance:', accErr);
        }
      }

      // 3. Delete linked transactions
      const txQ = query(collection(db, 'transactions'), where('referenceId', '==', returnRecord.id));
      const txSnap = await getDocs(txQ);
      for (const d of txSnap.docs) {
        await deleteDoc(doc(db, 'transactions', d.id));
      }

      // 4. Revert original Purchase document status
      if (returnRecord.purchaseId) {
        try {
          const purchaseRef = doc(db, 'purchases', returnRecord.purchaseId);
          const pSnap = await getDoc(purchaseRef);
          if (pSnap.exists()) {
            const pData = pSnap.data();
            const newReturned = Math.max(
              0,
              (Number(pData.returnedAmount) || 0) - (Number(returnRecord.refundAmount) || 0)
            );
            await updateDoc(purchaseRef, {
              returnedAmount: newReturned,
              hasReturn: newReturned > 0,
            });
          }
        } catch (pErr) {
          console.error('Error reverting purchase bill:', pErr);
        }
      }

      // 5. Delete purchase_returns document
      await deleteDoc(doc(db, 'purchase_returns', returnRecord.id));

      // 6. Log audit
      await logAudit(
        'DELETE',
        'PurchaseReturn',
        `Reverted & deleted Purchase Return #${returnRecord.referenceNumber} for Vendor ${returnRecord.vendorName}`,
        user?.displayName || user?.email || 'admin'
      );

      toast.success(`Purchase return ${returnRecord.referenceNumber} reverted and deleted successfully!`);
      fetchReturnsHistory();
      fetchInitialData();
    } catch (err: any) {
      console.error('Error deleting purchase return:', err);
      toast.error('Failed to delete purchase return: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredHistory = returnsHistory.filter(r => {
    if (!historySearch) return true;
    const q = historySearch.toLowerCase();
    return (
      (r.referenceNumber || '').toLowerCase().includes(q) ||
      (r.vendorName || '').toLowerCase().includes(q) ||
      (r.vendorPhone || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden flex flex-col">
      {/* Top Header & View Switcher */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 to-[#081621] text-white border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-[10px] font-black uppercase tracking-widest mb-3">
              <RotateCcw size={12} className="text-rose-400" /> Vendor Debit Notes
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              Purchase Return Management
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">
              Return damaged or surplus items to suppliers, deduct stock inventory, void purchase serials, and generate official Debit Notes.
            </p>
          </div>

          <div className="flex bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50 backdrop-blur-sm shrink-0">
            <button
              onClick={() => setActiveView('create')}
              className={cn(
                'px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2',
                activeView === 'create'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              )}
            >
              <Plus size={16} /> New Purchase Return
            </button>
            <button
              onClick={() => {
                setActiveView('history');
                fetchReturnsHistory();
              }}
              className={cn(
                'px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2',
                activeView === 'history'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              )}
            >
              <FileText size={16} /> Return History
              <span
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full',
                  activeView === 'history' ? 'bg-slate-100 text-slate-600' : 'bg-slate-700 text-slate-300'
                )}
              >
                {returnsHistory.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {activeView === 'create' ? (
        <form onSubmit={handleSubmitReturn} className="p-6 pt-0 space-y-6">
          {/* Metadata Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/70 p-6 rounded-2xl border border-slate-100 shadow-sm mt-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Reference No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={referenceNo}
                readOnly
                className="w-full border-slate-200 rounded-xl bg-slate-100 text-sm font-mono font-bold text-slate-600 px-4 py-2.5 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Supplier / Vendor <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedVendorId}
                onChange={e => setSelectedVendorId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none px-4 py-2.5 shadow-sm transition-all"
              >
                <option value="">-- Choose Supplier --</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.phone || 'No phone'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Original Purchase Invoice (Optional)
              </label>
              <select
                value={selectedPurchaseId}
                onChange={e => handleSelectPurchase(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none px-4 py-2.5 shadow-sm transition-all"
              >
                <option value="">-- Select from Past Purchases --</option>
                {purchases.map(p => (
                  <option key={p.id} value={p.id}>
                    #{p.documentNumber || p.id.slice(0, 8)} — {p.vendorName} ({formatCurrency(p.totalAmount || p.total || 0, settings)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Return Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={returnDate}
                onChange={e => setReturnDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none px-4 py-2.5 shadow-sm transition-all"
              />
            </div>
          </div>

          {/* Selected Purchase Summary Card */}
          {selectedPurchaseDoc && (() => {
            const billTotal = Number(selectedPurchaseDoc.total || selectedPurchaseDoc.subtotal || 0);
            const billPaid = Number(selectedPurchaseDoc.paidAmount ?? selectedPurchaseDoc.paid ?? 0);
            const billDue = Math.max(0, billTotal - billPaid);

            return (
              <div className="space-y-3">
                <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm shadow-sm">
                  <div>
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-1">
                      Purchase Information
                    </span>
                    <span className="font-bold text-slate-800 block text-base">
                      Invoice #{selectedPurchaseDoc.documentNumber || selectedPurchaseDoc.id.slice(0, 8)} ({selectedPurchaseDoc.vendorName})
                    </span>
                    <span className="text-slate-500 font-medium mt-0.5 block text-xs">
                      Date: {selectedPurchaseDoc.date ? new Date(selectedPurchaseDoc.date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>

                  <div className="sm:text-right bg-white/80 p-3 rounded-xl border border-blue-100 shrink-0">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">
                      Bill Balance
                    </span>
                    <div className="font-black text-blue-900 text-lg">
                      {formatCurrency(billTotal, settings)}
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 mt-0.5 flex items-center gap-2 justify-end">
                      <span>Paid: <strong className="text-emerald-700">{formatCurrency(billPaid, settings)}</strong></span>
                      {billDue > 0 && (
                        <span>Due: <strong className="text-rose-600">{formatCurrency(billDue, settings)}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                {billDue > 0 && (
                  <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
                    <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold block text-sm text-amber-950">
                        এই বিলে ভেন্ডরের পাওনা (Due) রয়েছে: {formatCurrency(billDue, settings)}
                      </strong>
                      <p className="mt-0.5 text-amber-800">
                        ক্যাশ রিফান্ড না নিয়ে <strong>&quot;Supplier Ledger Credit (Debit Note / বকেয়া সমন্বয়)&quot;</strong> সিলেক্ট করুন যাতে ভেন্ডরের বকেয়া খাতা থেকে এই রিটার্ন টাকা সমন্বয় হয়ে আমাদের দেনা কমে যায়।
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Add Product from Inventory Picker */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <select
                value={selectedProductToAdd}
                onChange={e => {
                  setSelectedProductToAdd(e.target.value);
                  handleAddProductManually(e.target.value);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl text-xs py-3 px-4 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
              >
                <option value="">+ Add Product from Inventory to Return...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — Current Stock: {p.stock || 0} — Cost: {formatCurrency(p.costPrice || p.price || 0, settings)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
            {returnItems.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <ShoppingBag size={15} className="text-slate-500" />
                  <span>ফেরতযোগ্য পণ্যের তালিকা ({returnItems.length} টি আইটেম)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllReturn}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CheckSquare size={14} /> সমস্ত স্টক সিলেক্ট (Full Return)
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllReturn}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <RotateCcw size={14} /> রিসেট
                  </button>
                </div>
              </div>
            )}

            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Product Name / Stock Serials
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Current Stock
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Return Qty
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                    Cost Price
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                    Return Subtotal
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {returnItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <ShoppingBag size={28} className="text-slate-300 mb-2" />
                        <span className="font-bold text-slate-600">No Items Added</span>
                        <span className="text-xs text-slate-400">
                          Choose an original purchase invoice or select a product from the dropdown above.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  returnItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-mono text-sm text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-900 block text-sm">{item.name}</span>
                        {item.availableSerials && item.availableSerials.length > 0 && (
                          <div className="mt-3 bg-white p-3 rounded-xl border border-slate-200">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                              Select Stock Serials to Return ({item.selectedReturnSerials.length} / {item.returnQty})
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {item.availableSerials.map(ser => {
                                const isSelected = item.selectedReturnSerials.includes(ser);
                                return (
                                  <button
                                    key={ser}
                                    type="button"
                                    onClick={() => handleToggleSerial(idx, ser)}
                                    className={cn(
                                      'px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition-all',
                                      isSelected
                                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                                    )}
                                  >
                                    {isSelected && <Check size={12} />} {ser}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center font-black text-slate-600 text-sm">
                        {item.currentStock} Units
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex items-center justify-center gap-1">
                          <button
                            type="button"
                            disabled={item.returnQty <= 1}
                            onClick={() => handleReturnQtyChange(idx, item.returnQty - 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed font-black text-sm transition-all"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={item.currentStock}
                            value={item.returnQty}
                            onChange={e => handleReturnQtyChange(idx, parseInt(e.target.value) || 1)}
                            className="w-16 text-center border border-rose-300 bg-rose-50/20 text-rose-600 rounded-xl text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none px-1 py-1 transition-all"
                          />
                          <button
                            type="button"
                            disabled={item.returnQty >= item.currentStock}
                            onClick={() => handleReturnQtyChange(idx, item.returnQty + 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed font-black text-sm transition-all"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-slate-500 text-sm">
                        {formatCurrency(item.unitPrice, settings)}
                      </td>
                      <td className="py-4 px-6 text-right font-black text-slate-900 text-sm">
                        <span className="text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                          {formatCurrency(item.returnQty * item.unitPrice, settings)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Refund Settlement Footer */}
          {returnItems.length > 0 && (
            <div className="flex flex-col lg:flex-row justify-between gap-6 pt-6 border-t border-slate-100 mt-6">
              <div className="flex-1 space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Return Reason / Supplier Remarks
                </label>
                <textarea
                  rows={4}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Factory defective batch, wrong model delivered, damaged in transit..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none p-4 font-medium text-slate-700 transition-all resize-none"
                />
              </div>

              <div className="w-full lg:w-96 bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-4">
                <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-3">
                  <span className="font-bold text-slate-500">Total Items to Return:</span>
                  <span className="font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-full">
                    {totalReturnUnits} Units
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-3">
                  <span className="font-bold text-slate-500">Grand Return Total:</span>
                  <span className="font-black text-xl text-rose-600">
                    {formatCurrency(grandTotalReturn, settings)}
                  </span>
                </div>

                <div className="pt-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Settlement Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none px-4 py-2.5 transition-all"
                  >
                    <option value="supplier_credit">Supplier Ledger Credit (Debit Note / বকেয়া সমন্বয়)</option>
                    <option value="cash">Cash Refund Received (ভেন্ডরের থেকে নগদ ফেরত)</option>
                    <option value="bank">Bank Transfer Refund (ব্যাংকে ফেরত প্রাপ্তি)</option>
                    <option value="bkash">bKash / MFS Refund (বিকাশ / নগদ)</option>
                  </select>
                </div>

                {/* Source Payment Account if money received */}
                {paymentMethod !== 'supplier_credit' ? (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Receive Into Account <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedPaymentAccountId}
                      onChange={e => setSelectedPaymentAccountId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none px-4 py-2.5 transition-all"
                    >
                      <option value="">-- Select Receiving Account --</option>
                      {paymentAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.type})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      টাকা এই অ্যাকাউন্টে জমা হয়ে ব্যালেন্স বৃদ্ধি পাবে এবং ডে-বুকে রেকর্ড হবে।
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800 font-medium">
                    ✓ ভেন্ডরের বকেয়া খাতা (Vendor Due / Ledger) থেকে এই রিটার্নের টাকা স্বয়ংক্রিয়ভাবে সমন্বয় হয়ে আমাদের দেনা কমে যাবে।
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Refund / Credit Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={refundAmount}
                    onChange={e => setRefundAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border-2 border-rose-100 focus:border-rose-400 rounded-xl text-lg font-black text-rose-600 focus:ring-4 focus:ring-rose-500/10 outline-none px-4 py-2.5 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 disabled:opacity-60 mt-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" /> Submitting Return...
                    </>
                  ) : (
                    <>
                      <CheckSquare size={18} /> Confirm & Submit Purchase Return (ফেরত সম্পন্ন করুন)
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      ) : (
        /* History View */
        <div className="p-6 pt-0 space-y-4 mt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm flex-1">
              <input
                type="text"
                placeholder="Search by Ref, Vendor..."
                value={historySearch}
                onChange={e => {
                  setHistorySearch(e.target.value);
                  setHistoryPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <button
              onClick={fetchReturnsHistory}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw size={14} /> Refresh
            </button>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-black text-[10px] tracking-wider">Ref No</th>
                  <th className="py-3.5 px-4 font-black text-[10px] tracking-wider">Supplier</th>
                  <th className="py-3.5 px-4 text-center font-black text-[10px] tracking-wider">Units Returned</th>
                  <th className="py-3.5 px-4 text-right font-black text-[10px] tracking-wider">Credit Amount</th>
                  <th className="py-3.5 px-4 font-black text-[10px] tracking-wider">Method</th>
                  <th className="py-3.5 px-4 font-black text-[10px] tracking-wider">Date</th>
                  <th className="py-3.5 px-4 text-right font-black text-[10px] tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No purchase return records found.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage).map(ret => (
                    <tr key={ret.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-600">{ret.referenceNumber}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{ret.vendorName}</span>
                        <span className="text-[10px] text-slate-400">{ret.vendorPhone}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-slate-700">{ret.totalUnits} Units</td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-600">
                        {formatCurrency(ret.refundAmount || ret.grandTotal || 0, settings)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 text-slate-700">
                          {ret.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {ret.returnDate || new Date(ret.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingReturnModal(ret)}
                            className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Eye size={12} /> View
                          </button>
                          <button
                            onClick={() => generateDebitNotePDF(ret, true)}
                            className="p-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Print Voucher"
                          >
                            <Printer size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteReturn(ret)}
                            className="p-1 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Delete and Revert Return"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={historyPage}
            totalItems={filteredHistory.length}
            itemsPerPage={historyPerPage}
            onPageChange={setHistoryPage}
            onItemsPerPageChange={setHistoryPerPage}
          />
        </div>
      )}

      {/* View Modal */}
      {viewingReturnModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  Debit Note: {viewingReturnModal.referenceNumber}
                </h3>
                <p className="text-xs text-slate-500">Supplier: {viewingReturnModal.vendorName}</p>
              </div>
              <button
                onClick={() => setViewingReturnModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-500">Supplier:</span>{' '}
                  <strong className="text-slate-900">{viewingReturnModal.vendorName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Date:</span>{' '}
                  <strong className="text-slate-900">{viewingReturnModal.returnDate}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Method:</span>{' '}
                  <strong className="text-slate-900 uppercase">{viewingReturnModal.paymentMethod}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Credit Total:</span>{' '}
                  <strong className="text-rose-600">
                    {formatCurrency(viewingReturnModal.refundAmount || viewingReturnModal.grandTotal, settings)}
                  </strong>
                </div>
                {viewingReturnModal.paymentAccountName && (
                  <div className="col-span-2">
                    <span className="text-slate-500">Account:</span>{' '}
                    <strong className="text-slate-900">{viewingReturnModal.paymentAccountName}</strong>
                  </div>
                )}
              </div>

              <div className="border border-slate-100 rounded-xl overflow-hidden mt-3">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Cost Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(viewingReturnModal.items || []).map((itm: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2.5">
                          <span className="font-bold block text-slate-800">{itm.name}</span>
                          {itm.returnedSerials && itm.returnedSerials.length > 0 && (
                            <span className="text-[10px] text-rose-600 font-mono block mt-0.5">
                              Serials: {itm.returnedSerials.join(', ')}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center font-bold text-slate-700">{itm.returnQty}</td>
                        <td className="p-2.5 text-right font-black text-slate-900">
                          {formatCurrency(itm.total, settings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {viewingReturnModal.note && (
                <div className="p-3 bg-amber-50 rounded-xl text-amber-900 text-xs mt-2 border border-amber-200">
                  <strong>Notes:</strong> {viewingReturnModal.note}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => generateDebitNotePDF(viewingReturnModal, true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={13} /> Print Slip
                </button>
                <button
                  onClick={() => generateDebitNotePDF(viewingReturnModal, false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={13} /> Download PDF
                </button>
              </div>
              <button
                onClick={() => setViewingReturnModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseReturnTab;
