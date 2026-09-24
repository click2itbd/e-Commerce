import React, { useState, useEffect } from 'react';
import {
  FileEdit, Folder, Package, PlusSquare, Tag, Server, Settings, Globe,
  Plus, Trash2, Edit2, CheckCircle2, Eye, EyeOff, Save
} from 'lucide-react';
import { cn, formatCurrency } from '../../../lib/utils';
import { toast } from 'react-hot-toast';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc,
  serverTimestamp, query, orderBy, onSnapshot, limit
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { Modal, StatusBadge, EmptyState, slugify } from '../components/SharedUI';

export function DomainPricingModule() {
  const [pricingMatrix, setPricingMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTLD, setNewTLD] = useState({ tld: '', reg: '', trans: '', ren: '', auto: 'None' });

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'hosting_config', 'domain_pricing'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().matrix) {
        setPricingMatrix(docSnap.data().matrix);
      } else {
        setPricingMatrix([
          { tld: '.com', reg: '12.99', trans: '11.99', ren: '13.99', auto: 'Namecheap' },
          { tld: '.net', reg: '10.99', trans: '9.99', ren: '11.99', auto: 'ResellerClub' },
          { tld: '.org', reg: '11.99', trans: '10.99', ren: '12.99', auto: 'Enom' },
          { tld: '.io', reg: '39.99', trans: '39.99', ren: '42.99', auto: 'Namecheap' },
        ]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveMatrix = async () => {
    try {
      await setDoc(doc(db, 'hosting_config', 'domain_pricing'), { matrix: pricingMatrix }, { merge: true });
      toast.success('Pricing Matrix Saved successfully', { icon: '💰' });
    } catch {
      toast.error('Failed to save pricing matrix');
    }
  };

  const handleAddTLD = async (e) => {
    e.preventDefault();
    if (!newTLD.tld || !newTLD.tld.startsWith('.')) {
      toast.error('TLD must start with a dot (e.g., .com)');
      return;
    }
    if (pricingMatrix.some(p => p.tld === newTLD.tld)) {
      toast.error('TLD already exists');
      return;
    }
    const updatedMatrix = [...pricingMatrix, { ...newTLD }];
    setPricingMatrix(updatedMatrix);
    try {
      await setDoc(doc(db, 'hosting_config', 'domain_pricing'), { matrix: updatedMatrix }, { merge: true });
      toast.success(`Added ${newTLD.tld} successfully`);
      setShowModal(false);
      setNewTLD({ tld: '', reg: '', trans: '', ren: '', auto: 'None' });
    } catch {
      toast.error('Failed to add TLD');
    }
  };

  const updateMatrixItem = (index, field, value) => {
    const newMatrix = [...pricingMatrix];
    newMatrix[index] = { ...newMatrix[index], [field]: value };
    setPricingMatrix(newMatrix);
  };

  const deleteTLD = async (index) => {
    if (!window.confirm('Remove this TLD from pricing matrix?')) return;
    const updatedMatrix = pricingMatrix.filter((_, i) => i !== index);
    setPricingMatrix(updatedMatrix);
    try {
      await setDoc(doc(db, 'hosting_config', 'domain_pricing'), { matrix: updatedMatrix }, { merge: true });
      toast.success('TLD removed');
    } catch {
      toast.error('Failed to remove TLD');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
          <Settings className="text-emerald-500" /> Domain Price Setting
        </h3>
        <button onClick={() => setShowModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-colors">
          <Plus size={16} /> Add TLD
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading pricing matrix...</div>
      ) : (
        <div className="overflow-x-auto relative">
          <table className="w-full text-left text-sm text-slate-600 border">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-4 border-r">TLD Ext</th>
                <th className="px-5 py-4 border-r text-center">Register (৳)</th>
                <th className="px-5 py-4 border-r text-center">Transfer (৳)</th>
                <th className="px-5 py-4 border-r text-center">Renew (৳)</th>
                <th className="px-5 py-4 text-center">Auto Reg</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pricingMatrix.map((tld, i) => (
                <tr key={i} className="hover:bg-slate-50\/80 transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-800 border-r">{tld.tld}</td>
                  <td className="px-5 py-4 text-center border-r">
                    <input type="text" value={tld.reg} onChange={(e) => updateMatrixItem(i, 'reg', e.target.value)}
                      className="w-20 px-2 py-1 border rounded text-sm text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                  </td>
                  <td className="px-5 py-4 text-center border-r">
                    <input type="text" value={tld.trans} onChange={(e) => updateMatrixItem(i, 'trans', e.target.value)}
                      className="w-20 px-2 py-1 border rounded text-sm text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                  </td>
                  <td className="px-5 py-4 text-center border-r">
                    <input type="text" value={tld.ren} onChange={(e) => updateMatrixItem(i, 'ren', e.target.value)}
                      className="w-20 px-2 py-1 border rounded text-sm text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                  </td>
                  <td className="px-5 py-4 text-center border-r">
                    <select className="border rounded px-2 py-1 text-sm bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" value={tld.auto} onChange={(e) => updateMatrixItem(i, 'auto', e.target.value)}>
                      <option>None</option>
                      <option>Namecheap</option>
                      <option>ResellerClub</option>
                      <option>Enom</option>
                    </select>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button onClick={() => deleteTLD(i)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} className="mx-auto" /></button>
                  </td>
                </tr>
              ))}
              {pricingMatrix.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No domain extensions added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="mt-4 flex justify-end">
            <button onClick={handleSaveMatrix} className="bg-emerald-600 text-white px-6 py-2 rounded shadow-sm font-medium hover:bg-emerald-700">Save Pricing Matrix</button>
          </div>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New TLD">
        <form onSubmit={handleAddTLD} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">TLD Extension</label>
            <input required type="text" value={newTLD.tld} onChange={e => setNewTLD({ ...newTLD, tld: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium transition-all focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. .com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Registration (৳)</label>
              <input required type="number" step="0.01" value={newTLD.reg} onChange={e => setNewTLD({ ...newTLD, reg: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium transition-all focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Renewal (৳)</label>
              <input required type="number" step="0.01" value={newTLD.ren} onChange={e => setNewTLD({ ...newTLD, ren: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium transition-all focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Transfer (৳)</label>
              <input required type="number" step="0.01" value={newTLD.trans} onChange={e => setNewTLD({ ...newTLD, trans: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium transition-all focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Auto Reg</label>
              <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium transition-all focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white" value={newTLD.auto} onChange={e => setNewTLD({ ...newTLD, auto: e.target.value })}>
                <option>None</option>
                <option>Namecheap</option>
                <option>ResellerClub</option>
                <option>Enom</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50\/80 transition-colors rounded font-medium">Cancel</button>
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm hover:shadow-md hover:bg-emerald-700">Add TLD</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}