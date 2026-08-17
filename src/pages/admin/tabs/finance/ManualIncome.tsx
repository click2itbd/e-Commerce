import React, { useState } from 'react';
import { db } from '../../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
import { ArrowLeftRight, Plus, X, Download, List } from 'lucide-react';

interface ManualIncomeTabProps { transactions: any[]; transactionCategories: any[]; manualTransactionType: string; setManualTransactionType: (v: any) => void; newManualTransaction: any; setNewManualTransaction: (v: any) => void; isAddingManualTransaction: boolean; setIsAddingManualTransaction: (v: boolean) => void; handleSaveManualTransaction: (e: any) => void; setActiveTab: (v: string) => void; }

const ManualIncomeTab: React.FC<ManualIncomeTabProps> = ({ transactions, transactionCategories, manualTransactionType, setManualTransactionType, newManualTransaction, setNewManualTransaction, isAddingManualTransaction, setIsAddingManualTransaction, handleSaveManualTransaction, setActiveTab }) => {
  const { isAdmin, hasPermission } = useAuth();
  const { settings } = useSettings();


  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Download className="text-[#EF4444]" /> Manual Income
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('tx_categories')}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-200 transition-all font-bold text-sm"
                >
                  <List size={18} /> Manage Categories
                </button>
                <button
                  onClick={() => {
                    setManualTransactionType('income');
                    setNewManualTransaction({amount: 0, date: new Date().toISOString().split('T')[0], description: '', categoryId: ''});
                    setIsAddingManualTransaction(true);
                  }}
                  className="bg-[#EF4444] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-red-600 transition-all font-bold text-sm"
                >
                  <Plus size={18} /> Record Income
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.filter(t => t.type === 'income' && t.entityId === 'manual').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{t.date}</td>
                      <td className="px-6 py-4 font-bold text-sm">{t.categoryName || 'Uncategorized'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{t.description}</td>
                      <td className="px-6 py-4 text-right font-bold text-green-600">{formatCurrency(t.amount, settings)}</td>
                    </tr>
                  ))}
                  {transactions.filter(t => t.type === 'income' && t.entityId === 'manual').length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">No manual income recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
  );
};

export default ManualIncomeTab;
