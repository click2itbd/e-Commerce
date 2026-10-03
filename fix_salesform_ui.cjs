const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', 'utf8');

// 1. Destructure transactions
code = code.replace(/checkLowStock,\n    setActiveTab,\n  \}\) => \{/, "checkLowStock,\n    setActiveTab,\n    transactions = [],\n  }) => {");

// 2. Fix UI styles
const targetUI = `<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Date</label>
                <input
                  type="date"
                  value={saleData.date || ''}
                  onChange={e => setSaleData({ ...saleData, date: e.target.value })}
                  className="w-full border-gray-200 rounded text-xs focus:ring-blue-500 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Prepared By</label>
                <input
                  type="text"
                  placeholder="e.g. Fahad, Atik..."
                  value={saleData.createdBy || ''}
                  onChange={e => setSaleData({ ...saleData, createdBy: e.target.value })}
                  className="w-full border-gray-200 rounded text-xs focus:ring-blue-500 font-bold"
                />
              </div>`;

const replacementUI = `<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Date</label>
                <input
                  type="date"
                  value={saleData.date || ''}
                  onChange={e => setSaleData({ ...saleData, date: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 font-bold text-gray-800 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Prepared By</label>
                <input
                  type="text"
                  placeholder="e.g. Fahad, Atik..."
                  value={saleData.createdBy || ''}
                  onChange={e => setSaleData({ ...saleData, createdBy: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 font-bold text-gray-800 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>`;

code = code.replace(targetUI, replacementUI);

fs.writeFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', code, 'utf8');
console.log("Fixed SalesForm transactions and UI");
