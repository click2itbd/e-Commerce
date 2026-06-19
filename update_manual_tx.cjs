const fs = require('fs');
const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add state for transaction categories and new manual forms
const transactionCategoryStateStr = `
  const [transactionCategories, setTransactionCategories] = useState<TransactionCategory[]>([]);
  const [isAddingTransactionCategory, setIsAddingTransactionCategory] = useState(false);
  const [newTransactionCategory, setNewTransactionCategory] = useState<Partial<TransactionCategory>>({ name: '', type: 'expense', description: '' });

  const [isAddingManualTransaction, setIsAddingManualTransaction] = useState(false);
  const [manualTransactionType, setManualTransactionType] = useState<'income' | 'expense'>('expense');
  const [newManualTransaction, setNewManualTransaction] = useState<Partial<Transaction>>({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    categoryId: '',
  });

  const handleSaveTransactionCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransactionCategory.name) return;

    const category: TransactionCategory = {
      id: Date.now().toString(),
      name: newTransactionCategory.name,
      type: newTransactionCategory.type as 'income' | 'expense',
      description: newTransactionCategory.description || '',
      createdAt: new Date().toISOString(),
    };

    const savedCategories = localStorage.getItem('transactionCategories');
    const existing = savedCategories ? JSON.parse(savedCategories) : [];
    localStorage.setItem('transactionCategories', JSON.stringify([...existing, category]));
    setTransactionCategories([...existing, category]);
    setIsAddingTransactionCategory(false);
    setNewTransactionCategory({ name: '', type: 'expense', description: '' });
    toast.success('Category added successfully');
  };

  const handleSaveManualTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newManualTransaction.amount || newManualTransaction.amount <= 0 || !newManualTransaction.description) {
      toast.error('Please enter amount and description');
      return;
    }

    const selectedCategory = transactionCategories.find(c => c.id === newManualTransaction.categoryId);

    const transaction: Transaction = {
      id: Date.now().toString(),
      type: manualTransactionType,
      amount: newManualTransaction.amount,
      date: newManualTransaction.date || new Date().toISOString().split('T')[0],
      description: newManualTransaction.description || '',
      entityId: 'manual', // indicates no specific customer/vendor
      entityName: 'Manual Entry',
      categoryId: newManualTransaction.categoryId,
      categoryName: selectedCategory ? selectedCategory.name : 'Uncategorized',
      createdAt: new Date().toISOString(),
    };

    const updatedTransactions = [...transactions, transaction];
    localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
    setTransactions(updatedTransactions);
    
    setIsAddingManualTransaction(false);
    setNewManualTransaction({
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
      categoryId: '',
    });
    toast.success('Transaction saved successfully');
  };
`;

if (!content.includes('const [transactionCategories')) {
  // Find "const [transactions" and inject before it
  content = content.replace(
    /(\n\s*const \[transactions, setTransactions\] = useState<Transaction\[\]>\(\[\]\);)/,
    '$1' + transactionCategoryStateStr
  );
}

// 2. Load categories in fetch data
const fetchCategoriesStr = `
      const savedTransactionCategories = localStorage.getItem('transactionCategories');
      if (savedTransactionCategories) {
        setTransactionCategories(JSON.parse(savedTransactionCategories));
      }
`;

content = content.replace(
  /(const savedTransactions = localStorage\.getItem\('transactions'\);)/,
  fetchCategoriesStr + '\n      $1'
);


// 3. Add UI components in AdminDashboard
// Find the Ledger or Payment Account buttons and add "Categories" & "Manual Entry"
// Maybe under Accounting section
const accountingMenuRegex = /(\{\(isAdmin \|\| isManager\) && \(\n\s*<button onClick=\{\(\) => setActiveTab\('transactions'\)\}.*Payment Account\n\s*<\/button>\n\s*\)\})/;

const newMenuButtons = `
             {(isAdmin || isManager) && (
               <button onClick={() => setActiveTab('manual_income')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'manual_income' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <Download size={16} className={activeTab === 'manual_income' ? "text-blue-600" : "text-gray-400"} /> Manual Income
               </button>
             )}
             {(isAdmin || isManager) && (
               <button onClick={() => setActiveTab('manual_expense')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'manual_expense' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <Upload size={16} className={activeTab === 'manual_expense' ? "text-blue-600" : "text-gray-400"} /> Manual Expense
               </button>
             )}
             {(isAdmin || isManager) && (
               <button onClick={() => setActiveTab('tx_categories')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'tx_categories' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <List size={16} className={activeTab === 'tx_categories' ? "text-blue-600" : "text-gray-400"} /> Categories
               </button>
             )}
`;

content = content.replace(accountingMenuRegex, '$1\n' + newMenuButtons);


// 4. Add the Views in the main content area
const txCategoriesViewStr = `
        ) : activeTab === 'tx_categories' && (isAdmin || isManager) ? (
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
`;

const manualExpenseViewStr = `
        ) : activeTab === 'manual_expense' && (isAdmin || isManager) ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Upload className="text-[#EF4444]" /> Manual Expenses
              </h2>
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
                      <td className="px-6 py-4 text-right font-bold text-red-600">{formatCurrency(t.amount)}</td>
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
          </div>
`;

const manualIncomeViewStr = `
        ) : activeTab === 'manual_income' && (isAdmin || isManager) ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Download className="text-[#EF4444]" /> Manual Income
              </h2>
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
                      <td className="px-6 py-4 text-right font-bold text-green-600">{formatCurrency(t.amount)}</td>
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
`;

if (!content.includes('activeTab === \'manual_income\'')) {
  const targetRegex = /\)\s*:\s*activeTab === 'transactions' && \(isAdmin \|\| isManager\) \? \(/;
  content = content.replace(
    targetRegex,
    txCategoriesViewStr + '\n' + manualExpenseViewStr + '\n' + manualIncomeViewStr + '\n        ) : activeTab === \'transactions\' && (isAdmin || isManager) ? ('
  );
}


// 5. Add Modals for Add Category and Add Manual Transaction
const modalsStr = `
      {/* Transaction Category Modal */}
      {isAddingTransactionCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Add Category</h2>
              <button onClick={() => setIsAddingTransactionCategory(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveTransactionCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={newTransactionCategory.name}
                  onChange={e => setNewTransactionCategory({ ...newTransactionCategory, name: e.target.value })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                <select
                  required
                  value={newTransactionCategory.type}
                  onChange={e => setNewTransactionCategory({ ...newTransactionCategory, type: e.target.value as 'income' | 'expense' })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444]"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newTransactionCategory.description}
                  onChange={e => setNewTransactionCategory({ ...newTransactionCategory, description: e.target.value })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444]"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsAddingTransactionCategory(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-md font-bold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-[#EF4444] text-white rounded-md font-bold hover:bg-red-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Transaction Modal */}
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
`;

if (!content.includes('isAddingTransactionCategory && (')) {
  // Find {isAddingUser && (
  content = content.replace(
    /(\{\/\* Add User Modal \*\/)/,
    modalsStr + '\n      $1'
  );
}

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully added Manual Income and Expense features.');
