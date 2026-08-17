import React from 'react';
import { db } from '../../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, Edit, Trash2, CreditCard, CheckCircle, ArrowLeft } from 'lucide-react';

interface PaymentAccountsTabProps { paymentAccounts: any[]; setPaymentAccounts: (v: any[]) => void; isAddingPaymentAccount: boolean; setIsAddingPaymentAccount: (v: boolean) => void; paymentAccountFormData: any; setPaymentAccountFormData: (v: any) => void; paymentAccountSort: any; setPaymentAccountSort: (v: any) => void; fetchData: () => Promise<void>; }

const PaymentAccountsTab: React.FC<PaymentAccountsTabProps> = ({ paymentAccounts, setPaymentAccounts, isAddingPaymentAccount, setIsAddingPaymentAccount, paymentAccountFormData, setPaymentAccountFormData, paymentAccountSort, setPaymentAccountSort, fetchData }) => {
  const { isAdmin, hasPermission } = useAuth();
  const { settings } = useSettings();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CreditCard className="text-[#EF4444]" /> Payment Account
              </h2>
              <div className="flex gap-2">
                {!isAddingPaymentAccount && (
                  <button onClick={() => setIsAddingPaymentAccount(true)} className="bg-[#081621] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#EF4444] transition-all font-bold text-sm">
                    <Plus size={18} /> Add Payment Method
                  </button>
                )}
              </div>
            </div>

            {isAddingPaymentAccount ? (
              <div className="p-6">
                <div><h3 className="text-xl font-bold mb-6 text-gray-800">Add Payment Method</h3><form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const docRef = await addDoc(collection(db, 'payment_accounts'), {
                      ...paymentAccountFormData,
                      createdAt: new Date().toISOString()
                    });
                    toast.success('Payment account added successfully');
                    setPaymentAccounts([...paymentAccounts, { id: docRef.id, ...paymentAccountFormData, createdAt: new Date().toISOString() }]);
                    setIsAddingPaymentAccount(false);
                    setPaymentAccountFormData({ type: '', name: '', description: '', openingBalance: 0, status: 'active' });
                  } catch (error) {
                    toast.error('Failed to add payment account');
                  }
                }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-[#EF4444] mb-1">Account Type <span className="text-red-500">*</span></label>
                      <select required value={paymentAccountFormData.type} onChange={e => setPaymentAccountFormData({...paymentAccountFormData, type: e.target.value})} className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]">
                        <option value="">Select Account Type</option>
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="bkash">Bkash</option>
                        <option value="card">Card</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#EF4444] mb-1">Account Name <span className="text-red-500">*</span></label>
                      <input type="text" required placeholder="Account Name" value={paymentAccountFormData.name} onChange={e => setPaymentAccountFormData({...paymentAccountFormData, name: e.target.value})} className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
                      <textarea placeholder="Description" rows={1} value={paymentAccountFormData.description} onChange={e => setPaymentAccountFormData({...paymentAccountFormData, description: e.target.value})} className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#EF4444] mb-1">Opening Balance <span className="text-red-500">*</span></label>
                      <input type="number" required placeholder="Opening Balance" value={paymentAccountFormData.openingBalance} onChange={e => setPaymentAccountFormData({...paymentAccountFormData, openingBalance: Number(e.target.value) || 0})} className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#EF4444] mb-1">Status <span className="text-red-500">*</span></label>
                      <select required value={paymentAccountFormData.status} onChange={e => setPaymentAccountFormData({...paymentAccountFormData, status: e.target.value})} className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="bg-[#6366F1] text-white px-6 py-2 rounded-md font-bold hover:bg-indigo-600 transition-all flex items-center gap-2">
                      <CheckCircle size={18} /> Submit
                    </button>
                    <button type="button" onClick={() => setIsAddingPaymentAccount(false)} className="bg-[#6366F1] opacity-90 text-white px-6 py-2 rounded-md font-bold hover:opacity-100 transition-all flex items-center gap-2">
                      <ArrowLeft size={18} /> Back
                    </button>
                  </div>
                </form>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => setPaymentAccountSort({ key: 'name', direction: paymentAccountSort.key === 'name' && paymentAccountSort.direction === 'asc' ? 'desc' : 'asc' })}>
                        Account Name {paymentAccountSort.key === 'name' && (paymentAccountSort.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3 cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => setPaymentAccountSort({ key: 'type', direction: paymentAccountSort.key === 'type' && paymentAccountSort.direction === 'asc' ? 'desc' : 'asc' })}>
                        Account Type {paymentAccountSort.key === 'type' && (paymentAccountSort.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3 cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => setPaymentAccountSort({ key: 'description', direction: paymentAccountSort.key === 'description' && paymentAccountSort.direction === 'asc' ? 'desc' : 'asc' })}>
                        Description {paymentAccountSort.key === 'description' && (paymentAccountSort.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3 cursor-pointer select-none text-right hover:bg-gray-100 transition-colors" onClick={() => setPaymentAccountSort({ key: 'balance', direction: paymentAccountSort.key === 'balance' && paymentAccountSort.direction === 'asc' ? 'desc' : 'asc' })}>
                        Balance {paymentAccountSort.key === 'balance' && (paymentAccountSort.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3 text-center cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => setPaymentAccountSort({ key: 'status', direction: paymentAccountSort.key === 'status' && paymentAccountSort.direction === 'asc' ? 'desc' : 'asc' })}>
                        Status {paymentAccountSort.key === 'status' && (paymentAccountSort.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {[...paymentAccounts].sort((a,b) => {
                      let valA = a[paymentAccountSort.key === 'balance' ? 'openingBalance' : paymentAccountSort.key];
                      let valB = b[paymentAccountSort.key === 'balance' ? 'openingBalance' : paymentAccountSort.key];
                      
                      if (typeof valA === 'string') valA = valA.toLowerCase();
                      if (typeof valB === 'string') valB = valB.toLowerCase();
                      
                      if (valA < valB) return paymentAccountSort.direction === 'asc' ? -1 : 1;
                      if (valA > valB) return paymentAccountSort.direction === 'asc' ? 1 : -1;
                      return 0;
                    }).map((account, idx) => (
                      <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{account.name}</td>
                        <td className="px-6 py-4 text-xs font-mono uppercase text-gray-500">{account.type.replace('_', ' ')}</td>
                        <td className="px-6 py-4 text-gray-500">{account.description || '-'}</td>
                        <td className="px-6 py-4 font-mono font-bold text-right">{formatCurrency(account.openingBalance, settings)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${account.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {account.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => {
                            if(window.confirm('Are you sure you want to delete this payment account?')) {
                              deleteDoc(doc(db, 'payment_accounts', account.id)).then(() => {
                                setPaymentAccounts(paymentAccounts.filter(p => p.id !== account.id));
                                toast.success('Account deleted');
                              });
                            }
                          }} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {paymentAccounts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No payment accounts configured.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
  );
};

export default PaymentAccountsTab;
