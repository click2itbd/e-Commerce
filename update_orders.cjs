const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');

if (!code.includes('<th className="px-6 py-4">Prepared By</th>')) {
    // Add Header
    code = code.replace(/<th className="px-6 py-4">Status<\/th>/, '<th className="px-6 py-4">Status</th>\n                      <th className="px-6 py-4">Prepared By</th>');

    // Add Cell
    code = code.replace(/<\/select>\s*<\/td>\s*<td className="px-6 py-4 text-right">/g, '</select>\n                          </td>\n                          <td className="px-6 py-4 text-xs font-bold text-gray-500 whitespace-nowrap">{order.createdBy || "Admin"}</td>\n                          <td className="px-6 py-4 text-right">');

    fs.writeFileSync('src/pages/admin/tabs/sales/Orders.tsx', code, 'utf8');
    console.log("Updated Orders.tsx columns");
}
