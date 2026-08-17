const fs = require('fs');
const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add payment_accounts to activeTab type
content = content.replace(
  "| 'transaction_history'>('inventory');",
  "| 'transaction_history' | 'payment_accounts'>('inventory');"
);

// 2. Add paymentAccounts state
const stateInjectPoint = "const [activeTab, setActiveTab] = useState<";
const paymentAccountsState = `  const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);
  const [isAddingPaymentAccount, setIsAddingPaymentAccount] = useState(false);
  const [paymentAccountFormData, setPaymentAccountFormData] = useState({ type: '', name: '', description: '', openingBalance: 0, status: 'active' });
`;
content = content.replace(stateInjectPoint, paymentAccountsState + stateInjectPoint);

// 3. Update Sidebar mapping
content = content.replace(
  "onClick={() => setActiveTab('transactions')}",
  "onClick={() => setActiveTab('payment_accounts')}"
);
content = content.replace(
  "className={activeTab === 'transactions'",
  "className={activeTab === 'payment_accounts'"
);
content = content.replace(
  "className={activeTab === 'transactions'",
  "className={activeTab === 'payment_accounts'"
);

// 4. Add UI for payment_accounts
const uiInjectPoint = `        ) : activeTab === 'transactions' && (isAdmin || isManager) ? (`;
const paymentAccountsUI = `        ) : activeTab === 'payment_accounts' && (isAdmin || isManager) ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CreditCard className="text-[#EF4444]" /> Payment Account
              </h2>
              <div className="flex gap-2">
                {!isAddingPaymentAccount && (
                  <button onClick={() => setIsAddingPaymentAccount(true)} className="bg-[#081621] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#EF4444] transition-all font-bold text-sm">
                    <Plus size={18} /> Add Payment Account
                  </button>
                )}
              </div>
            </div>

            {isAddingPaymentAccount ? (
              <div className="p-6">
                <form onSubmit={async (e) => {
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
                        <option value="bank">Bank</option>
                        <option value="mobile_banking">Mobile Banking (bkash, nagad, etc)</option>
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
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 cursor-pointer select-none">Account Name</th>
                      <th className="px-6 py-3 cursor-pointer select-none">Account Type</th>
                      <th className="px-6 py-3 cursor-pointer select-none">Description</th>
                      <th className="px-6 py-3 cursor-pointer select-none text-right">Balance</th>
                      <th className="px-6 py-3 text-center">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {paymentAccounts.map((account, idx) => (
                      <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{account.name}</td>
                        <td className="px-6 py-4 text-xs font-mono uppercase text-gray-500">{account.type.replace('_', ' ')}</td>
                        <td className="px-6 py-4 text-gray-500">{account.description || '-'}</td>
                        <td className="px-6 py-4 font-mono font-bold text-right">{formatCurrency(account.openingBalance)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={\`px-2 py-1 rounded-full text-[10px] font-bold \${account.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>
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
`;

if(content.includes(uiInjectPoint)) {
  content = content.replace(uiInjectPoint, paymentAccountsUI + uiInjectPoint);
} else {
  console.log('UI Inject Point not found!');
  process.exit(1);
}

// 5. Add loading of paymentAccounts in useEffect
const dbLoadInjectPoint = `const unsubscribeLeaves = onSnapshot(collection(db, 'employee_leaves')`;
const dbLoadPaymentAccounts = `    const unsubscribePaymentAccounts = onSnapshot(collection(db, 'payment_accounts'), (snapshot) => {
      setPaymentAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    }, (error) => {
      console.error('Error fetching payment accounts:', error);
    });

`;

if(content.includes(dbLoadInjectPoint)) {
  content = content.replace(dbLoadInjectPoint, dbLoadPaymentAccounts + dbLoadInjectPoint);
} else {
  console.log('DB Load Inject Point not found!');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully injected payment accounts UI');
