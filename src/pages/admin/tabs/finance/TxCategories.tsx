import React, { useState } from 'react';
import { db } from '../../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
import { List, Plus, X } from 'lucide-react';

interface TxCategoriesTabProps { transactionCategories: any[]; isAddingTransactionCategory: boolean; setIsAddingTransactionCategory: (v: boolean) => void; newTransactionCategory: any; setNewTransactionCategory: (v: any) => void; handleSaveTransactionCategory: (e: any) => void; }

const TxCategoriesTab: React.FC<TxCategoriesTabProps> = ({ transactionCategories, isAddingTransactionCategory, setIsAddingTransactionCategory, newTransactionCategory, setNewTransactionCategory, handleSaveTransactionCategory }) => {
  const { isAdmin, hasPermission } = useAuth();
  const { settings } = useSettings();


  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <List className="text-[#EF4444]" /> Income & Expense Categories
              </h2>
              <button
                onClick={() => {
                  setNewTransactionCategory({name: '', type: 'expense', description: ''});
                  setIsAddingTransactionCategory(true);
                }}
                className="bg-[#EF4444] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-red-600 transition-all font-bold text-sm"
              >
                <Plus size={18} /> Add Category
              </button>
            </div>
            
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactionCategories.map(cat => (
                    <tr key={cat.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold">{cat.name}</td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2 py-1 text-[10px] font-bold rounded-full uppercase", cat.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                          {cat.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{cat.description}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(cat.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {transactionCategories.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">No categories found. Create one.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
  );
};

export default TxCategoriesTab;
