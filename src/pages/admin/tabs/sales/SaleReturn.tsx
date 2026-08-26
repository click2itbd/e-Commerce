import React, { useState, useEffect } from 'react';
import { db } from '../../../../firebase';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
import { RotateCcw, Plus, Download, Printer, CheckSquare, Search, FileText, ShoppingBag, ArrowLeftRight, Check, X, Eye } from 'lucide-react';
import { generateDocumentNumber } from '../../../../lib/numbering';
import { Pagination } from '../../../../components/common/Pagination';

interface ReturnItemState {
  productId: string;
  name: string;
  code?: string;
  soldPrice: number;
  soldQty: number;
  returnQty: number;
  returnPrice: number;
  hasSerialTracking?: boolean;
  availableSerials?: string[];
  selectedReturnSerials: string[];
}

export const SaleReturnTab: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useSettings();

  const [activeView, setActiveView] = useState<'create' | 'history'>('create');
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
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
    fetchInitialData();
    generateRefNo();
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
      const custSnap = await getDocs(query(collection(db, 'customers'), orderBy('name')));
      setCustomers(custSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(150)));
      setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })));

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
      console.error('Error loading returns history:', err);
    }
  };

  const handleSelectOrder = async (orderId: string) => {
    setSelectedOrderId(orderId);
    if (!orderId) {
      setSelectedOrder(null);
      setReturnItems([]);
      setRefundAmount(0);
      return;
    }

    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      if (order.customerName) {
        const foundCust = customers.find(c => c.name?.toLowerCase() === order.customerName?.toLowerCase() || c.phone === order.customerPhone);
        if (foundCust) setSelectedCustomerId(foundCust.id);
      }

      // Fetch sold serials for this order from sold_serials
      let orderSoldSerials: any[] = [];
      try {
        const ssSnap = await getDocs(query(collection(db, 'sold_serials'), where('orderId', '==', order.id)));
        orderSoldSerials = ssSnap.docs.map(d => d.data());
      } catch (err) {
        console.error('Error fetching sold serials:', err);
      }

      // Prepare items state
      const items: ReturnItemState[] = (order.items || []).map((item: any) => {
        const matchingSerials = orderSoldSerials
          .filter(s => s.productId === item.id || s.productName === item.name)
          .filter(s => s.status !== 'returned')
          .map(s => s.serial);

        const availableSerials = item.selectedSerials && item.selectedSerials.length > 0
          ? item.selectedSerials
          : matchingSerials;

        return {
          productId: item.id || item.productId,
          name: item.name || 'Product',
          code: item.code || item.sku || '',
          soldPrice: item.price || item.unitPrice || 0,
          soldQty: item.quantity || 1,
          returnQty: 0,
          returnPrice: item.price || item.unitPrice || 0,
          hasSerialTracking: item.hasSerialTracking || availableSerials.length > 0,
          availableSerials: availableSerials,
          selectedReturnSerials: [],
        };
      });

      setReturnItems(items);
      setRefundAmount(0);
    }
  };

  const handleReturnQtyChange = (index: number, qty: number) => {
    const updated = [...returnItems];
    const item = updated[index];
    const clampedQty = Math.max(0, Math.min(item.soldQty, qty));
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
    const exists = item.selectedReturnSerials.includes(serial);

    if (exists) {
      item.selectedReturnSerials = item.selectedReturnSerials.filter(s => s !== serial);
    } else {
      if (item.selectedReturnSerials.length >= item.returnQty) {
        // Automatically increase return qty if adding serial
        if (item.returnQty < item.soldQty) {
          item.returnQty += 1;
          item.selectedReturnSerials.push(serial);
        } else {
          toast.error(`Cannot select more serials than sold quantity (${item.soldQty})`);
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

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) {
      toast.error('Please select an original sale invoice');
      return;
    }
    if (totalReturnUnits === 0) {
      toast.error('Please select at least 1 item quantity to return');
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

    setIsSubmitting(true);
    try {
      const activeReturnItems = returnItems.filter(i => i.returnQty > 0);

      // 1. Write sale_returns record
      const returnRecord = {
        referenceNumber: referenceNo,
        orderId: selectedOrder.id,
        orderDocumentNumber: selectedOrder.documentNumber || selectedOrder.id,
        customerName: selectedOrder.customerName || 'Walk-in Customer',
        customerPhone: selectedOrder.customerPhone || '',
        customerEmail: selectedOrder.customerEmail || '',
        items: activeReturnItems.map(i => ({
          productId: i.productId,
          name: i.name,
          returnQty: i.returnQty,
          returnPrice: i.returnPrice,
          total: i.returnQty * i.returnPrice,
          returnedSerials: i.selectedReturnSerials,
        })),
        totalUnits: totalReturnUnits,
        grandTotal: grandTotalReturn,
        refundAmount: refundAmount,
        paymentMethod: paymentMethod,
        note: note,
        returnDate: returnDate,
        createdBy: user?.email || 'admin',
        createdAt: new Date().toISOString(),
      };

      const returnDocRef = await addDoc(collection(db, 'sale_returns'), returnRecord);

      // 2. Restock product inventory & serials
      for (const item of activeReturnItems) {
        if (item.productId) {
          const productRef = doc(db, 'products', item.productId);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const currentProd = productSnap.data();
            const newStock = (currentProd.stock || 0) + item.returnQty;
            const updates: any = { stock: newStock };

            if (item.selectedReturnSerials && item.selectedReturnSerials.length > 0) {
              const currentAvail = currentProd.availableSerials || [];
              updates.availableSerials = Array.from(new Set([...currentAvail, ...item.selectedReturnSerials]));
            }

            await updateDoc(productRef, updates);
          }
        }

        // 3. Mark sold_serials as returned
        for (const serial of item.selectedReturnSerials) {
          const q = query(collection(db, 'sold_serials'), where('serial', '==', serial), where('orderId', '==', selectedOrder.id));
          const snap = await getDocs(q);
          for (const docSnap of snap.docs) {
            await updateDoc(doc(db, 'sold_serials', docSnap.id), {
              status: 'returned',
              returnedAt: new Date().toISOString(),
              returnReference: referenceNo,
            });
          }
        }
      }

      // 4. Log Accounting Transaction
      if (refundAmount > 0) {
        await addDoc(collection(db, 'transactions'), {
          type: 'sale_return',
          amount: refundAmount,
          date: returnDate,
          description: `Sale Return ${referenceNo} (Invoice #${selectedOrder.documentNumber || selectedOrder.id})`,
          entityId: selectedCustomerId || selectedOrder.customerName || 'customer',
          entityName: selectedOrder.customerName || 'Customer',
          referenceId: returnDocRef.id,
          paymentMethod: paymentMethod,
          createdAt: new Date().toISOString(),
        });
      }

      toast.success(`Sale Return ${referenceNo} recorded successfully! Stock restocked.`);
      
      // Reset form
      setSelectedOrderId('');
      setSelectedOrder(null);
      setReturnItems([]);
      setRefundAmount(0);
      setNote('');
      generateRefNo();
      fetchReturnsHistory();
      setActiveView('history');
    } catch (err: any) {
      console.error('Error processing sale return:', err);
      toast.error('Failed to submit sale return: ' + err.message);
    } finally {
      setIsSubmitting(false);
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden space-y-6">
      {/* Top Header & View Switcher */}
      <div className="p-6 pb-0 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <RotateCcw className="text-[#EF4444]" /> Sale Return Management
          </h2>
          <p className="text-xs text-gray-500 mt-1">Accept customer returns, restock inventory, void warranty serials, and log refunds.</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveView('create')}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2",
              activeView === 'create' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Plus size={14} /> New Sale Return
          </button>
          <button
            onClick={() => { setActiveView('history'); fetchReturnsHistory(); }}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2",
              activeView === 'history' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <FileText size={14} /> Return History
            <span className="bg-gray-200 text-gray-700 text-[10px] px-1.5 py-0.2 rounded-full">
              {returnsHistory.length}
            </span>
          </button>
        </div>
      </div>

      {activeView === 'create' ? (
        <form onSubmit={handleSubmitReturn} className="p-6 pt-0 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Reference No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={referenceNo}
                readOnly
                className="w-full border-gray-200 rounded-lg bg-gray-100 text-xs font-mono font-bold text-gray-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Select Sale Invoice <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedOrderId}
                onChange={e => handleSelectOrder(e.target.value)}
                className="w-full border-gray-200 rounded-lg text-xs focus:ring-[#EF4444] font-medium"
              >
                <option value="">-- Choose Sold Invoice --</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    #{o.documentNumber || o.id.slice(0, 8)} — {o.customerName || 'Walk-in'} ({formatCurrency(o.total || 0, settings)}) — {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Return Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={returnDate}
                onChange={e => setReturnDate(e.target.value)}
                className="w-full border-gray-200 rounded-lg text-xs focus:ring-[#EF4444]"
              />
            </div>
          </div>

          {/* Selected Order Summary Card */}
          {selectedOrder && (
            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div>
                <span className="font-bold text-gray-700 block">Customer Name: {selectedOrder.customerName || 'N/A'}</span>
                <span className="text-gray-500">Phone: {selectedOrder.customerPhone || 'N/A'} | Email: {selectedOrder.customerEmail || 'N/A'}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-blue-900 block">Invoice Total: {formatCurrency(selectedOrder.total || 0, settings)}</span>
                <span className="text-gray-500">Status: <span className="uppercase font-bold text-green-700">{selectedOrder.status}</span></span>
              </div>
            </div>
          )}

          {/* Items Return Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Item Name / Details</th>
                  <th className="py-3 px-4 text-center">Sold Qty</th>
                  <th className="py-3 px-4 text-center">Return Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Return Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {returnItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      Select a sale invoice above to view sold items and choose quantities to return.
                    </td>
                  </tr>
                ) : (
                  returnItems.map((item, idx) => (
                    <tr key={idx} className={item.returnQty > 0 ? "bg-red-50/30" : ""}>
                      <td className="py-3 px-4 font-mono text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-gray-900 block">{item.name}</span>
                        {item.hasSerialTracking && item.availableSerials && item.availableSerials.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <span className="text-[10px] font-bold text-gray-500 uppercase block">Select Returned Serials:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {item.availableSerials.map(ser => {
                                const isSelected = item.selectedReturnSerials.includes(ser);
                                return (
                                  <button
                                    key={ser}
                                    type="button"
                                    onClick={() => handleToggleSerial(idx, ser)}
                                    className={cn(
                                      "px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 border transition-all",
                                      isSelected
                                        ? "bg-red-600 text-white border-red-600"
                                        : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                                    )}
                                  >
                                    {isSelected && <Check size={10} />} {ser}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-700">{item.soldQty}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={item.soldQty}
                            value={item.returnQty}
                            onChange={e => handleReturnQtyChange(idx, parseInt(e.target.value) || 0)}
                            className="w-16 text-center border-gray-200 rounded-lg text-xs font-bold focus:ring-[#EF4444]"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-600">{formatCurrency(item.returnPrice, settings)}</td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(item.returnQty * item.returnPrice, settings)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Refund Settlement Footer */}
          {returnItems.length > 0 && (
            <div className="flex flex-col lg:flex-row justify-between gap-6 pt-4 border-t border-gray-100">
              <div className="flex-1 space-y-3">
                <label className="block text-xs font-bold text-gray-700">Return Reason / Internal Notes</label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Defective unit, customer requested refund, wrong specification delivered..."
                  className="w-full border-gray-200 rounded-xl text-xs focus:ring-[#EF4444]"
                />
              </div>

              <div className="w-full lg:w-96 bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>Total Items to Return:</span>
                  <span className="font-bold text-gray-900">{totalReturnUnits} Units</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>Grand Return Total:</span>
                  <span className="font-bold text-lg text-red-600">{formatCurrency(grandTotalReturn, settings)}</span>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Refund / Settlement Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:ring-[#EF4444]"
                  >
                    <option value="cash">Cash Drawer Refund</option>
                    <option value="bank">Bank Transfer Refund</option>
                    <option value="bkash">bKash / MFS Refund</option>
                    <option value="store_credit">Customer Due / Credit Note Adjustment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Refund Amount to Customer <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={refundAmount}
                    onChange={e => setRefundAmount(parseFloat(e.target.value) || 0)}
                    className="w-full border-gray-200 rounded-lg text-sm font-bold text-gray-900 focus:ring-[#EF4444]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || totalReturnUnits === 0}
                  className="w-full py-3 bg-[#081621] hover:bg-[#EF4444] text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <CheckSquare size={16} /> {isSubmitting ? 'Processing Return...' : 'Confirm & Process Sale Return'}
                </button>
              </div>
            </div>
          )}
        </form>
      ) : (
        /* History View */
        <div className="p-6 pt-0 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm flex-1">
              <input
                type="text"
                placeholder="Search returns by Ref, Invoice, Customer..."
                value={historySearch}
                onChange={e => { setHistorySearch(e.target.value); setHistoryPage(1); }}
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
                  <th className="py-3.5 px-4">Method</th>
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
                  filteredHistory.slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage).map(ret => (
                    <tr key={ret.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{ret.referenceNumber}</td>
                      <td className="py-3.5 px-4 font-mono text-gray-700">#{ret.orderDocumentNumber}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 block">{ret.customerName}</span>
                        <span className="text-[10px] text-gray-400">{ret.customerPhone}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-gray-700">{ret.totalUnits} Units</td>
                      <td className="py-3.5 px-4 text-right font-bold text-red-600">{formatCurrency(ret.refundAmount || ret.grandTotal || 0, settings)}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-gray-100 text-gray-700">
                          {ret.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">{ret.returnDate || new Date(ret.createdAt).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setViewingReturnModal(ret)}
                          className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded flex items-center gap-1 ml-auto"
                        >
                          <Eye size={12} /> View
                        </button>
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
                <h3 className="font-bold text-lg text-gray-900">Return Details: {viewingReturnModal.referenceNumber}</h3>
                <p className="text-xs text-gray-500">Original Invoice #{viewingReturnModal.orderDocumentNumber}</p>
              </div>
              <button onClick={() => setViewingReturnModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg">
                <div><span className="text-gray-500">Customer:</span> <strong className="text-gray-900">{viewingReturnModal.customerName}</strong></div>
                <div><span className="text-gray-500">Date:</span> <strong className="text-gray-900">{viewingReturnModal.returnDate}</strong></div>
                <div><span className="text-gray-500">Method:</span> <strong className="text-gray-900 uppercase">{viewingReturnModal.paymentMethod}</strong></div>
                <div><span className="text-gray-500">Refund Amount:</span> <strong className="text-red-600">{formatCurrency(viewingReturnModal.refundAmount || viewingReturnModal.grandTotal, settings)}</strong></div>
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
                          <span className="font-bold block">{itm.name}</span>
                          {itm.returnedSerials && itm.returnedSerials.length > 0 && (
                            <span className="text-[10px] text-red-600 font-mono block">
                              Serials: {itm.returnedSerials.join(', ')}
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-center font-bold">{itm.returnQty}</td>
                        <td className="p-2 text-right font-bold text-gray-900">{formatCurrency(itm.total, settings)}</td>
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

            <div className="flex justify-end pt-3 border-t">
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
