import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../firebase';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, DollarSign, Percent, Save, RefreshCw, Phone } from 'lucide-react';
import { Pagination } from '../../common/Pagination';

interface DomainPricing {
  id?: string;  // Firestore document ID (auto-generated)
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
  const [editingDocId, setEditingDocId] = useState<string | null>(null); // tracks Firestore doc ID
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [globalSettings, setGlobalSettings] = useState({
    usdToBdtRate: 121,
    domainMarkupPercent: 15,
    manualBkashNumber: '01700000000',
  });
  const [savingGlobal, setSavingGlobal] = useState(false);
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
      // 1. Fetch Global Settings
      const settingsSnap = await getDoc(doc(db, 'settings', 'api_keys'));
      if (settingsSnap.exists()) {
        const sData = settingsSnap.data();
        setGlobalSettings({
          usdToBdtRate: Number(sData.usdToBdtRate) || 121,
          domainMarkupPercent: Number(sData.domainMarkupPercent) || 15,
          manualBkashNumber: sData.manualBkashNumber || '01700000000',
        });
      }

      // 2. Fetch Per-TLD Pricing
      const snap = await getDocs(query(collection(db, 'domainPricing'), orderBy('tld', 'asc'), limit(500)));
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

  const handleSaveGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGlobal(true);
    try {
      await setDoc(doc(db, 'settings', 'api_keys'), {
        usdToBdtRate: Number(globalSettings.usdToBdtRate),
        domainMarkupPercent: Number(globalSettings.domainMarkupPercent),
        manualBkashNumber: globalSettings.manualBkashNumber.trim(),
      }, { merge: true });
      toast.success('Global pricing settings & bKash number updated successfully!');
    } catch (err) {
      console.error('Error saving global domain pricing settings:', err);
      toast.error('Failed to update global settings');
    } finally {
      setSavingGlobal(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDocId) {
        // Use the actual Firestore document ID for updates
        await updateDoc(doc(db, 'domainPricing', editingDocId), formData);
        toast.success('Domain pricing updated');
      } else {
        await addDoc(collection(db, 'domainPricing'), formData);
        toast.success('Domain pricing added');
      }
      setIsAdding(false);
      setEditingDocId(null);
      setFormData({ tld: '', registerPrice: 0, renewPrice: 0, transferPrice: 0, currency: 'BDT', isActive: true });
      fetchData();
    } catch (error) {
      console.error('Error saving pricing:', error);
      toast.error('Failed to save pricing');
    }
  };

  const handleDelete = (item: DomainPricing) => {
    setConfirmDelete({
      tld: item.tld,
      onConfirm: async () => {
        try {
          if (!item.id) {
            toast.error('Cannot delete: missing document ID');
            return;
          }
          // Use the actual Firestore document ID for deletion
          await deleteDoc(doc(db, 'domainPricing', item.id));
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
    setEditingDocId(item.id || null); // track by doc ID, not TLD
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
    <div className="space-y-6">
      {/* Global Rate & Profit Margin Settings Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" /> Global Dollar Rate & Profit Margin
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Set the USD to BDT exchange rate and profit margin percentage used to automatically calculate domain prices from Dynadot supplier rates.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveGlobal} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end pt-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              USD to BDT Exchange Rate (৳)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">৳</span>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={globalSettings.usdToBdtRate}
                onChange={e => setGlobalSettings({ ...globalSettings, usdToBdtRate: parseFloat(e.target.value) || 0 })}
                className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold"
                placeholder="121"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Profit Margin (%)
            </label>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">%</span>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={globalSettings.domainMarkupPercent}
                onChange={e => setGlobalSettings({ ...globalSettings, domainMarkupPercent: parseFloat(e.target.value) || 0 })}
                className="w-full pl-4 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold"
                placeholder="15"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Manual bKash Number
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500 font-bold text-xs">bKash</span>
              <input
                type="text"
                required
                value={globalSettings.manualBkashNumber}
                onChange={e => setGlobalSettings({ ...globalSettings, manualBkashNumber: e.target.value })}
                className="w-full pl-14 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm font-semibold"
                placeholder="01700000000"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={savingGlobal}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm"
            >
              <Save size={16} /> {savingGlobal ? 'Saving...' : 'Save Global Settings'}
            </button>
          </div>
        </form>

        <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg p-3 text-xs text-emerald-900 flex items-center justify-between flex-wrap gap-2">
          <span>
            💡 <strong>Formula Preview:</strong> Supplier Price (USD) × (1 + {globalSettings.domainMarkupPercent}% / 100) × ৳{globalSettings.usdToBdtRate} BDT
          </span>
          <span className="font-bold text-emerald-800 bg-white/80 px-2.5 py-1 rounded border border-emerald-200">
            Sample .com ($10.99 base) = ৳{Math.round(10.99 * (1 + (globalSettings.domainMarkupPercent || 0) / 100) * (globalSettings.usdToBdtRate || 121))} BDT
          </span>
        </div>
      </div>

      {/* Per-TLD Pricing Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold">Custom TLD Pricing Overrides</h2>
            <p className="text-sm text-gray-500 mt-1">Override specific TLD pricing for domain registration, renewal, and transfer (Optional)</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingDocId(null);
                setFormData({ tld: '', registerPrice: 0, renewPrice: 0, transferPrice: 0, currency: 'BDT', isActive: true });
                setIsAdding(true);
              }}
              className="bg-[#EF4444] text-white px-4 py-2 rounded-md font-bold flex items-center gap-2 transition-all hover:bg-red-600"
            >
              <Plus size={18} /> Add TLD Override
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
              {pricing.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
                <tr key={item.id || item.tld} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold">{item.tld}</td>
                  <td className="px-6 py-4 text-[#EF4444] font-bold">৳{item.registerPrice.toLocaleString()}</td>
                  <td className="px-6 py-4 text-[#EF4444] font-bold">৳{item.renewPrice.toLocaleString()}</td>
                  <td className="px-6 py-4 text-[#EF4444] font-bold">৳{item.transferPrice.toLocaleString()}</td>
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
                        onClick={() => handleDelete(item)}
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
                    No custom TLD pricing overrides configured. Default pricing will be calculated using the Global Dollar Rate & Profit Margin above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={pricing.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>

      {/* Add/Edit Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingDocId ? 'Edit' : 'Add'} Domain Pricing Override</h2>
              <button onClick={() => { setIsAdding(false); setEditingDocId(null); }} className="text-gray-400 hover:text-gray-600">
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
                  disabled={!!editingDocId}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Register Price (৳)</label>
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
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Renew Price (৳)</label>
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
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Transfer Price (৳)</label>
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
                {editingDocId ? 'Update Pricing' : 'Add Pricing'}
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
