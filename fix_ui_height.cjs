const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', 'utf8');

// Date & Prepared By
code = code.replace(/className="w-full border border-gray-200 rounded-lg p-2\.5 font-bold text-gray-800 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"/g, 'className="w-full h-[42px] border border-gray-200 rounded-lg px-3 font-bold text-gray-800 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"');

// Document Type select
code = code.replace(/className="w-full border border-gray-200 rounded-lg p-2\.5 font-bold text-gray-800"/, 'className="w-full h-[42px] border border-gray-200 rounded-lg px-3 font-bold text-gray-800"');

// Customer select
code = code.replace(/className="w-full border border-gray-200 rounded-lg p-2\.5 font-bold text-gray-900 bg-white"/, 'className="w-full h-[42px] border border-gray-200 rounded-lg px-3 font-bold text-gray-900 bg-white"');

// Customer + New button
code = code.replace(/className="bg-\[\#081621\] hover:bg-\[\#EF4444\] text-white px-3 py-2 rounded-lg font-bold flex items-center gap-1 transition-all shrink-0"/, 'className="bg-[#081621] hover:bg-[#EF4444] text-white px-3 h-[42px] rounded-lg font-bold flex items-center gap-1 transition-all shrink-0"');

fs.writeFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', code, 'utf8');
console.log("Fixed UI Heights");
