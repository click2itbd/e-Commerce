import React, { useState } from 'react';
import { X, Save, Edit2 } from 'lucide-react';
import { Order } from '../../../types';
import { db } from '../../../firebase';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { logAudit } from '../../../lib/audit';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../context/SettingsContext';
import { formatCurrency } from '../../../lib/utils';

interface EditOrderModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditOrderModal({ order, onClose, onSuccess }: EditOrderModalProps) {
  const [formData, setFormData] = useState({
    customerName: order.customerName || '',
    customerPhone: order.customerPhone || '',
    customerEmail: order.customerEmail || '',
      createdBy: order.createdBy || 'Admin',
    shippingAddress: order.shippingAddress || '',
    notes: order.notes || '',
    workOrderNumber: order.workOrderNumber || '',
  });

  const [items, setItems] = useState([...order.items]);
  const [discountAmount, setDiscountAmount] = useState<number>(order.discountAmount || 0);
  const [saving, setSaving] = useState(false);
  const { profile } = useAuth();
  const { settings } = useSettings();

  const subtotal = items.reduce((acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  const total = subtotal - discountAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Update the order
      await updateDoc(doc(db, 'orders', order.id), {
        ...formData,
        items,
        subtotal,
        discountAmount,
        total
      });

      // 2. Update the 'sale' transaction amount so the ledger stays accurate
      if (order.total !== total) {
        const txSnap = await getDocs(query(collection(db, 'transactions'), where('referenceId', '==', order.id), where('type', '==', 'sale')));
        await Promise.all(txSnap.docs.map(d => updateDoc(doc(db, 'transactions', d.id), { amount: total })));
      }

      await logAudit('EDIT', 'Order', `Edited order #${order.documentNumber || order.id} (Total: ${total})`, profile?.displayName || profile?.email || 'Unknown');
      toast.success('Order updated successfully');
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Edit2 size={20} className="text-blue-600" />
            Edit Order / Document ({order.documentNumber || order.id})
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Name</label>
              <input type="text" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="w-full border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Phone</label>
              <input type="text" value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} className="w-full border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Email</label>
              <input type="text" value={formData.customerEmail} onChange={e => setFormData({...formData, customerEmail: e.target.value})} className="w-full border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Work Order Number</label>
              <input type="text" value={formData.workOrderNumber} onChange={e => setFormData({...formData, workOrderNumber: e.target.value})} className="w-full border-gray-300 rounded-md" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Shipping Address</label>
              <textarea value={formData.shippingAddress} onChange={e => setFormData({...formData, shippingAddress: e.target.value})} className="w-full border-gray-300 rounded-md" rows={2} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Order Notes</label>
              <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full border-gray-300 rounded-md" rows={2} />
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase">Edit Items & Pricing</h3>
            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden mb-4">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="p-3 font-semibold">Product Name</th>
                    <th className="p-3 font-semibold w-1/4">Description</th>
                    <th className="p-3 font-semibold w-20 text-center">Qty</th>
                    <th className="p-3 font-semibold w-24 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="p-2">
                        <input type="text" value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} className="w-full border-gray-300 rounded-md text-sm" />
                      </td>
                      <td className="p-2">
                        <textarea value={item.description || ''} onChange={e => updateItem(idx, 'description', e.target.value)} className="w-full border-gray-300 rounded-md text-sm" rows={1} />
                      </td>
                      <td className="p-2 text-center">
                        <input type="number" readOnly title="Quantity cannot be edited to maintain correct inventory logs" value={item.quantity || 1} className="w-full border-gray-200 rounded-md text-sm bg-gray-50 text-center cursor-not-allowed" />
                      </td>
                      <td className="p-2">
                        <input type="number" value={item.price || 0} onChange={e => updateItem(idx, 'price', Number(e.target.value))} className="w-full border-gray-300 rounded-md text-sm text-right" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-blue-50/50 rounded-lg border border-blue-100 p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 font-medium text-sm">Subtotal:</span>
                <span className="font-bold text-gray-800">{formatCurrency(subtotal, settings)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 font-medium text-sm">Discount Amount:</span>
                <input 
                  type="number" 
                  value={discountAmount} 
                  onChange={e => setDiscountAmount(Number(e.target.value))} 
                  className="w-32 border-blue-300 rounded-md text-right text-sm font-bold text-red-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                <span className="text-gray-800 font-bold">Final Total:</span>
                <span className="text-xl font-black text-blue-700">{formatCurrency(total, settings)}</span>
              </div>
            </div>

            <p className="text-xs text-blue-600 mt-2 font-medium">
              * Note: Changing the price or discount will automatically adjust the customer's ledger/due based on the new total. (Quantity editing is disabled to preserve stock accuracy).
            </p>
          </div>

        </form>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 font-bold text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={saving} className="px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2">
            <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
