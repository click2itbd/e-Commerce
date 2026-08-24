import React, { useState } from 'react';
import { db } from '../../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
import { ArrowLeftRight, Search, CreditCard } from 'lucide-react';

interface TransactionsTabProps { transactions?: any[]; customers?: any[]; setSelectedLedgerEntity?: (v: any) => void; setActiveTab?: (v: string) => void; }

const TransactionsTab: React.FC<TransactionsTabProps> = ({ transactions = [], customers = [], setSelectedLedgerEntity, setActiveTab }) => {
  const { isAdmin, hasPermission } = useAuth();
  const { settings } = useSettings();


  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CreditCard className="text-[#EF4444]" /> Transaction History
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Entity</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(tx.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                          tx.type === 'sale' || tx.type === 'payment_received' || tx.type === 'money_receipt' ? "bg-green-100 text-green-700" : 
                          tx.type === 'purchase' || tx.type === 'payment_made' ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                        )}>
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            const isCustomer = customers.some(c => c.id === tx.entityId);
                            setSelectedLedgerEntity({ 
                              id: tx.entityId, 
                              name: tx.entityName, 
                              type: isCustomer ? 'customer' : 'vendor' 
                            });
                          }}
                          className="font-medium text-sm text-[#EF4444] hover:underline text-left"
                        >
                          {tx.entityName}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{tx.description}</td>
                      <td className={cn(
                        "px-6 py-4 text-right font-bold",
                        tx.type === 'sale' || tx.type === 'payment_received' || tx.type === 'money_receipt' ? "text-green-600" : "text-red-600"
                      )}>
                        {tx.type === 'sale' || tx.type === 'payment_received' || tx.type === 'money_receipt' ? '+' : '-'}{formatCurrency(tx.amount, settings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
  );
};

export default TransactionsTab;
