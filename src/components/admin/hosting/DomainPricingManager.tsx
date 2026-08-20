import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

interface DomainPricing {
  tld: string;
  registerPrice: number;
  renewPrice: number;
  transferPrice: number;
  currency: string;
  isActive: boolean;
}

export const DomainPricingManager: React.FC = () => {
  const [pricing, setPricing] = useState<DomainPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingTld, setEditingTld] = useState<string | null>(null);
  const [formData, setFormData] = useState<DomainPricing>({
    tld: '',
    registerPrice: 0,
    renewPrice: 0,
    transferPrice: 0,
    currency: 'BDT',
    isActive: true,
  });
  const [confirmDelete, setConfirmDelete] = useState<{ tld: string; onConfirm: () => void } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'domainPricing'), orderBy('tld', 'asc')));
      const data = snap.docs.map(d => ({ ...(d.data() as DomainPricing), id: d.id }));
      setPricing(data);
    } catch (error) {
      console.error('Error fetching domain pricing:', error);
      toast.error('Failed to load domain pricing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTld) {
        await updateDoc(doc(db, 'domainPricing', editingTld), formData);
        toast.success('Domain pricing updated');
      } else {
        await addDoc(collection(db, 'domainPricing'), formData);
        toast.success('Domain pricing added');
      }
      setIsAdding(false);
      setEditingTld(null);
      setFormData({ tld: '', registerPrice: 0, renewPrice: 0, transferPrice: 0, currency: 'BDT', isActive: true });
      fetchData();
    } catch (error) {
      console.error('Error saving pricing:', error);
      toast.error('Failed to save pricing');
    }
  };

  const handleDelete = (tld: string) => {
    setConfirmDelete({
      tld,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'domainPricing', tld));
          toast.success('Domain pricing deleted');
          fetchData();
        } catch (error) {
          console.error('Error deleting pricing:', error);
          toast.error('Failed to delete pricing');
        }
      },
    });
  };

  const startEdit = (item: DomainPricing) => {
    setEditingTld(item.tld);
    setFormData({
      tld: item.tld,
      registerPrice: item.registerPrice,
      renewPrice: item.renewPrice,
      transferPrice: item.transferPrice,
      currency: item.currency,
      isActive: item.isActive,
    });
    setIsAdding(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-[#EF4444] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold">Domain Pricing</h2>
            <p className="text-sm text-gray-500 mt-1">Manage TLD pricing for domain registration, renewal, and transfer</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingTld(null);
                setFormData({ tld: '', registerPrice: 0, renewPrice: 0, transferPrice: 0, currency: 'BDT', isActive: true });
                setIsAdding(true);
              }}
              className="bg-[#EF4444] text-white px-4 py-2 rounded-md font-bold flex items-center gap-2 transition-all hover:bg-red-600"
            >
              <Plus size={18} /> Add TLD
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#081621] text-white text-xs uppercase">
              <tr>
                <th className="px-6 py-4">TLD</th>
                <th className="px-6 py-4">Register Price</th>
                <th className="px-6 py-4">Renew Price</th>
                <th className="px-6 py-4">Transfer Price</th>
                <th className="px-6 py-4">Currency</th>
                <th className="px-6 py-4">Active</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pricing.map((item) => (
                <tr key={item.tld} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold">{item.tld}</td>
                  <td className="px-6 py-4 text-[#EF4444] font-bold">{item.registerPrice.toLocaleString()}</td>
                  <td className="px-6 py-4 text-[#EF4444] font-bold">{item.renewPrice.toLocaleString()}</td>
                  <td className="px-6 py-4 text-[#EF4444] font-bold">{item.transferPrice.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.currency}</td>
                  <td className="px-6 py-4">
                    {item.isActive ? (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Active</span>
                    ) : (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Inactive</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="bg-gray-100 p-2 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.tld)}
                        className="bg-gray-100 p-2 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pricing.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">
                    No domain pricing configured. Click "Add TLD" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingTld ? 'Edit' : 'Add'} Domain Pricing</h2>
              <button onClick={() => { setIsAdding(false); setEditingTld(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">TLD</label>
                <input
                  type="text"
                  required
                  value={formData.tld}
                  onChange={e => setFormData({ ...formData, tld: e.target.value })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  placeholder="e.g. .com"
                  disabled={!!editingTld}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Register Price</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.registerPrice}
                    onChange={e => setFormData({ ...formData, registerPrice: Number(e.target.value) })}
                    className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Renew Price</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.renewPrice}
                    onChange={e => setFormData({ ...formData, renewPrice: Number(e.target.value) })}
                    className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Transfer Price</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.transferPrice}
                    onChange={e => setFormData({ ...formData, transferPrice: Number(e.target.value) })}
                    className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Currency</label>
                <input
                  type="text"
                  required
                  value={formData.currency}
                  onChange={e => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-[#EF4444] focus:ring-[#EF4444]"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
              </div>
              <button
                type="submit"
                className="w-full bg-[#EF4444] text-white py-3 rounded-md font-bold hover:bg-red-600 transition-all"
              >
                {editingTld ? 'Update Pricing' : 'Add Pricing'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Domain Pricing</h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              Are you sure you want to delete pricing for <span className="font-bold">{confirmDelete.tld}</span>?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDelete.onConfirm();
                  setConfirmDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
