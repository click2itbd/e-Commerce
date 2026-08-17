import React, { useState, useEffect } from 'react';
import { db } from '../../../../firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { Transaction, TransactionCategory, SiteSettings } from '../../../../types';
import { formatCurrency, cn } from '../../../../lib/utils';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
import {
  Upload,
  Plus,
  XCircle,
  List,
} from 'lucide-react';

const ManualExpenseTab: React.FC = () => {
  const { hasPermission } = useAuth();
  const { settings } = useSettings();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionCategories, setTransactionCategories] = useState<TransactionCategory[]>([]);
  const [isAddingManualTransaction, setIsAddingManualTransaction] = useState(false);
  const [manualTransactionType, setManualTransactionType] = useState<'income' | 'expense'>('expense');
  const [newManualTransaction, setNewManualTransaction] = useState<Partial<Transaction>>({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    categoryId: '',
  });

  const fetchData = async () => {
    try {
      const txSnap = await getDocs(query(collection(db, 'transactions'), orderBy('date', 'desc')));
      setTransactions(txSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));

      const catSnap = await getDocs(query(collection(db, 'transaction_categories'), orderBy('name')));
      setTransactionCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() } as TransactionCategory)));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveManualTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newManualTransaction.amount || newManualTransaction.amount <= 0 || !newManualTransaction.description) {
      toast.error('Please enter amount and description');
      return;
    }

    const selectedCategory = transactionCategories.find(c => c.id === newManualTransaction.categoryId);

    try {
      const transactionData: Omit<Transaction, 'id'> = {
        type: manualTransactionType,
        amount: newManualTransaction.amount,
        date: newManualTransaction.date || new Date().toISOString().split('T')[0],
        description: newManualTransaction.description || '',
        entityId: 'manual',
        entityName: 'Manual Entry',
        categoryId: newManualTransaction.categoryId,
        categoryName: selectedCategory ? selectedCategory.name : 'Uncategorized',
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'transactions'), transactionData);
      setIsAddingManualTransaction(false);
      setNewManualTransaction({
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: '',
        categoryId: '',
      });
      toast.success('Transaction saved successfully');
      fetchData();
    } catch (error) {
      console.error('Error saving manual transaction:', error);
      toast.error('Failed to save transaction');
    }
  };

  if (!hasPermission('manage_finances')) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Upload className="text-[#EF4444]" /> Manual Expenses
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => {}}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-200 transition-all font-bold text-sm"
          >
            <List size={18} /> Manage Categories
          </button>
          <button
            onClick={() => {
              setManualTransactionType('expense');
              setNewManualTransaction({amount: 0, date: new Date().toISOString().split('T')[0], description: '', categoryId: ''});
              setIsAddingManualTransaction(true);
            }}
            className="bg-[#EF4444] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-red-600 transition-all font-bold text-sm"
          >
            <Plus size={18} /> Record Expense
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
            {transactions.filter(t => t.type === 'expense' && t.entityId === 'manual').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{t.date}</td>
                <td className="px-6 py-4 font-bold text-sm">{t.categoryName || 'Uncategorized'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{t.description}</td>
                <td className="px-6 py-4 text-right font-bold text-red-600">{formatCurrency(t.amount, settings)}</td>
              </tr>
            ))}
            {transactions.filter(t => t.type === 'expense' && t.entityId === 'manual').length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">No manual expenses recorded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAddingManualTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Record Manual {manualTransactionType === 'income' ? 'Income' : 'Expense'}</h2>
              <button onClick={() => setIsAddingManualTransaction(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveManualTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={newManualTransaction.date}
                  onChange={e => setNewManualTransaction({ ...newManualTransaction, date: e.target.value })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category (Optional)</label>
                <select
                  value={newManualTransaction.categoryId || ''}
                  onChange={e => setNewManualTransaction({ ...newManualTransaction, categoryId: e.target.value })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444]"
                >
                  <option value="">Uncategorized</option>
                  {transactionCategories.filter(c => c.type === manualTransactionType).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={newManualTransaction.amount || ''}
                  onChange={e => setNewManualTransaction({ ...newManualTransaction, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={newManualTransaction.description}
                  onChange={e => setNewManualTransaction({ ...newManualTransaction, description: e.target.value })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444]"
                  placeholder="e.g. Office Supplies, Salary, etc."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsAddingManualTransaction(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-md font-bold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-[#EF4444] text-white rounded-md font-bold hover:bg-red-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualExpenseTab;
