import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, updateDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { PaymentAccount, Transaction } from '../../../../types';
import { formatCurrency, cn } from '../../../../lib/utils';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { moveToTrash } from '../../../../lib/trash';
import { logAudit } from '../../../../lib/audit';
import { useSettings } from '../../../../context/SettingsContext';
import {
  CreditCard,
  Plus,
  CheckCircle,
  ArrowLeft,
  Trash2,
  Edit2,
  Building,
  DollarSign,
  TrendingUp,
  FileText,
  ArrowLeftRight,
  X,
  Lock,
  Shield,
  AlertTriangle,
} from 'lucide-react';

interface PaymentAccountsTabProps {
  setSelectedLedgerEntity?: (v: any) => void;
  setActiveTab?: (tab: string) => void;
}

const PaymentAccountsTab: React.FC<PaymentAccountsTabProps> = ({
  setActiveTab,
}) => {
  const { hasPermission, isAdmin, profile, user } = useAuth();
  const { settings } = useSettings();

  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [isAddingPaymentAccount, setIsAddingPaymentAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(null);
  const [formData, setFormData] = useState({
    type: 'cash',
    name: '',
    description: '',
    openingBalance: 0,
    status: 'active' as 'active' | 'inactive',
  });

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accSnap, txSnap] = await Promise.all([
        getDocs(query(collection(db, 'payment_accounts'), orderBy('name'))),
        getDocs(query(collection(db, 'transactions'), orderBy('date', 'desc'))),
      ]);

      let accounts = accSnap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentAccount));

      // Auto-provision standard EPS Gateway and Courier COD accounts if missing
      const hasEps = accounts.some(a => a.name?.trim().toLowerCase() === 'eps payment gateway');
      const hasCod = accounts.some(a => a.name?.trim().toLowerCase() === 'courier cod receivable');

      if (!hasEps) {
        try {
          const docRef = await addDoc(collection(db, 'payment_accounts'), {
            name: 'EPS Payment Gateway',
            type: 'bank',
            description: 'Web Online Orders Escrow Gateway (EPS)',
            openingBalance: 0,
            status: 'active',
            createdAt: new Date().toISOString()
          });
          accounts.push({
            id: docRef.id,
            name: 'EPS Payment Gateway',
            type: 'bank',
            description: 'Web Online Orders Escrow Gateway (EPS)',
            openingBalance: 0,
            status: 'active',
            createdAt: new Date().toISOString()
          });
        } catch (e) {
          console.warn('Failed to auto-create EPS account:', e);
        }
      }

      if (!hasCod) {
        try {
          const docRef = await addDoc(collection(db, 'payment_accounts'), {
            name: 'Courier COD Receivable',
            type: 'cash',
            description: 'Courier Cash on Delivery (COD) Holding Account',
            openingBalance: 0,
            status: 'active',
            createdAt: new Date().toISOString()
          });
          accounts.push({
            id: docRef.id,
            name: 'Courier COD Receivable',
            type: 'cash',
            description: 'Courier Cash on Delivery (COD) Holding Account',
            openingBalance: 0,
            status: 'active',
            createdAt: new Date().toISOString()
          });
        } catch (e) {
          console.warn('Failed to auto-create Courier COD account:', e);
        }
      }

      setPaymentAccounts(accounts);
      setTransactions(txSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load payment accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute live current balance per payment account
  const calculateCurrentBalance = (acc: PaymentAccount) => {
    const opening = Number(acc.openingBalance || 0);
    const accTx = transactions.filter(tx => {
      return tx.paymentAccountId === acc.id;
    });

    const inflow = accTx
      .filter(tx => ['sale', 'payment_received', 'money_receipt', 'income', 'purchase_return', 'deposit', 'transfer_in'].includes(tx.type))
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const outflow = accTx
      .filter(tx => ['purchase', 'payment_made', 'expense', 'salary', 'conveyance', 'sale_return', 'withdrawal', 'transfer_out'].includes(tx.type))
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    return opening + inflow - outflow;
  };

  // Submit Handler: Add or Edit Account
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter account name');
      return;
    }

    if (!isAdmin) {
      toast.error('অননুমোদিত অ্যাক্সেস! শুধুমাত্র অ্যাডমিন পেমেন্ট অ্যাকাউন্ট তৈরি বা পরিবর্তন করতে পারবেন।');
      return;
    }

    try {
      const currentUser = profile?.displayName || profile?.email || user?.displayName || user?.email || 'Admin';
      const sanitizedOpeningBal = Number(formData.openingBalance) || 0;

      if (editingAccount) {
        const oldOpening = Number(editingAccount.openingBalance) || 0;
        const isOpeningChanged = oldOpening !== sanitizedOpeningBal;

        if (isOpeningChanged) {
          const confirmChange = window.confirm(
            `নিরাপত্তা সতর্কতা: আপনি "${editingAccount.name}" অ্যাকাউন্টের ওপেনিং ব্যালেন্স ৳${oldOpening.toLocaleString()} থেকে পরিবর্তন করে ৳${sanitizedOpeningBal.toLocaleString()} করতে যাচ্ছেন। এর ফলে বর্তমান মোট ক্যাশ ও ব্যালেন্সে সরাসরি প্রভাব পড়বে। আপনি কি নিশ্চিত?`
          );
          if (!confirmChange) return;
        }

        await updateDoc(doc(db, 'payment_accounts', editingAccount.id), {
          type: formData.type,
          name: formData.name,
          description: formData.description || '',
          openingBalance: sanitizedOpeningBal,
          status: formData.status,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser,
        });

        if (isOpeningChanged) {
          await logAudit(
            'EDIT',
            'finances',
            `[SECURITY AUDIT] Admin ${currentUser} modified opening balance of account "${editingAccount.name}" from ৳${oldOpening.toLocaleString()} to ৳${sanitizedOpeningBal.toLocaleString()}`,
            currentUser,
            {
              accountId: editingAccount.id,
              accountName: editingAccount.name,
              oldOpeningBalance: oldOpening,
              newOpeningBalance: sanitizedOpeningBal,
            }
          );
        } else {
          await logAudit(
            'EDIT',
            'finances',
            `Updated payment account "${editingAccount.name}" details by ${currentUser}`,
            currentUser
          );
        }

        toast.success('Payment account updated successfully');
      } else {
        const newDoc = await addDoc(collection(db, 'payment_accounts'), {
          ...formData,
          openingBalance: sanitizedOpeningBal,
          createdAt: new Date().toISOString(),
          createdBy: currentUser,
        });

        await logAudit(
          'CREATE',
          'finances',
          `Created payment account "${formData.name}" (${formData.type}) with initial opening balance ৳${sanitizedOpeningBal.toLocaleString()} by ${currentUser}`,
          currentUser,
          {
            accountId: newDoc.id,
            accountName: formData.name,
            openingBalance: sanitizedOpeningBal,
          }
        );

        toast.success('Payment account created successfully');
      }

      setIsAddingPaymentAccount(false);
      setEditingAccount(null);
      setFormData({ type: 'cash', name: '', description: '', openingBalance: 0, status: 'active' });
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save payment account');
    }
  };

  const handleEditClick = (account: PaymentAccount) => {
    if (!isAdmin) {
      toast.error('শুধুমাত্র অ্যাডমিন পেমেন্ট অ্যাকাউন্ট এডিট করতে পারবেন!');
      return;
    }
    setEditingAccount(account);
    setFormData({
      type: account.type || 'cash',
      name: account.name || '',
      description: account.description || '',
      openingBalance: Number(account.openingBalance) || 0,
      status: account.status || 'active',
    });
    setIsAddingPaymentAccount(true);
  };

  const handleDeletePaymentAccount = async (id: string) => {
    if (!isAdmin) {
      toast.error('অননুমোদিত অ্যাক্সেস! শুধুমাত্র অ্যাডমিন পেমেন্ট অ্যাকাউন্ট মুছে ফেলতে পারবেন।');
      return;
    }
    const acc = paymentAccounts.find(a => a.id === id);
    if (!acc) return;

    const hasTx = transactions.some(t => t.paymentAccountId === id);
    if (hasTx) {
      toast.error('এই অ্যাকাউন্টে লেনদেন রয়েছে! লেনদেনযুক্ত অ্যাকাউন্ট মুছে ফেলা যাবে না। প্রয়োজনে স্ট্যাটাস Inactive করুন।');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete payment account "${acc.name}"?`)) return;
    try {
      const currentUser = profile?.displayName || profile?.email || user?.displayName || user?.email || 'Admin';
      await moveToTrash({
        category: 'accounting',
        subCategory: 'Payment Account',
        collectionName: 'payment_accounts',
        entityId: id,
        title: `${acc.name} (${acc.type})`,
        subtitle: acc.description || '',
        amount: Number(acc.openingBalance || 0),
        data: acc,
        deletedBy: currentUser,
        details: `Deleted payment account: ${acc.name}`
      });
      await deleteDoc(doc(db, 'payment_accounts', id));
      await logAudit('DELETE', 'finances', `Deleted payment account "${acc.name}" (${acc.type}) by ${currentUser}`, currentUser);
      toast.success('Payment account deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const totalLiquidCash = paymentAccounts.reduce((sum, acc) => sum + calculateCurrentBalance(acc), 0);
  const totalOpeningCapital = paymentAccounts.reduce((sum, acc) => sum + (Number(acc.openingBalance) || 0), 0);

  if (!hasPermission('manage_finances')) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden space-y-6">
      {/* Header */}
      <div className="p-6 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="text-[#EF4444]" /> Payment Accounts & Cash Wallets
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Manage your physical cash drawers, bank accounts, and mobile financial services (bKash/Nagad).
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {isAdmin ? (
            !isAddingPaymentAccount && (
              <button
                onClick={() => {
                  setEditingAccount(null);
                  setFormData({ type: 'cash', name: '', description: '', openingBalance: 0, status: 'active' });
                  setIsAddingPaymentAccount(true);
                }}
                className="bg-[#081621] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#EF4444] transition-all font-bold text-xs shadow-sm cursor-pointer"
              >
                <Plus size={16} /> Add Payment Account
              </button>
            )
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">
              <Lock size={13} className="text-slate-500" />
              <span>অ্যাকাউন্ট তৈরি ও ব্যালেন্স অ্যাডমিন নিয়ন্ত্রিত</span>
            </div>
          )}
        </div>
      </div>

      {/* Staff Security Notice */}
      {!isAdmin && (
        <div className="mx-6 p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 font-medium">
          <Shield size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">স্টাফ সিকিউরিটি পলিসি:</span> অপব্যবহার বা ব্যালেন্স হেরফের রোধ করতে কর্মীদের জন্য পেমেন্ট অ্যাকাউন্টের ওপেনিং ব্যালেন্স পরিবর্তন, নতুন অ্যাকাউন্ট তৈরি বা মুছে ফেলা সম্পূর্ণভাবে বন্ধ রাখা হয়েছে। কর্মীগণ শুধুমাত্র অ্যাকাউন্টের লাইভ ব্যালেন্স ও স্টেটমেন্ট দেখতে পারবেন।
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="px-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Total Liquid Balance</span>
            <DollarSign size={16} className="text-blue-600" />
          </div>
          <span className="text-2xl font-black text-blue-950 mt-1 block">
            {formatCurrency(totalLiquidCash, settings)}
          </span>
          <span className="text-[10px] text-blue-600 mt-1 block">Live balance across all accounts</span>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Initial Opening Capital</span>
            <Building size={16} className="text-gray-400" />
          </div>
          <span className="text-xl font-black text-gray-900 mt-1 block">
            {formatCurrency(totalOpeningCapital, settings)}
          </span>
          <span className="text-[10px] text-gray-500 mt-1 block">Sum of initial opening balances</span>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Active Payment Accounts</span>
            <CheckCircle size={16} className="text-emerald-600" />
          </div>
          <span className="text-xl font-black text-emerald-950 mt-1 block">
            {paymentAccounts.filter(a => a.status === 'active').length} Accounts
          </span>
          <span className="text-[10px] text-emerald-600 mt-1 block">Ready for POS & Billing</span>
        </div>
      </div>

      {/* Add / Edit Form */}
      {isAddingPaymentAccount ? (
        <div className="px-6 pb-6">
          <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                {editingAccount ? 'Edit Payment Account' : 'Add New Payment Account'}
                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-black flex items-center gap-1">
                  <Shield size={11} /> Admin Only
                </span>
              </h3>
              <button
                onClick={() => { setIsAddingPaymentAccount(false); setEditingAccount(null); }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {editingAccount && (() => {
              const txCount = transactions.filter(t => t.paymentAccountId === editingAccount.id).length;
              if (txCount > 0) {
                return (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">নিরাপত্তা সতর্কতা: লেনদেনযুক্ত অ্যাকাউন্ট ({txCount}টি লেনদেন পাওয়া গেছে)</div>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        এই অ্যাকাউন্টে ইতিমধ্যে লেনদেন সম্পন্ন হয়েছে। ওপেনিং ব্যালেন্স পরিবর্তন করলে সার্বিক ক্যাশ/ব্যাংক ব্যালেন্সে সরাসরি প্রভাব পড়বে এবং সিকিউরিটি অডিট লগে এটি স্থায়ীভাবে সংরক্ষিত হবে।
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <form onSubmit={handleSaveAccount} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">
                    Account Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2 font-medium"
                  >
                    <option value="cash">Cash Drawer</option>
                    <option value="bank">Bank Account</option>
                    <option value="bkash">bKash (Merchant / Personal)</option>
                    <option value="nagad">Nagad</option>
                    <option value="card">Card / POS Terminal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">
                    Account Name / Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. City Bank CD A/C #9481, Shop Cash Drawer"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1 flex items-center justify-between">
                    <span>Opening Balance (৳) <span className="text-red-500">*</span></span>
                    <span className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5">
                      <Lock size={11} /> অ্যাডমিন সুরক্ষিত
                    </span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={formData.openingBalance}
                    onChange={e => setFormData({ ...formData, openingBalance: Number(e.target.value) || 0 })}
                    className="w-full border border-gray-200 rounded-lg p-2 font-black text-gray-900"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    অ্যাকাউন্টের মূল বা প্রাথমিক মূলধন (স্টাফদের জন্য এন্ট্রি বন্ধ)।
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Description / Account Details</label>
                  <input
                    type="text"
                    placeholder="e.g. Branch: Dhanmondi, Routing: 22527189"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full border border-gray-200 rounded-lg p-2 font-medium"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="bg-[#EF4444] hover:bg-red-600 text-white px-5 py-2 rounded-lg font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle size={14} /> {editingAccount ? 'Update Account' : 'Save Account'}
                </button>
                <button
                  type="button"
                  onClick={() => { setIsAddingPaymentAccount(false); setEditingAccount(null); }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Account Table */}
      <div className="overflow-x-auto border-t border-gray-100">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3.5">Account Name</th>
              <th className="px-6 py-3.5">Account Type</th>
              <th className="px-6 py-3.5">Description</th>
              <th className="px-6 py-3.5 text-right">
                <span className="inline-flex items-center gap-1 justify-end">
                  Opening Balance
                  <Lock size={11} className="text-slate-400" title="Locked Capital" />
                </span>
              </th>
              <th className="px-6 py-3.5 text-right">Live Current Balance</th>
              <th className="px-6 py-3.5 text-center">Status</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400">Loading accounts...</td>
              </tr>
            ) : paymentAccounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">
                  No payment accounts configured yet.
                </td>
              </tr>
            ) : (
              paymentAccounts.map(account => {
                const liveBal = calculateCurrentBalance(account);
                return (
                  <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-gray-900 flex items-center gap-2">
                      <Building size={14} className="text-gray-400" />
                      {account.name}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {account.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-500">{account.description || '-'}</td>
                    <td className="px-6 py-3.5 text-right font-medium text-gray-600">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <span>{formatCurrency(account.openingBalance, settings)}</span>
                        <Lock size={11} className="text-slate-300" title="Protected Initial Opening Capital" />
                      </div>
                    </td>
                    <td className={cn(
                      "px-6 py-3.5 text-right font-black text-sm",
                      liveBal >= 0 ? "text-emerald-700" : "text-red-600"
                    )}>
                      {formatCurrency(liveBal, settings)}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        account.status === 'active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {account.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {setActiveTab && (
                          <button
                            onClick={() => setActiveTab('account_statement')}
                            className="text-xs text-blue-600 hover:text-blue-800 font-bold px-2 py-1 bg-blue-50 rounded cursor-pointer"
                            title="View Statement"
                          >
                            Statement
                          </button>
                        )}
                        {isAdmin ? (
                          <>
                            <button
                              onClick={() => handleEditClick(account)}
                              className="p-1 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
                              title="Edit Account (Admin Only)"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeletePaymentAccount(account.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Delete Account (Admin Only)"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 rounded border border-slate-100">
                            <Lock size={10} /> View Only
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentAccountsTab;
