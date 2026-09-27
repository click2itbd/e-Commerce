const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');
const start = content.indexOf('<tbody className="divide-y divide-gray-100">');
const end = content.indexOf('</tbody>', start);
console.log(content.slice(start, start + 1000));