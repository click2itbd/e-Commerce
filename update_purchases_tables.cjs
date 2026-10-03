const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');

// colSpans
code = code.replace(/colSpan=\{9\}/g, "colSpan={10}");

// Header
code = code.replace(/<th className="px-6 py-3\.5 text-center">Status<\/th>/, '<th className="px-6 py-3.5 text-center">Status</th>\n                  <th className="px-6 py-3.5 text-center">Prepared By</th>');

// Cell
const cellPattern = /<span className=\{cn\(\s*"px-2 py-0\.5 rounded-full text-\[10px\] font-bold uppercase",\s*pur\.paymentStatus === 'paid' \? "bg-green-100 text-green-700" :\s*pur\.paymentStatus === 'partial' \? "bg-amber-100 text-amber-700" :\s*"bg-red-100 text-red-700"\s*\)\}>\s*\{pur\.paymentStatus\}\s*<\/span>\s*<\/td>/s;

code = code.replace(cellPattern, (match) => {
    return match + '\n                        <td className="px-6 py-3.5 text-center text-[11px] font-bold text-gray-500 whitespace-nowrap">{pur.createdBy || "Admin"}</td>';
});

// PDF Header
code = code.replace(/head: \[\['Purchase #', 'Date', 'Supplier', 'Items', 'Total Bill', 'Paid', 'Due', 'Status'\]\],/, "head: [['Purchase #', 'Date', 'Supplier', 'Items', 'Total Bill', 'Paid', 'Due', 'Status', 'Prepared By']],");

// PDF body
const pdfBodyPattern = /p\.paymentStatus\.toUpperCase\(\),\s*\]\);/s;
code = code.replace(pdfBodyPattern, "p.paymentStatus.toUpperCase(),\n        p.createdBy || 'Admin',\n      ]);");

fs.writeFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', code, 'utf8');
console.log("Updated Purchases tables");
