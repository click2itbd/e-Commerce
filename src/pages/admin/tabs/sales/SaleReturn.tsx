import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../../../firebase';
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
  onSnapshot,
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
  ShoppingBag,
  ArrowLeftRight,
  Check,
  X,
  Eye,
  AlertCircle,
  Trash2,
  Calendar,
  User,
  Phone,
  DollarSign,
  CreditCard,
  ShieldCheck,
  RefreshCw,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { generateDocumentNumber } from '../../../../lib/numbering';
import { Pagination } from '../../../../components/common/Pagination';
import { logAudit } from '../../../../lib/audit';
import { PaymentAccount } from '../../../../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { logoBase64 } from '../../../../lib/logoBase64';

interface ReturnItemState {
  productId: string;
  name: string;
  code?: string;
  soldPrice: number;
  soldQty: number;
  alreadyReturnedQty: number;
  returnQty: number;
  returnPrice: number;
  hasSerialTracking?: boolean;
  availableSerials?: string[];
  selectedReturnSerials: string[];
  variantName?: string;
  variantId?: string;
}

interface SaleReturnTabProps {
  fetchData?: () => void;
}

export const SaleReturnTab: React.FC<SaleReturnTabProps> = ({ fetchData }) => {
  const { user } = useAuth();
  const { settings } = useSettings();

  const [activeView, setActiveView] = useState<'create' | 'history'>('create');
  const [customers, setCustomers] = useState<any[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [selectedPaymentAccountId, setSelectedPaymentAccountId] = useState('');

  // Invoice Search & Selection State
  const [orders, setOrders] = useState<any[]>([]);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [isSearchingOrders, setIsSearchingOrders] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderPreviousReturns, setOrderPreviousReturns] = useState<any[]>([]);

  const [returnItems, setReturnItems] = useState<ReturnItemState[]>([]);
  const [referenceNo, setReferenceNo] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'bkash' | 'store_credit'>('cash');
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
    const activeUser = user || auth.currentUser;
    if (activeUser) {
      fetchInitialData();
      generateRefNo();
    }
  }, [user]);

  // Real-time listener for returns history
  useEffect(() => {
    const activeUser = user || auth.currentUser;
    if (!activeUser) return;
    const q = query(collection(db, 'sale_returns'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setReturnsHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.warn('sale_returns onSnapshot orderBy failed, falling back:', err);
        getDocs(collection(db, 'sale_returns'))
          .then((snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            setReturnsHistory(list);
          })
          .catch(e => console.error('Fallback sale_returns fetch failed:', e));
      }
    );
    return () => unsubscribe();
  }, [user]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const generateRefNo = async () => {
    try {
      const ref = await generateDocumentNumber('SR');
      setReferenceNo(ref);
    } catch {
      setReferenceNo(`SR-${Date.now().toString().slice(-6)}`);
    }
  };

  const fetchInitialData = async () => {
    try {
      const results = await Promise.allSettled([
        getDocs(query(collection(db, 'customers'), orderBy('name'))),
        getDocs(query(collection(db, 'payment_accounts'), orderBy('name'))),
        getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100))),
      ]);

      if (results[0].status === 'fulfilled') {
        const custs = results[0].value.docs.map(d => ({ id: d.id, ...d.data() }));
        setCustomers(custs);
      } else {
        getDocs(collection(db, 'customers')).then(snap => {
          setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }).catch(e => console.warn(e));
      }

      if (results[1].status === 'fulfilled') {
        const accs = results[1].value.docs.map(d => ({ id: d.id, ...d.data() } as PaymentAccount));
        setPaymentAccounts(accs);
        if (accs.length > 0 && !selectedPaymentAccountId) {
          setSelectedPaymentAccountId(accs[0].id);
        }
      } else {
        getDocs(collection(db, 'payment_accounts')).then(snap => {
          const accs = snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentAccount));
          setPaymentAccounts(accs);
          if (accs.length > 0 && !selectedPaymentAccountId) {
            setSelectedPaymentAccountId(accs[0].id);
          }
        }).catch(e => console.warn(e));
      }

      if (results[2].status === 'fulfilled') {
        const ords = results[2].value.docs.map(d => ({ id: d.id, ...d.data() }));
        setOrders(ords);
        setSearchResults(ords.slice(0, 10));
      } else {
        getDocs(collection(db, 'orders')).then(snap => {
          const ords = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setOrders(ords);
          setSearchResults(ords.slice(0, 10));
        }).catch(e => console.warn(e));
      }

      fetchReturnsHistory();
    } catch (err) {
      console.error(err);
      toast.error('Failed to load initial data');
    }
  };

  const fetchReturnsHistory = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'sale_returns'), orderBy('createdAt', 'desc')));
      setReturnsHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.warn('Error loading returns history with orderBy, trying unordered:', err);
      try {
        const snap = await getDocs(collection(db, 'sale_returns'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setReturnsHistory(list);
      } catch (fallbackErr) {
        console.error('Fallback returns history failed:', fallbackErr);
      }
    }
  };

  // Perform invoice search (local memory first, then Firestore query if not matched)
  const handleSearchInvoice = async (searchVal: string) => {
    setOrderSearchQuery(searchVal);
    const q = searchVal.trim().toLowerCase();

    if (!q) {
      setSearchResults(orders.slice(0, 10));
      return;
    }

    // Filter memory cache first
    const matched = orders.filter(o => {
      const docNo = (o.documentNumber || o.id || '').toLowerCase();
      const cName = (o.customerName || '').toLowerCase();
      const cPhone = (o.customerPhone || '').toLowerCase();
      return docNo.includes(q) || cName.includes(q) || cPhone.includes(q);
    });

    if (matched.length > 0) {
      setSearchResults(matched.slice(0, 15));
      setIsSearchDropdownOpen(true);
    } else {
      // Query Firestore directly for invoice number or phone
      setIsSearchingOrders(true);
      try {
        const cleanUpper = searchVal.trim().toUpperCase();
        const queries = [
          query(collection(db, 'orders'), where('documentNumber', '==', cleanUpper), limit(5)),
          query(collection(db, 'orders'), where('customerPhone', '==', searchVal.trim()), limit(5)),
        ];
        const [snap1, snap2] = await Promise.all(queries.map(qObj => getDocs(qObj).catch(() => ({ docs: [] }))));
        const remoteResults: any[] = [];
        const seenIds = new Set<string>();

        [...snap1.docs, ...snap2.docs].forEach(d => {
          if (!seenIds.has(d.id)) {
            seenIds.add(d.id);
            remoteResults.push({ id: d.id, ...d.data() });
          }
        });

        setSearchResults(remoteResults);
        setIsSearchDropdownOpen(true);
      } catch (err) {
        console.error('Error querying orders:', err);
      } finally {
        setIsSearchingOrders(false);
      }
    }
  };

  // Select an order and compute remaining returnable quantities
  const handleSelectOrder = async (order: any) => {
    if (!order) {
      setSelectedOrderId('');
      setSelectedOrder(null);
      setReturnItems([]);
      setRefundAmount(0);
      setOrderPreviousReturns([]);
      setIsSearchDropdownOpen(false);
      return;
    }

    setSelectedOrderId(order.id);
    setSelectedOrder(order);
    setIsSearchDropdownOpen(false);
    setOrderSearchQuery(order.documentNumber || order.id);

    // Resolve Customer ID correctly
    let custId = order.customerId || order.customer?.id || '';
    if (!custId && (order.customerName || order.customerPhone)) {
      const foundCust = customers.find(c =>
        c.id === order.customerId ||
        (c.phone && order.customerPhone && c.phone === order.customerPhone) ||
        (c.name && order.customerName && c.name.toLowerCase() === order.customerName.toLowerCase())
      );
      if (foundCust) custId = foundCust.id;
    }
    setSelectedCustomerId(custId);

    // 1. Fetch previous returns for this order from sale_returns
    let previousReturns: any[] = [];
    try {
      const prevSnap = await getDocs(query(collection(db, 'sale_returns'), where('orderId', '==', order.id)));
      previousReturns = prevSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrderPreviousReturns(previousReturns);
    } catch (err) {
      console.error('Error fetching previous returns:', err);
    }

    // Calculate previously returned quantities and serials per product
    const returnedQtyByProd: Record<string, number> = {};
    const returnedSerialsSet = new Set<string>();

    for (const ret of previousReturns) {
      for (const itm of (ret.items || [])) {
        const pKey = itm.productId || itm.name;
        returnedQtyByProd[pKey] = (returnedQtyByProd[pKey] || 0) + (Number(itm.returnQty) || 0);
        if (Array.isArray(itm.returnedSerials)) {
          itm.returnedSerials.forEach((s: string) => returnedSerialsSet.add(s.trim().toLowerCase()));
        }
      }
    }

    // 2. Fetch sold serials from sold_serials
    let orderSoldSerials: any[] = [];
    try {
      const ssSnap = await getDocs(query(collection(db, 'sold_serials'), where('orderId', '==', order.id)));
      orderSoldSerials = ssSnap.docs.map(d => d.data());
    } catch (err) {
      console.error('Error fetching sold serials:', err);
    }

    // 3. Prepare return items state with previous return deductions
    const items: ReturnItemState[] = (order.items || []).map((item: any) => {
      const pKey = item.id || item.productId || item.name;
      const alreadyReturned = returnedQtyByProd[pKey] || 0;
      const soldQty = Number(item.quantity) || 1;

      // Available serials: exclude already returned serials
      const matchingSerials = orderSoldSerials
        .filter(s => (s.productId === item.id || s.productName === item.name) && s.status !== 'returned')
        .map(s => s.serial);

      const rawSerials = (Array.isArray(item.selectedSerials) && item.selectedSerials.length > 0)
        ? item.selectedSerials
        : matchingSerials;

      const filteredAvailableSerials = rawSerials.filter((s: string) => !returnedSerialsSet.has(s.trim().toLowerCase()));

      return {
        productId: item.id || item.productId,
        name: item.name || 'Product',
        code: item.code || item.sku || '',
        soldPrice: Number(item.price || item.unitPrice || 0),
        soldQty,
        alreadyReturnedQty: alreadyReturned,
        returnQty: 0,
        returnPrice: Number(item.price || item.unitPrice || 0),
        hasSerialTracking: Boolean(item.hasSerialTracking || filteredAvailableSerials.length > 0),
        availableSerials: filteredAvailableSerials,
        selectedReturnSerials: [],
        variantName: item.variantName || item.selectedVariant?.name || '',
        variantId: item.variantId || item.selectedVariant?.id || '',
      };
    });

    setReturnItems(items);
    setRefundAmount(0);
  };

  const handleSelectAllReturn = () => {
    const updated = returnItems.map(item => {
      const maxAvailable = Math.max(0, item.soldQty - item.alreadyReturnedQty);
      const selectedSerials = (item.hasSerialTracking && Array.isArray(item.availableSerials))
        ? item.availableSerials.slice(0, maxAvailable)
        : [];
      return {
        ...item,
        returnQty: maxAvailable,
        selectedReturnSerials: selectedSerials,
      };
    });
    setReturnItems(updated);
    recalculateRefund(updated);
  };

  const handleClearAllReturn = () => {
    const updated = returnItems.map(item => ({
      ...item,
      returnQty: 0,
      selectedReturnSerials: [],
    }));
    setReturnItems(updated);
    recalculateRefund(updated);
  };

  const handleReturnQtyChange = (index: number, qty: number) => {
    const updated = [...returnItems];
    const item = updated[index];
    const maxAvailable = Math.max(0, item.soldQty - item.alreadyReturnedQty);
    const clampedQty = Math.max(0, Math.min(maxAvailable, qty));
    item.returnQty = clampedQty;

    // Adjust selected serials if quantity decreased
    if (item.selectedReturnSerials.length > clampedQty) {
      item.selectedReturnSerials = item.selectedReturnSerials.slice(0, clampedQty);
    }

    setReturnItems(updated);
    recalculateRefund(updated);
  };

  const handleToggleSerial = (index: number, serial: string) => {
    const updated = [...returnItems];
    const item = updated[index];
    const maxAvailable = Math.max(0, item.soldQty - item.alreadyReturnedQty);
    const exists = item.selectedReturnSerials.includes(serial);

    if (exists) {
      item.selectedReturnSerials = item.selectedReturnSerials.filter(s => s !== serial);
    } else {
      if (item.selectedReturnSerials.length >= item.returnQty) {
        if (item.returnQty < maxAvailable) {
          item.returnQty += 1;
          item.selectedReturnSerials.push(serial);
        } else {
          toast.error(`Cannot select more serials than available return quantity (${maxAvailable})`);
          return;
        }
      } else {
        item.selectedReturnSerials.push(serial);
      }
    }

    setReturnItems(updated);
    recalculateRefund(updated);
  };

  const recalculateRefund = (items: ReturnItemState[]) => {
    const total = items.reduce((sum, i) => sum + (i.returnQty * i.returnPrice), 0);
    setRefundAmount(total);
  };

  const grandTotalReturn = returnItems.reduce((sum, i) => sum + (i.returnQty * i.returnPrice), 0);
  const totalReturnUnits = returnItems.reduce((sum, i) => sum + i.returnQty, 0);

  // Submit Sale Return
  const handleSubmitReturn = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedOrder) {
      toast.error('দয়া করে প্রথমে বিক্রয় ইনভয়েসটি সিলেক্ট করুন!');
      return;
    }
    if (totalReturnUnits === 0) {
      toast.error('দয়া করে ফেরত নেওয়ার জন্য অন্তত ১টি পণ্যের সংখ্যা (Return Qty) দিন!');
      return;
    }

    // Verify serial numbers for serial-tracked items
    for (const item of returnItems) {
      if (item.returnQty > 0 && item.hasSerialTracking && item.availableSerials && item.availableSerials.length > 0) {
        if (item.selectedReturnSerials.length !== item.returnQty) {
          toast.error(`Please select exactly ${item.returnQty} serial(s) for ${item.name}`);
          return;
        }
      }
    }

    // Resolve payment account
    let chosenAccountId = selectedPaymentAccountId;
    if (refundAmount > 0 && paymentMethod !== 'store_credit') {
      if (!chosenAccountId && paymentAccounts.length > 0) {
        chosenAccountId = paymentAccounts[0].id;
        setSelectedPaymentAccountId(chosenAccountId);
      }
      if (!chosenAccountId) {
        toast.error('Please select a Payment Account to disburse the refund from!');
        return;
      }
    }
    const selectedAcc = paymentAccounts.find(a => a.id === chosenAccountId);

    setIsSubmitting(true);
    try {
      const activeReturnItems = returnItems.filter(i => i.returnQty > 0);
      const safeRefundAmount = Math.max(0, Number(refundAmount) || 0);
      const safeRefNo = referenceNo || `SR-${Date.now().toString().slice(-6)}`;

      // 1. Write sale_returns record
      const returnRecord = {
        referenceNumber: safeRefNo,
        orderId: selectedOrder.id,
        orderDocumentNumber: selectedOrder.documentNumber || selectedOrder.id,
        customerId: selectedCustomerId || selectedOrder.customerId || '',
        customerName: selectedOrder.customerName || 'Walk-in Customer',
        customerPhone: selectedOrder.customerPhone || '',
        customerEmail: selectedOrder.customerEmail || '',
        items: activeReturnItems.map(i => ({
          productId: i.productId || '',
          name: i.name || 'Product',
          soldPrice: Number(i.soldPrice) || 0,
          returnQty: Number(i.returnQty) || 0,
          returnPrice: Number(i.returnPrice) || 0,
          total: (Number(i.returnQty) || 0) * (Number(i.returnPrice) || 0),
          returnedSerials: Array.isArray(i.selectedReturnSerials) ? i.selectedReturnSerials : [],
          variantName: i.variantName || '',
          variantId: i.variantId || '',
        })),
        totalUnits: totalReturnUnits,
        grandTotal: grandTotalReturn,
        refundAmount: safeRefundAmount,
        paymentMethod: paymentMethod || 'cash',
        paymentAccountId: paymentMethod !== 'store_credit' ? (selectedAcc?.id || '') : '',
        paymentAccountName: paymentMethod !== 'store_credit' ? (selectedAcc?.name || '') : '',
        note: note || '',
        returnDate: returnDate || new Date().toISOString().split('T')[0],
        createdBy: user?.displayName || user?.email || 'admin',
        createdAt: new Date().toISOString(),
      };

      const returnDocRef = await addDoc(collection(db, 'sale_returns'), returnRecord);

      // 2. Restock product inventory, variants & serials
      for (const item of activeReturnItems) {
        if (item.productId) {
          const productRef = doc(db, 'products', item.productId);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const currentProd = productSnap.data();
            const updates: any = { stock: increment(item.returnQty) };

            // Restock specific variant if applicable
            if (item.variantName && Array.isArray(currentProd.variants)) {
              const updatedVariants = currentProd.variants.map((v: any) => {
                if (v.name?.toLowerCase() === item.variantName?.toLowerCase() || v.id === item.variantId) {
                  return { ...v, stock: (Number(v.stock) || 0) + item.returnQty };
                }
                return v;
              });
              updates.variants = updatedVariants;
            }

            // Put serials back to availableSerials
            if (item.selectedReturnSerials && item.selectedReturnSerials.length > 0) {
              const currentAvail = currentProd.availableSerials || [];
              updates.availableSerials = Array.from(new Set([...currentAvail, ...item.selectedReturnSerials]));
            }

            await updateDoc(productRef, updates);
          }
        }

        // 3. Mark sold_serials as returned
        for (const serial of item.selectedReturnSerials) {
          try {
            const q = query(
              collection(db, 'sold_serials'),
              where('serial', '==', serial),
              where('orderId', '==', selectedOrder.id)
            );
            const snap = await getDocs(q);
            for (const docSnap of snap.docs) {
              await updateDoc(doc(db, 'sold_serials', docSnap.id), {
                status: 'returned',
                returnedAt: new Date().toISOString(),
                returnReference: safeRefNo,
              });
            }
          } catch (serialErr) {
            console.error('Error updating sold_serials:', serialErr);
          }
        }
      }

      // 4. Update the original Order document (Status & Returned Amount)
      const orderRef = doc(db, 'orders', selectedOrder.id);
      const totalSoldUnitsInOrder = (selectedOrder.items || []).reduce((s: number, i: any) => s + (Number(i.quantity) || 1), 0);
      const totalUnitsReturnedPreviously = orderPreviousReturns.reduce((s, r) => s + (Number(r.totalUnits) || 0), 0);
      const allReturnsTotalUnits = totalUnitsReturnedPreviously + totalReturnUnits;
      const isFullReturn = allReturnsTotalUnits >= totalSoldUnitsInOrder;

      await updateDoc(orderRef, {
        hasReturn: true,
        returnedAmount: increment(safeRefundAmount),
        status: isFullReturn ? 'returned' : 'partially_returned',
        lastReturnReference: safeRefNo,
        lastReturnedAt: new Date().toISOString(),
      });

      // 5. Deduct payment account balance if cash/bank refund
      if (safeRefundAmount > 0 && paymentMethod !== 'store_credit' && selectedAcc?.id) {
        try {
          await updateDoc(doc(db, 'payment_accounts', selectedAcc.id), {
            balance: increment(-safeRefundAmount),
            updatedAt: new Date().toISOString(),
          });
        } catch (accErr) {
          console.error('Error updating payment account balance:', accErr);
        }
      }

      // 6. Log Accounting Transaction
      if (safeRefundAmount > 0) {
        await addDoc(collection(db, 'transactions'), {
          type: 'sale_return',
          amount: safeRefundAmount,
          date: returnRecord.returnDate,
          description: `Sale Return ${safeRefNo} for Invoice #${selectedOrder.documentNumber || selectedOrder.id} (${paymentMethod === 'store_credit' ? 'Due Credit Adjusted' : 'Cash/Bank Refund'})`,
          entityId: selectedCustomerId || selectedOrder.customerId || 'walk-in',
          entityName: selectedOrder.customerName || 'Customer',
          entityType: 'customer',
          referenceId: returnDocRef.id,
          documentNumber: safeRefNo,
          paymentAccountId: paymentMethod !== 'store_credit' ? (selectedAcc?.id || '') : '',
          paymentMethod: paymentMethod === 'store_credit' ? 'store_credit' : (selectedAcc?.type || selectedAcc?.name || paymentMethod),
          createdAt: new Date().toISOString(),
          createdBy: user?.displayName || user?.email || 'Admin',
        });
      }

      // 7. Log Audit Trail
      try {
        await logAudit(
          'CREATE',
          'SaleReturn',
          `Recorded Sale Return #${safeRefNo} (Order #${selectedOrder.documentNumber || selectedOrder.id}, Customer: ${selectedOrder.customerName || 'Walk-in'}, Refund: ৳${safeRefundAmount}, Items: ${totalReturnUnits})`,
          user?.displayName || user?.email || 'Admin',
          {
            entityId: returnDocRef.id,
            newState: {
              referenceNumber: safeRefNo,
              orderId: selectedOrder.id,
              totalUnits: totalReturnUnits,
              refundAmount: safeRefundAmount,
              paymentMethod,
            },
          }
        );
      } catch (auditErr) {
        console.error('Audit log error:', auditErr);
      }

      toast.success(`Sale Return ${safeRefNo} recorded successfully! Stock restocked.`);

      // Open print prompt
      try {
        generateReturnPDF({ id: returnDocRef.id, ...returnRecord }, false);
      } catch (pdfErr) {
        console.error('PDF generation error:', pdfErr);
      }

      // Reset form
      setSelectedOrderId('');
      setSelectedOrder(null);
      setReturnItems([]);
      setRefundAmount(0);
      setNote('');
      setOrderSearchQuery('');
      setOrderPreviousReturns([]);
      generateRefNo();
      fetchReturnsHistory();
      if (fetchData) fetchData();
      setActiveView('history');
    } catch (err: any) {
      console.error('Error processing sale return:', err);
      toast.error('Failed to submit sale return: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete & Revert Sale Return
  const handleDeleteReturn = async (returnRecord: any) => {
    if (
      !window.confirm(
        `Are you sure you want to delete and revert Return ${returnRecord.referenceNumber}? This will revert product stock, reactivate sold serials, and delete financial transactions.`
      )
    ) {
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Revert product stock & serials
      for (const item of returnRecord.items || []) {
        if (item.productId) {
          const productRef = doc(db, 'products', item.productId);
          const prodSnap = await getDoc(productRef);
          if (prodSnap.exists()) {
            const prodData = prodSnap.data();
            const qtyToRevert = Number(item.returnQty) || 0;
            const updates: any = {
              stock: Math.max(0, (Number(prodData.stock) || 0) - qtyToRevert),
            };

            // Revert variant stock if applicable
            if (item.variantName && Array.isArray(prodData.variants)) {
              const updatedVariants = prodData.variants.map((v: any) => {
                if (v.name?.toLowerCase() === item.variantName?.toLowerCase() || v.id === item.variantId) {
                  return { ...v, stock: Math.max(0, (Number(v.stock) || 0) - qtyToRevert) };
                }
                return v;
              });
              updates.variants = updatedVariants;
            }

            // Remove returned serials from availableSerials
            if (Array.isArray(item.returnedSerials) && item.returnedSerials.length > 0) {
              const currentAvail = prodData.availableSerials || [];
              const returnedSet = new Set(item.returnedSerials);
              updates.availableSerials = currentAvail.filter((s: string) => !returnedSet.has(s));
            }

            await updateDoc(productRef, updates);
          }
        }

        // Revert sold_serials back to 'active' / sold
        if (Array.isArray(item.returnedSerials)) {
          for (const serial of item.returnedSerials) {
            try {
              const q = query(
                collection(db, 'sold_serials'),
                where('serial', '==', serial),
                where('orderId', '==', returnRecord.orderId)
              );
              const snap = await getDocs(q);
              for (const docSnap of snap.docs) {
                await updateDoc(doc(db, 'sold_serials', docSnap.id), {
                  status: 'sold',
                  returnedAt: null,
                  returnReference: null,
                });
              }
            } catch (err) {
              console.error('Error reverting sold_serials:', err);
            }
          }
        }
      }

      // 2. Revert payment account balance if cash was disbursed
      if (
        returnRecord.paymentMethod !== 'store_credit' &&
        returnRecord.paymentAccountId &&
        Number(returnRecord.refundAmount) > 0
      ) {
        try {
          await updateDoc(doc(db, 'payment_accounts', returnRecord.paymentAccountId), {
            balance: increment(Number(returnRecord.refundAmount)),
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

      // 4. Revert order status & returnedAmount
      if (returnRecord.orderId) {
        const orderRef = doc(db, 'orders', returnRecord.orderId);
        const oSnap = await getDoc(orderRef);
        if (oSnap.exists()) {
          const oData = oSnap.data();
          const newReturnedAmount = Math.max(
            0,
            (Number(oData.returnedAmount) || 0) - (Number(returnRecord.refundAmount) || Number(returnRecord.grandTotal) || 0)
          );
          await updateDoc(orderRef, {
            returnedAmount: newReturnedAmount,
            hasReturn: newReturnedAmount > 0,
            status: newReturnedAmount > 0 ? 'partially_returned' : 'delivered',
          });
        }
      }

      // 5. Delete sale_returns record
      await deleteDoc(doc(db, 'sale_returns', returnRecord.id));

      // 6. Log audit
      await logAudit(
        'DELETE',
        'SaleReturn',
        `Reverted & deleted Sale Return #${returnRecord.referenceNumber} for Order #${returnRecord.orderDocumentNumber}`,
        user?.displayName || user?.email || 'admin'
      );

      toast.success(`Sale return ${returnRecord.referenceNumber} reverted and deleted successfully!`);
      fetchReturnsHistory();
      if (fetchData) fetchData();
    } catch (err: any) {
      console.error('Error deleting sale return:', err);
      toast.error('Failed to delete sale return: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate Return Voucher / Credit Note PDF
  const generateReturnPDF = (returnRecord: any, autoPrint = false) => {
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
      doc.text('CREDIT NOTE / SALE RETURN VOUCHER', 14, 32);
      doc.setTextColor(0, 0, 0);

      // Meta Box
      doc.setDrawColor(220, 220, 220);
      doc.rect(14, 36, 182, 24);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Return Voucher #: ${returnRecord.referenceNumber || 'N/A'}`, 18, 43);
      doc.text(`Original Invoice #: ${returnRecord.orderDocumentNumber || 'N/A'}`, 18, 49);
      doc.text(`Return Date: ${returnRecord.returnDate || new Date(returnRecord.createdAt).toLocaleDateString()}`, 18, 55);

      doc.text(`Customer: ${returnRecord.customerName || 'Walk-in'}`, 110, 43);
      doc.text(`Phone: ${returnRecord.customerPhone || 'N/A'}`, 110, 49);
      doc.text(`Refund Method: ${(returnRecord.paymentMethod || 'cash').toUpperCase()}`, 110, 55);

      // Table of Returned Items
      const tableData = (returnRecord.items || []).map((itm: any, idx: number) => {
        let nameCol = itm.name || 'Item';
        if (itm.variantName) nameCol += ` (${itm.variantName})`;
        if (Array.isArray(itm.returnedSerials) && itm.returnedSerials.length > 0) {
          nameCol += `\nSerials: ${itm.returnedSerials.join(', ')}`;
        }
        return [
          idx + 1,
          nameCol,
          itm.returnQty,
          `৳${Number(itm.returnPrice || 0).toLocaleString()}`,
          `৳${Number(itm.total || (itm.returnQty * itm.returnPrice) || 0).toLocaleString()}`,
        ];
      });

      autoTable(doc, {
        startY: 64,
        head: [['#', 'Item Description / Serials', 'Return Qty', 'Unit Price', 'Total']],
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
      doc.text(`Refund / Credit Amount: ৳${Number(returnRecord.refundAmount || returnRecord.grandTotal || 0).toLocaleString()}`, 120, finalY);
      doc.setTextColor(0, 0, 0);

      if (returnRecord.note) {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.text(`Reason/Note: ${returnRecord.note}`, 14, finalY + 8);
      }

      // Signatures
      const sigY = finalY + 28;
      doc.setFontSize(8);
      doc.line(14, sigY, 65, sigY);
      doc.text('Customer Signature', 22, sigY + 5);

      doc.line(140, sigY, 195, sigY);
      doc.text('Authorized Signature', 150, sigY + 5);

      if (autoPrint) {
        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
      } else {
        doc.save(`Return-${returnRecord.referenceNumber || 'Voucher'}.pdf`);
      }
    } catch (err) {
      console.error('Error generating Return PDF:', err);
      toast.error('Failed to generate return voucher');
    }
  };

  const filteredHistory = returnsHistory.filter(r => {
    if (!historySearch) return true;
    const q = historySearch.toLowerCase();
    return (
      (r.referenceNumber || '').toLowerCase().includes(q) ||
      (r.orderDocumentNumber || '').toLowerCase().includes(q) ||
      (r.customerName || '').toLowerCase().includes(q) ||
      (r.customerPhone || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden flex flex-col">
      {/* Top Header & View Switcher */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 to-[#081621] text-white border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-400/30 text-red-300 text-[10px] font-black uppercase tracking-widest mb-3">
              <RotateCcw size={12} className="text-red-400" /> Returns & Refunds
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              Sale Return Management
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">
              Accept customer returns, restock inventory, void warranty serials, adjust customer ledger, and print credit notes securely.
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
              <Plus size={16} /> New Sale Return
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
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-sm mt-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Reference No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={referenceNo}
                readOnly
                className="w-full border-slate-200 rounded-xl bg-slate-100 text-sm font-mono font-bold text-slate-500 px-4 py-2.5 outline-none"
              />
            </div>

            {/* Smart Searchable Invoice Picker */}
            <div className="relative" ref={searchBoxRef}>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Find Sale Invoice / Memo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type Invoice #, Phone or Customer..."
                  value={orderSearchQuery}
                  onFocus={() => setIsSearchDropdownOpen(true)}
                  onChange={e => handleSearchInvoice(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 pl-10 pr-4 py-2.5 shadow-sm transition-all"
                />
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                {isSearchingOrders && (
                  <RefreshCw size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {isSearchDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 font-medium">
                      No invoices found matching &quot;{orderSearchQuery}&quot;
                    </div>
                  ) : (
                    searchResults.map(ord => (
                      <div
                        key={ord.id}
                        onClick={() => handleSelectOrder(ord)}
                        className={cn(
                          'p-3 hover:bg-blue-50/70 cursor-pointer transition-colors flex items-center justify-between text-xs',
                          selectedOrderId === ord.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                        )}
                      >
                        <div>
                          <div className="font-mono font-bold text-blue-700 text-sm">
                            #{ord.documentNumber || ord.id.slice(0, 8)}
                          </div>
                          <div className="text-slate-800 font-semibold mt-0.5">
                            {ord.customerName || 'Walk-in Customer'}
                            {ord.customerPhone && <span className="text-slate-400 font-normal ml-2">({ord.customerPhone})</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-slate-900 text-sm">
                            {formatCurrency(ord.total || 0, settings)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : ''}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
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
                className="w-full bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 px-4 py-2.5 shadow-sm transition-all"
              />
            </div>
          </div>

          {/* Selected Order Summary Card */}
          {selectedOrder && (() => {
            const orderTotal = Number(selectedOrder.total) || 0;
            const orderPaid = Number(
              selectedOrder.amountPaid ?? selectedOrder.paidAmount ?? (selectedOrder.paymentStatus === 'paid' ? orderTotal : 0)
            ) || 0;
            const orderDue = Math.max(0, orderTotal - orderPaid);

            return (
              <div className="space-y-3">
                <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm shadow-sm">
                  <div>
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-1">
                      Customer Information
                    </span>
                    <span className="font-bold text-slate-800 block text-base">
                      {selectedOrder.customerName || 'Walk-in Customer'}
                    </span>
                    <span className="text-slate-500 font-medium mt-0.5 block text-xs">
                      Phone: {selectedOrder.customerPhone || 'N/A'} | Email: {selectedOrder.customerEmail || 'N/A'}
                    </span>
                  </div>

                  {orderPreviousReturns.length > 0 && (
                    <div className="bg-amber-100/70 border border-amber-300 rounded-xl p-3 text-xs text-amber-900">
                      <span className="font-bold block flex items-center gap-1.5 text-amber-800">
                        <AlertCircle size={14} className="text-amber-600" /> পূর্বে এই ইনভয়েসের কিছু পণ্য রিটার্ন হয়েছে:
                      </span>
                      <div className="mt-1 font-medium">
                        মোট {orderPreviousReturns.length} টি পূর্ববর্তী রিটার্ন স্লিপে {orderPreviousReturns.reduce((s, r) => s + (Number(r.totalUnits) || 0), 0)} টি পণ্য ফেরত দেওয়া হয়েছে।
                      </div>
                    </div>
                  )}

                  <div className="sm:text-right bg-white/80 p-3 rounded-xl border border-blue-100 shrink-0">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">
                      Invoice Financials
                    </span>
                    <div className="font-black text-blue-900 text-lg">
                      {formatCurrency(orderTotal, settings)}
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 mt-0.5 flex items-center gap-2 justify-end">
                      <span>Paid: <strong className="text-emerald-700">{formatCurrency(orderPaid, settings)}</strong></span>
                      {orderDue > 0 && (
                        <span>Due: <strong className="text-rose-600">{formatCurrency(orderDue, settings)}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                {orderDue > 0 && (
                  <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
                    <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold block text-sm text-amber-950">
                        ইনভয়েসে বকেয়া (Due) রয়েছে: {formatCurrency(orderDue, settings)}
                      </strong>
                      <p className="mt-0.5 text-amber-800">
                        কাস্টমারকে সরাসরি ক্যাশ ফেরত না দিয়ে <strong>"Customer Due / Credit Note (বকেয়া সমন্বয়)"</strong> সিলেক্ট করুন যাতে কাস্টমারের বকেয়া খাতা থেকে এই রিটার্ন টাকা স্বয়ংক্রিয়ভাবে সমন্বয় হয়ে বকেয়া কমে যায়।
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Items Return Table */}
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
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CheckSquare size={14} /> সমস্ত পণ্য ফেরত (Full Return)
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
                    Item Name / Details
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Sold Qty
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Already Returned
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Return Qty
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                    Unit Price
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                    Return Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {returnItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <ShoppingBag size={28} className="text-slate-300 mb-2" />
                        <span className="font-bold text-slate-600">No Items to Return</span>
                        <span className="text-xs text-slate-400">
                          Search and choose a sale invoice above to view sold items and choose quantities.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  returnItems.map((item, idx) => {
                    const maxAvailable = Math.max(0, item.soldQty - item.alreadyReturnedQty);
                    const isFullyReturned = maxAvailable === 0;

                    return (
                      <tr
                        key={idx}
                        className={cn(
                          'transition-colors group',
                          isFullyReturned ? 'bg-slate-50 opacity-60' : item.returnQty > 0 ? 'bg-red-50/50' : 'hover:bg-slate-50/80'
                        )}
                      >
                        <td className="py-4 px-6 font-mono text-sm text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-900 block text-sm">
                            {item.name}
                            {item.variantName ? ` - ${item.variantName}` : ''}
                          </span>
                          {isFullyReturned ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded mt-1">
                              ✓ সমস্ত পণ্য পূর্বে ফেরত নেওয়া হয়েছে (Fully Returned)
                            </span>
                          ) : item.alreadyReturnedQty > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded mt-1">
                              আংশিক রিটার্ন হয়েছে (ফেরত দেওয়া বাকি: {maxAvailable} টি)
                            </span>
                          ) : null}

                          {/* Serials picker */}
                          {item.hasSerialTracking && item.availableSerials && item.availableSerials.length > 0 && !isFullyReturned && (
                            <div className="mt-3 bg-white p-3 rounded-xl border border-slate-200">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                                Select Returned Serials ({item.selectedReturnSerials.length} / {item.returnQty})
                              </span>
                              <div className="flex flex-wrap gap-2">
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
                                          ? 'bg-red-500 text-white border-red-500 shadow-sm'
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
                        <td className="py-4 px-6 text-center font-black text-slate-600 text-sm">{item.soldQty}</td>
                        <td className="py-4 px-6 text-center font-black text-amber-700 text-sm">
                          {item.alreadyReturnedQty > 0 ? `${item.alreadyReturnedQty} টি` : '-'}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="inline-flex items-center justify-center gap-1">
                            <button
                              type="button"
                              disabled={isFullyReturned || item.returnQty <= 0}
                              onClick={() => handleReturnQtyChange(idx, item.returnQty - 1)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed font-black text-sm transition-all"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={maxAvailable}
                              disabled={isFullyReturned}
                              value={item.returnQty}
                              onChange={e => handleReturnQtyChange(idx, parseInt(e.target.value) || 0)}
                              className={cn(
                                'w-16 text-center border rounded-xl text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none px-1 py-1 transition-all',
                                isFullyReturned
                                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                  : item.returnQty > 0
                                  ? 'border-red-400 bg-red-50/30 text-red-600'
                                  : 'border-slate-200 bg-slate-50 text-slate-700'
                              )}
                            />
                            <button
                              type="button"
                              disabled={isFullyReturned || item.returnQty >= maxAvailable}
                              onClick={() => handleReturnQtyChange(idx, item.returnQty + 1)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed font-black text-sm transition-all"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-slate-500 text-sm">
                          {formatCurrency(item.returnPrice, settings)}
                        </td>
                        <td className="py-4 px-6 text-right font-black text-slate-900 text-sm">
                          {item.returnQty > 0 ? (
                            <span className="text-red-600 bg-red-100 px-2.5 py-1 rounded-lg">
                              {formatCurrency(item.returnQty * item.returnPrice, settings)}
                            </span>
                          ) : (
                            formatCurrency(0, settings)
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Refund Settlement Footer */}
          {returnItems.length > 0 && (
            <div className="flex flex-col lg:flex-row justify-between gap-6 pt-6 border-t border-slate-100 mt-6">
              <div className="flex-1 space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Return Reason / Internal Notes
                </label>
                <textarea
                  rows={4}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Defective unit, customer requested replacement, wrong model delivered..."
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
                  <span className="font-black text-xl text-red-600">
                    {formatCurrency(grandTotalReturn, settings)}
                  </span>
                </div>

                <div className="pt-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Refund / Settlement Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none px-4 py-2.5 transition-all"
                  >
                    <option value="cash">Cash Refund (নগদ ফেরত)</option>
                    <option value="bank">Bank Transfer Refund (ব্যাংক ট্রান্সফার)</option>
                    <option value="bkash">bKash / MFS Refund (বিকাশ / নগদ)</option>
                    <option value="store_credit">Customer Due / Credit Note (বকেয়া সমন্বয়)</option>
                  </select>
                </div>

                {/* Refund Source Account dropdown */}
                {paymentMethod !== 'store_credit' ? (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Refund Source Account <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedPaymentAccountId}
                      onChange={e => setSelectedPaymentAccountId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none px-4 py-2.5 transition-all"
                    >
                      <option value="">-- Select Source Account --</option>
                      {paymentAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.type})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">টাকা এই অ্যাকাউন্ট থেকে বের হবে এবং ডে-বুকে রেকর্ড হবে।</p>
                  </div>
                ) : (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800 font-medium">
                    ✓ কাস্টমারের বকেয়া খাতা (Customer Due / Ledger) থেকে এই রিটার্ন সমপরিমাণ টাকা সমন্বয় হয়ে বকেয়া কমে যাবে।
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Refund Amount to Customer <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={refundAmount}
                    onChange={e => setRefundAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border-2 border-red-100 focus:border-red-400 rounded-xl text-lg font-black text-red-600 focus:ring-4 focus:ring-red-500/10 outline-none px-4 py-2.5 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/25 disabled:opacity-60 mt-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" /> Processing Return...
                    </>
                  ) : (
                    <>
                      <CheckSquare size={18} /> Confirm Sale Return (ফেরত সম্পন্ন করুন)
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
                placeholder="Search returns by Ref, Invoice, Customer..."
                value={historySearch}
                onChange={e => {
                  setHistorySearch(e.target.value);
                  setHistoryPage(1);
                }}
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
              />
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <button
              onClick={fetchReturnsHistory}
              className="px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 flex items-center gap-1.5"
            >
              <RotateCcw size={14} /> Refresh
            </button>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4">Ref No</th>
                  <th className="py-3.5 px-4">Original Invoice</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4 text-center">Items Returned</th>
                  <th className="py-3.5 px-4 text-right">Refund Amount</th>
                  <th className="py-3.5 px-4">Method / Account</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      No sale return records found.
                    </td>
                  </tr>
                ) : (
                  filteredHistory
                    .slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage)
                    .map(ret => (
                      <tr key={ret.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{ret.referenceNumber}</td>
                        <td className="py-3.5 px-4 font-mono text-gray-700">#{ret.orderDocumentNumber}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-gray-900 block">{ret.customerName}</span>
                          <span className="text-[10px] text-gray-400">{ret.customerPhone}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-gray-700">{ret.totalUnits} Units</td>
                        <td className="py-3.5 px-4 text-right font-bold text-red-600">
                          {formatCurrency(ret.refundAmount || ret.grandTotal || 0, settings)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-gray-100 text-gray-700 block w-fit">
                            {ret.paymentMethod}
                          </span>
                          {ret.paymentAccountName && (
                            <span className="text-[9px] text-gray-400 block mt-0.5">{ret.paymentAccountName}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500">
                          {ret.returnDate || new Date(ret.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => generateReturnPDF(ret, true)}
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                              title="Print Return Voucher"
                            >
                              <Printer size={14} />
                            </button>
                            <button
                              onClick={() => generateReturnPDF(ret, false)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Download PDF"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              onClick={() => setViewingReturnModal(ret)}
                              className="px-2 py-1 text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded flex items-center gap-1"
                            >
                              <Eye size={12} /> View
                            </button>
                            <button
                              onClick={() => handleDeleteReturn(ret)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Revert & Delete Return"
                            >
                              <Trash2 size={14} />
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

      {/* View Return Modal */}
      {viewingReturnModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-900">
                  Return Details: {viewingReturnModal.referenceNumber}
                </h3>
                <p className="text-xs text-gray-500">
                  Original Invoice #{viewingReturnModal.orderDocumentNumber}
                </p>
              </div>
              <button onClick={() => setViewingReturnModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg">
                <div>
                  <span className="text-gray-500">Customer:</span>{' '}
                  <strong className="text-gray-900">{viewingReturnModal.customerName}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Date:</span>{' '}
                  <strong className="text-gray-900">{viewingReturnModal.returnDate}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Method:</span>{' '}
                  <strong className="text-gray-900 uppercase">{viewingReturnModal.paymentMethod}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Refund Amount:</span>{' '}
                  <strong className="text-red-600">
                    {formatCurrency(viewingReturnModal.refundAmount || viewingReturnModal.grandTotal, settings)}
                  </strong>
                </div>
                {viewingReturnModal.paymentAccountName && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Source Account:</span>{' '}
                    <strong className="text-gray-900">{viewingReturnModal.paymentAccountName}</strong>
                  </div>
                )}
              </div>

              <div className="border border-gray-100 rounded-lg overflow-hidden mt-3">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-600 font-bold">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Refund Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(viewingReturnModal.items || []).map((itm: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <span className="font-bold block">
                            {itm.name} {itm.variantName ? `(${itm.variantName})` : ''}
                          </span>
                          {itm.returnedSerials && itm.returnedSerials.length > 0 && (
                            <span className="text-[10px] text-red-600 font-mono block">
                              Serials: {itm.returnedSerials.join(', ')}
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-center font-bold">{itm.returnQty}</td>
                        <td className="p-2 text-right font-bold text-gray-900">
                          {formatCurrency(itm.total, settings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {viewingReturnModal.note && (
                <div className="p-3 bg-amber-50 rounded-lg text-amber-900 text-xs mt-2">
                  <strong>Notes:</strong> {viewingReturnModal.note}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => generateReturnPDF(viewingReturnModal, true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Printer size={13} /> Print Slip
                </button>
                <button
                  onClick={() => generateReturnPDF(viewingReturnModal, false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Download size={13} /> Download PDF
                </button>
              </div>
              <button
                onClick={() => setViewingReturnModal(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg"
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

export default SaleReturnTab;
