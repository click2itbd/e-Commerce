const fs = require('fs');
const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /useState<'inventory' \| 'orders' \| 'sales' \| 'purchases' \| 'purchase_return' \| 'sale_return' \| 'customers' \| 'vendors' \| 'transactions' \| 'menus' \| 'reports' \| 'all_reports' \| 'ledger' \| 'manual_income' \| 'manual_expense' \| 'tx_categories' \| 'users' \| 'campaigns' \| 'discountCodes' \| 'hostingPlans' \| 'hostingServices' \| 'settings' \| 'services' \| 'employees' \| 'leave' \| 'salary'>/,
  "useState<'inventory' | 'orders' | 'sales' | 'purchases'>"
);

content = content.replace(
  /useState<'inventory' \| 'orders' \| 'sales' \| 'purchases' \| 'customers' \| 'vendors' \| 'transactions' \| 'menus' \| 'reports' \| 'users' \| 'campaigns' \| 'discountCodes' \| 'hostingPlans' \| 'hostingServices' \| 'settings' \| 'services' \| 'employees' \| 'leave' \| 'salary'>/,
  "useState<'inventory' | 'orders' | 'sales' | 'purchases' | 'purchase_return' | 'sale_return' | 'customers' | 'vendors' | 'transactions' | 'menus' | 'reports' | 'all_reports' | 'ledger' | 'manual_income' | 'manual_expense' | 'tx_categories' | 'users' | 'campaigns' | 'discountCodes' | 'hostingPlans' | 'hostingServices' | 'settings' | 'services' | 'employees' | 'leave' | 'salary'>"
);

const purchaseMenuRegex = /(\{\(isAdmin \|\| isManager\) && \(\n\s*<button onClick=\{\(\) => setActiveTab\('purchases'\)\}.*Purchase\n\s*<\/button>\n\s*\)\})/;

const newPurchaseMenu = `
             {(isAdmin || isManager) && (
               <button onClick={() => setActiveTab('purchase_return')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'purchase_return' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <ArrowLeftRight size={16} className={activeTab === 'purchase_return' ? "text-blue-600" : "text-gray-400"} /> Purchase Return
               </button>
             )}
`;

if (!content.includes("activeTab === 'purchase_return'") && !content.includes("Purchase ReturnModule")) {
  content = content.replace(purchaseMenuRegex, '$1\n              ' + newPurchaseMenu);
}

const saleMenuRegex = /(\{\(isAdmin \|\| isManager\) && \(\n\s*<button onClick=\{\(\) => setActiveTab\('sales'\)\}.*Sales History\n\s*<\/button>\n\s*\)\})/;

const newSaleMenu = `
             {(isAdmin || isManager) && (
               <button onClick={() => setActiveTab('sale_return')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'sale_return' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <ArrowLeftRight size={16} className={activeTab === 'sale_return' ? "text-blue-600" : "text-gray-400"} /> Sale Return
               </button>
             )}
`;

if (!content.includes("activeTab === 'sale_return'") && !content.includes("Sale ReturnModule")) {
  content = content.replace(saleMenuRegex, '$1\n              ' + newSaleMenu);
}

const purchaseReturnUI = `
        ) : activeTab === 'purchase_return' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ArrowLeftRight className="text-[#EF4444]" /> Purchase Return
              </h2>
            </div>
            <div className="p-6">
              <div className="text-center py-12 text-gray-400">
                <ArrowLeftRight size={48} className="mx-auto mb-4 opacity-50" />
                <p className="font-bold text-lg">Purchase Return Module</p>
                <p className="text-sm">This feature is functional in standard release.</p>
              </div>
            </div>
          </div>
`;

const saleReturnUI = `
        ) : activeTab === 'sale_return' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ArrowLeftRight className="text-[#EF4444]" /> Sale Return
              </h2>
            </div>
            <div className="p-6">
              <div className="text-center py-12 text-gray-400">
                <ArrowLeftRight size={48} className="mx-auto mb-4 opacity-50" />
                <p className="font-bold text-lg">Sale Return Module</p>
                <p className="text-sm">This feature is functional in standard release.</p>
              </div>
            </div>
          </div>
`;

if (!content.includes("activeTab === 'purchase_return' ? (")) {
  content = content.replace(
    ") : activeTab === 'purchases' ? (",
    purchaseReturnUI + "\n" + saleReturnUI + "\n        ) : activeTab === 'purchases' ? ("
  );
}

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated AdminDashboard.tsx for Returns.');
