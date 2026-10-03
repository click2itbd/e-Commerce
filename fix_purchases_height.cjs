const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');

// Prepared By
code = code.replace(/className="w-full border border-gray-200 rounded-lg p-2\.5 font-bold text-gray-900 focus:ring-\[\#EF4444\]"/, 'className="w-full h-[42px] border border-gray-200 rounded-lg px-3 font-bold text-gray-900 focus:ring-[#EF4444]"');

// Supplier select
code = code.replace(/className="w-full border border-gray-200 rounded-lg p-2\.5 font-bold text-gray-900"/, 'className="w-full h-[42px] border border-gray-200 rounded-lg px-3 font-bold text-gray-900"');

// Purchase Date & Reference
code = code.replace(/className="w-full border border-gray-200 rounded-lg p-2\.5 font-medium text-gray-900 focus:ring-\[\#EF4444\]"/g, 'className="w-full h-[42px] border border-gray-200 rounded-lg px-3 font-medium text-gray-900 focus:ring-[#EF4444]"');

fs.writeFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', code, 'utf8');
console.log("Fixed Purchases UI Heights");
