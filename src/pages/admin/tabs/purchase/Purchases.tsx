import React, { useState } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Product, Vendor, Transaction, SiteSettings } from '../../../../types';
import { formatCurrency } from '../../../../lib/utils';
import { toast } from 'react-hot-toast';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Search,
  Ticket,
} from 'lucide-react';

interface PurchaseItem {
  id: string;
  name: string;
  images: string[];
  purchasePrice: number;
  quantity: number;
  hasWarranty?: boolean;
  warrantyYears?: number;
  hasSerialTracking?: boolean;
  newSerials?: string | string[];
  vendorId?: string;
}

interface PurchaseFormData {
  vendorId: string;
  vendorName: string;
  items: PurchaseItem[];
  description: string;
}

interface PurchasesProps {
  vendors: Vendor[];
  products: Product[];
  transactions: Transaction[];
  settings: SiteSettings;
  setSelectedLedgerEntity: (entity: { id: string; name: string; type: string }) => void;
  fetchData: () => Promise<void>;
}

const Purchases: React.FC<PurchasesProps> = ({
  vendors,
  products,
  transactions,
  settings,
  setSelectedLedgerEntity,
  fetchData,
}) => {
  const [isCreatingPurchase, setIsCreatingPurchase] = useState(false);
  const [purchaseData, setPurchaseData] = useState<PurchaseFormData>({
    vendorId: '',
    vendorName: '',
    items: [],
    description: '',
  });
  const [purchaseStartDate, setPurchaseStartDate] = useState('');
  const [purchaseEndDate, setPurchaseEndDate] = useState('');
  const [purchaseSearchQuery, setPurchaseSearchQuery] = useState('');

  const addItemToPurchase = (product: Product) => {
    setPurchaseData(prev => {
      const existing = prev.items.find(i => i.id === product.id);
      if (existing) {
        return {
          ...prev,
          items: prev.items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        };
      }
      return {
        ...prev,
        items: [...prev.items, { ...product, quantity: 1, purchasePrice: product.price * 0.8 }]
      };
    });
    toast.success(`Added ${product.name} to purchase list`);
  };

  const removeItemFromPurchase = (productId: string) => {
    setPurchaseData(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== productId)
    }));
  };

  const updatePurchaseItem = (productId: string, field: string, value: any) => {
    setPurchaseData(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === productId ? { ...i, [field]: value } : i)
    }));
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseData.items.length === 0 || !purchaseData.vendorId) {
      toast.error('Please select a vendor and add products');
      return;
    }

    try {
      const totalAmount = purchaseData.items.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);

      for (const item of purchaseData.items) {
        const productRef = doc(db, 'products', item.id);
        const currentProduct = products.find(p => p.id === item.id);
        if (currentProduct) {
          const updates: any = {
            stock: currentProduct.stock + item.quantity
          };

          if (item.hasWarranty) {
            updates.warrantyMonths = (item.warrantyYears || 0) * 12;
          }

          if (currentProduct.hasSerialTracking && item.newSerials) {
            const addedSerials = Array.isArray(item.newSerials) ? item.newSerials.filter((s: string) => s.trim()) : item.newSerials.split('\n').map((s: string) => s.trim()).filter((s: string) => s);
            updates.availableSerials = [...(currentProduct.availableSerials || []), ...addedSerials];
          }

          await updateDoc(productRef, updates);
        }
      }

      const transactionData = {
        type: 'purchase',
        amount: totalAmount,
        date: new Date().toISOString(),
        description: purchaseData.description || `Purchase from ${purchaseData.vendorName}`,
        entityId: purchaseData.vendorId,
        entityName: purchaseData.vendorName,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'transactions'), transactionData);

      toast.success('Purchase recorded and inventory updated');
      setIsCreatingPurchase(false);
      setPurchaseData({ vendorId: '', vendorName: '', items: [], description: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating purchase:', error);
      toast.error('Failed to create purchase');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShoppingBag className="text-[#EF4444]" /> Product Purchases
        </h2>
        <button
          onClick={() => setIsCreatingPurchase(true)}
          className="bg-[#081621] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#EF4444] transition-all font-bold text-sm"
        >
          <Plus size={18} /> New Purchase
        </button>
      </div>

      {isCreatingPurchase && (
        <div className="p-6 bg-gray-50 border-b border-gray-100">
          <form onSubmit={handleCreatePurchase} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Vendor</label>
                <select
                  required
                  value={purchaseData.vendorId}
                  onChange={e => {
                    const vendor = vendors.find(v => v.id === e.target.value);
                    setPurchaseData({ ...purchaseData, vendorId: e.target.value, vendorName: vendor?.name || '' });
                  }}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.category})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description / Reference</label>
                <input
                  type="text"
                  value={purchaseData.description}
                  onChange={e => setPurchaseData({ ...purchaseData, description: e.target.value })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  placeholder="e.g. Monthly Stock Refill"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#081621] uppercase">Add Products to Purchase</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {products.map(product => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addItemToPurchase(product)}
                    className="p-3 bg-white border border-gray-200 rounded-lg hover:border-[#EF4444] transition-all text-left flex flex-col gap-2"
                  >
                    <img src={product.images[0]} alt="" className="w-full h-20 object-contain" />
                    <span className="text-xs font-bold line-clamp-2">{product.name}</span>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-gray-500">Stock: {product.stock}</span>
                      <span className="text-[10px] text-[#EF4444] font-bold uppercase">
                        {vendors.find(v => v.id === product.vendorId)?.name || 'No Vendor'}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {purchaseData.items.length > 0 && (
              <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase">
                    <tr>
                      <th className="px-4 py-2">Product</th>
                      <th className="px-4 py-2">Purchase Price</th>
                      <th className="px-4 py-2">Quantity</th>
                      <th className="px-4 py-2">Total</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {purchaseData.items.map(item => (
                      <React.Fragment key={item.id}>
                        <tr>
                          <td className="px-4 py-2 text-xs font-bold">{item.name}</td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={item.purchasePrice}
                              onChange={e => updatePurchaseItem(item.id, 'purchasePrice', Number(e.target.value))}
                              className="w-24 text-xs border-gray-200 rounded-md"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={e => updatePurchaseItem(item.id, 'quantity', Math.max(1, Number(e.target.value)))}
                              className="w-20 text-xs border-gray-200 rounded-md"
                            />
                          </td>
                          <td className="px-4 py-2 text-xs font-bold">
                            {formatCurrency(item.purchasePrice * item.quantity, settings)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeItemFromPurchase(item.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                        <tr className="bg-gray-50/30">
                          <td colSpan={5} className="px-4 py-2 border-t border-gray-100">
                            <div className="flex flex-col gap-1">
                               <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={item.hasWarranty || false}
                                    onChange={(e) => updatePurchaseItem(item.id, 'hasWarranty', e.target.checked)}
                                    className="rounded border-gray-300"
                                  />
                                  <span>Include Warranty for this product</span>
                               </label>
                               {item.hasWarranty && (
                                  <div className="flex items-center gap-2 ml-6 mt-1">
                                     <input
                                       type="number"
                                       min="1"
                                       value={item.warrantyYears || ''}
                                       onChange={(e) => updatePurchaseItem(item.id, 'warrantyYears', Number(e.target.value))}
                                       className="w-20 text-xs border-gray-200 rounded-md bg-white"
                                       placeholder="Years"
                                     />
                                     <span className="text-xs text-gray-500 font-medium">Years</span>
                                  </div>
                               )}
                            </div>
                          </td>
                        </tr>
                        {item.hasSerialTracking && (
                          <tr className="bg-orange-50/50">
                            <td colSpan={5} className="px-4 py-3">
                              <label className="block text-[10px] font-bold text-orange-600 uppercase mb-2 flex items-center gap-1">
                                <Ticket size={12} /> Enter/Scan Serials for each unit
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {Array.from({ length: Math.max(1, item.quantity || 1) }).map((_, idx) => (
                                  <div key={idx} className="flex flex-col">
                                    <span className="text-[10px] text-orange-700 font-bold mb-0.5">Unit {idx + 1}</span>
                                    <input
                                      type="text"
                                      value={(Array.isArray(item.newSerials) ? item.newSerials[idx] : (item.newSerials?.split('\n')[idx] || '')) || ''}
                                      onChange={(e) => {
                                        const newArr = Array.isArray(item.newSerials) ? [...item.newSerials] : (item.newSerials ? item.newSerials.split('\n') : []);
                                        newArr[idx] = e.target.value;
                                        const newData = { ...purchaseData };
                                        const iidx = newData.items.findIndex(i => i.id === item.id);
                                        if (iidx !== -1) {
                                          newData.items[iidx].newSerials = newArr;
                                          setPurchaseData(newData);
                                        }
                                      }}
                                      className="w-full text-xs font-mono border-orange-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
                                      placeholder="Scan barcode..."
                                    />
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right text-xs uppercase">Grand Total:</td>
                      <td className="px-4 py-2 text-sm text-[#EF4444]">
                        {formatCurrency(purchaseData.items.reduce((sum, i) => sum + (i.purchasePrice * i.quantity), 0), settings)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-[#EF4444] text-white py-2 rounded-md font-bold hover:bg-red-600 transition-all"
              >
                Record Purchase & Update Stock
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingPurchase(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md font-bold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Start Date</label>
              <input type="date" value={purchaseStartDate} onChange={e => setPurchaseStartDate(e.target.value)} className="text-sm border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">End Date</label>
              <input type="date" value={purchaseEndDate} onChange={e => setPurchaseEndDate(e.target.value)} className="text-sm border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]" />
            </div>
            <div className="relative">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Vendor or Description..."
                  value={purchaseSearchQuery}
                  onChange={(e) => setPurchaseSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:ring-[#EF4444] focus:border-[#EF4444] w-48"
                />
              </div>
            </div>
          </div>
        </div>
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Purchase History</h3>
        <div className="overflow-x-auto border border-gray-100 rounded-lg">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions
                .filter(t => t.type === 'purchase')
                .filter(t => {
                  const matchesSearch = t.entityName.toLowerCase().includes(purchaseSearchQuery.toLowerCase()) ||
                    t.description.toLowerCase().includes(purchaseSearchQuery.toLowerCase());
                  const txDate = new Date(t.date).toISOString().split('T')[0];
                  const matchesStartDate = !purchaseStartDate || txDate >= purchaseStartDate;
                  const matchesEndDate = !purchaseEndDate || txDate <= purchaseEndDate;
                  return matchesSearch && matchesStartDate && matchesEndDate;
                })
                .map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedLedgerEntity({ id: tx.entityId, name: tx.entityName, type: 'vendor' })}
                        className="font-medium text-sm text-[#EF4444] hover:underline text-left"
                      >
                        {tx.entityName}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{tx.description}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">
                      {formatCurrency(tx.amount, settings)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Purchases;
