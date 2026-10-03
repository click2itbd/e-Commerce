const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');

// Add Header
code = code.replace(/<th className="px-6 py-4">Status<\/th>/, '<th className="px-6 py-4">Status</th>\n                      <th className="px-6 py-4">Prepared By</th>');

// Add Cell
const cellPattern = /<td className="px-6 py-4">\s*<div className="flex items-center gap-2">.*?<\/div>\s*<\/td>\s*<td className="px-6 py-4 text-right">/s;

if (code.match(cellPattern)) {
    code = code.replace(cellPattern, (match) => {
        return match.replace(/<td className="px-6 py-4 text-right">/, '<td className="px-6 py-4 text-xs font-bold text-gray-500 whitespace-nowrap">{order.createdBy || "Admin"}</td>\n                          <td className="px-6 py-4 text-right">');
    });
    fs.writeFileSync('src/pages/admin/tabs/sales/Orders.tsx', code, 'utf8');
    console.log("Updated Orders.tsx columns");
} else {
    console.log("Could not find cell pattern");
}
