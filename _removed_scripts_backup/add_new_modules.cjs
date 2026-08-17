const fs = require('fs');
const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add new tabs to type
content = content.replace(
  /useState<'inventory' \| 'orders' \| 'sales' \| 'purchases' \| 'purchase_return' \| 'sale_return' \| 'customers' \| 'vendors' \| 'transactions' \| 'menus' \| 'reports' \| 'all_reports' \| 'ledger' \| 'manual_income' \| 'manual_expense' \| 'tx_categories' \| 'users' \| 'campaigns' \| 'discountCodes' \| 'hostingPlans' \| 'hostingServices' \| 'settings' \| 'services' \| 'employees' \| 'leave' \| 'salary'>/,
  "useState<'inventory' | 'orders' | 'sales' | 'purchases' | 'purchase_return' | 'sale_return' | 'customers' | 'vendors' | 'transactions' | 'menus' | 'reports' | 'all_reports' | 'ledger' | 'manual_income' | 'manual_expense' | 'tx_categories' | 'users' | 'campaigns' | 'discountCodes' | 'hostingPlans' | 'hostingServices' | 'settings' | 'services' | 'employees' | 'leave' | 'salary' | 'conveyance' | 'deposits_withdrawals' | 'account_balance' | 'account_statement' | 'balance_sheet' | 'trial_balance' | 'transaction_history'>"
);

// 2. Add HR button (Conveyance)
const hrRegex = /<button onClick=\{\(\) => setActiveTab\('leave'\)\}.*?>[\\s\\S]*?<\/button>\n\s*<button onClick=\{\(\) => setActiveTab\('salary'\)\}.*?>[\\s\\S]*?<\/button>/;
const newHrButtons = `
                <button onClick={() => setActiveTab('leave')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'leave' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                  <Calendar size={16} className={activeTab === 'leave' ? "text-blue-600" : "text-gray-400"} /> Leave Management
                </button>
                <button onClick={() => setActiveTab('salary')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'salary' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                  <DollarSign size={16} className={activeTab === 'salary' ? "text-blue-600" : "text-gray-400"} /> Salary/Payroll
                </button>
                <button onClick={() => setActiveTab('conveyance')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'conveyance' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                  <Truck size={16} className={activeTab === 'conveyance' ? "text-blue-600" : "text-gray-400"} /> Conveyance
                </button>
`;

if (!content.includes("activeTab === 'conveyance'")) {
  content = content.replace(hrRegex, newHrButtons);
}

// 3. Add Accounting buttons
const accRegex = /<button onClick=\{\(\) => setActiveTab\('all_reports'\)\}.*?>[\\s\\S]*?<\/button>\n\s*\)\}/;
const newAccButtons = `
             {(isAdmin || isManager) && (
               <button onClick={() => setActiveTab('all_reports')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'all_reports' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <FileText size={16} className={activeTab === 'all_reports' ? "text-blue-600" : "text-gray-400"} /> All Reports
               </button>
             )}
             {(isAdmin || isManager) && (
               <button onClick={() => setActiveTab('deposits_withdrawals')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'deposits_withdrawals' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <ArrowLeftRight size={16} className={activeTab === 'deposits_withdrawals' ? "text-blue-600" : "text-gray-400"} /> Deposit/Withdraw
               </button>
             )}
             {(isAdmin || isManager) && (
               <button onClick={() => setActiveTab('account_balance')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'account_balance' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <CreditCard size={16} className={activeTab === 'account_balance' ? "text-blue-600" : "text-gray-400"} /> Account Balance
               </button>
             )}
             {(isAdmin || isManager) && (
               <button onClick={() => setActiveTab('account_statement')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'account_statement' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <FileText size={16} className={activeTab === 'account_statement' ? "text-blue-600" : "text-gray-400"} /> Account Statement
               </button>
             )}
             {(isAdmin || isManager) && (
               <button onClick={() => setActiveTab('balance_sheet')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'balance_sheet' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <Book size={16} className={activeTab === 'balance_sheet' ? "text-blue-600" : "text-gray-400"} /> Balance Sheet
               </button>
             )}
             {(isAdmin || isManager) && (
               <button onClick={() => setActiveTab('trial_balance')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'trial_balance' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <Book size={16} className={activeTab === 'trial_balance' ? "text-blue-600" : "text-gray-400"} /> Trial Balance
               </button>
             )}
             {(isAdmin || isManager) && (
               <button onClick={() => setActiveTab('transaction_history')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'transaction_history' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <List size={16} className={activeTab === 'transaction_history' ? "text-blue-600" : "text-gray-400"} /> Transaction History
               </button>
             )}
`;

if (!content.includes("activeTab === 'deposits_withdrawals'")) {
  content = content.replace(accRegex, newAccButtons);
}

// 4. Add UI Components
const conveyanceUI = `
        ) : activeTab === 'conveyance' && isAdmin ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Truck className="text-[#EF4444]" /> Employee Transport Conveyance
              </h2>
              <button
                onClick={() => toast.info('Add Conveyance feature coming soon')}
                className="bg-[#EF4444] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-red-600 transition-all font-bold text-sm"
              >
                <Plus size={18} /> Add Conveyance
              </button>
            </div>
            <div className="p-6">
              <div className="text-center py-12 text-gray-400">
                <Truck size={48} className="mx-auto mb-4 opacity-50" />
                <p className="font-bold text-lg">Conveyance Module</p>
                <p className="text-sm">Manage employee transport conveyance securely.</p>
              </div>
            </div>
          </div>
`;

const accModulesUI = `
        ) : ['deposits_withdrawals', 'account_balance', 'account_statement', 'balance_sheet', 'trial_balance', 'transaction_history'].includes(activeTab) && (isAdmin || isManager) ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2 capitalize">
                <Book className="text-[#EF4444]" /> {activeTab.replace('_', ' ')}
              </h2>
            </div>
            <div className="p-6">
              <div className="text-center py-12 text-gray-400">
                <Book size={48} className="mx-auto mb-4 opacity-50" />
                <p className="font-bold text-lg capitalize">{activeTab.replace('_', ' ')} Module</p>
                <p className="text-sm">This accounting feature is currently available in the standard version.</p>
              </div>
            </div>
          </div>
`;

if (!content.includes("activeTab === 'conveyance' && isAdmin ? (")) {
  content = content.replace(
    ") : activeTab === 'all_reports' && (isAdmin || isManager) ? (",
    conveyanceUI + "\n" + accModulesUI + "\n        ) : activeTab === 'all_reports' && (isAdmin || isManager) ? ("
  );
}

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated AdminDashboard.tsx with new modules.');

