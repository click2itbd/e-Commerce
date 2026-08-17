import React, { useState, useEffect } from 'react';
import { db } from '../../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { Tag, Edit, Trash2, Plus, X, Ticket, Edit2 } from 'lucide-react';

const DiscountCodesTab: React.FC = () => {
  const { isAdmin, hasPermission } = useAuth();
  const [discountCodes, setDiscountCodes] = useState<any[]>([]);
  const [isAddingDiscountCode, setIsAddingDiscountCode] = useState(false);
  const [editingDiscountCode, setEditingDiscountCode] = useState<any>(null);
  const [discountCodeFormData, setDiscountCodeFormData] = useState({
    code: '',
    discountPercentage: 0,
    expiryDate: '',
    isActive: true,
  });

  const fetchDiscountCodes = async () => {
    try {
      const discountCodesSnap = await getDocs(query(collection(db, 'couponCodes'), orderBy('createdAt', 'desc')));
      setDiscountCodes(discountCodesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching discount codes:', error);
      toast.error('Failed to load discount codes');
    }
  };

  useEffect(() => {
    fetchDiscountCodes();
  }, []);

  const handleSaveDiscountCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...discountCodeFormData,
        code: discountCodeFormData.code.toUpperCase(),
        createdAt: new Date().toISOString(),
      };

      if (editingDiscountCode) {
        await updateDoc(doc(db, 'couponCodes', editingDiscountCode.id), data);
        toast.success('Discount code updated');
      } else {
        await addDoc(collection(db, 'couponCodes'), data);
        toast.success('Discount code created');
      }

      setIsAddingDiscountCode(false);
      setEditingDiscountCode(null);
      setDiscountCodeFormData({ code: '', discountPercentage: 0, expiryDate: '', isActive: true });
      fetchDiscountCodes();
    } catch (error) {
      console.error('Error saving discount code:', error);
      toast.error('Failed to save discount code');
    }
  };

  const handleDeleteDiscountCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount code?')) return;
    try {
      await deleteDoc(doc(db, 'couponCodes', id));
      toast.success('Discount code deleted');
      fetchDiscountCodes();
    } catch (error) {
      console.error('Error deleting discount code:', error);
      toast.error('Failed to delete discount code');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Ticket className="text-[#EF4444]" /> Discount Codes
              </h2>
              <button
                onClick={() => setIsAddingDiscountCode(true)}
                className="bg-[#EF4444] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-red-600 transition-all font-bold text-sm"
              >
                <Plus size={18} /> Create Code
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Discount</th>
                    <th className="px-6 py-4">Expiry Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {discountCodes.map(code => (
                    <tr key={code.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-sm">{code.code}</td>
                      <td className="px-6 py-4 text-sm font-bold text-[#EF4444]">{code.discountPercentage}%</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(code.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                          code.isActive && new Date(code.expiryDate) > new Date() ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {code.isActive && new Date(code.expiryDate) > new Date() ? 'Active' : 'Inactive/Expired'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingDiscountCode(code);
                              setDiscountCodeFormData({
                                code: code.code,
                                discountPercentage: code.discountPercentage,
                                expiryDate: code.expiryDate,
                                isActive: code.isActive,
                              });
                              setIsAddingDiscountCode(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteDiscountCode(code.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {discountCodes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">No discount codes created yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
  );
};

export default DiscountCodesTab;
