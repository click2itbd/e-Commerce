import React, { useState, useEffect } from 'react';
import { db } from '../../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
import { RotateCcw, Plus, Download, Printer, CheckSquare, ArrowLeft } from 'lucide-react';

const PurchaseReturnTab: React.FC = () => {
  const { isAdmin, hasPermission } = useAuth();
  const { settings } = useSettings();
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vendorsSnap = await getDocs(query(collection(db, 'vendors'), orderBy('name')));
        setVendors(vendorsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        const productsSnap = await getDocs(query(collection(db, 'products'), orderBy('name')));
        setProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
        toast.error('Failed to load data');
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xl font-bold">Add Purchase Return</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Reference No <span className="text-red-500">*</span></label>
            <input type="text" value="PRET-2026-00001" className="w-full border-gray-200 rounded-md bg-gray-50 mb-4 text-sm" readOnly />
            <label className="block text-xs font-bold text-gray-500 mb-1">Purchase Date</label>
            <input type="date" className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Supplier <span className="text-red-500">*</span></label>
            <div className="flex gap-2 mb-4">
              <select className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] text-sm">
                <option>Select Supplier</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Status <span className="text-red-500">*</span></label>
            <select className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] text-sm">
              <option>Select Status</option>
              <option>Pending</option>
              <option>Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Date <span className="text-red-500">*</span></label>
            <input type="date" value={new Date().toISOString().split('T')[0]} className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] mb-4 text-sm" />
            <label className="block text-xs font-bold text-gray-500 mb-1">Invoice No</label>
            <input type="text" placeholder="Invoice No" className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] text-sm" />
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 mb-1">Note</label>
          <textarea className="w-full border-gray-200 rounded-md h-20 text-sm" placeholder="Note"></textarea>
        </div>
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 mb-1">Items</label>
          <select className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] text-sm max-w-md">
            <option>Select Item</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <table className="w-full text-left mb-6 border-b border-gray-100">
          <thead className="text-[10px] font-bold text-gray-500 uppercase border-b border-t border-gray-100">
            <tr>
              <th className="py-3 px-2">SN</th>
              <th className="py-3 px-2">ITEM NAME</th>
              <th className="py-3 px-2">IMEI/SERIAL/MEDICINE</th>
              <th className="py-3 px-2">QUANTITY</th>
              <th className="py-3 px-2">UNIT PRICE</th>
              <th className="py-3 px-2">TOTAL</th>
              <th className="py-3 px-2">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 min-h-[100px]">
            <tr>
              <td colSpan={7} className="py-12 text-center text-gray-400 text-sm">No items added to return</td>
            </tr>
          </tbody>
        </table>
        <div className="flex justify-end mb-8">
          <div className="w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold text-gray-700">Total Item 0 (0)</span>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 mb-1">Grand Total</label>
              <input type="text" value="0.00" className="w-full border-gray-200 rounded-md bg-gray-50 text-sm" readOnly />
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="bg-indigo-500 text-white px-6 py-2 rounded-md font-bold text-sm flex items-center gap-2"><CheckSquare size={16} /> Submit</button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseReturnTab;
