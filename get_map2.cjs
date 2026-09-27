const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');
const start = content.indexOf('{currentOrders.map(order => {');
const end = content.indexOf('{filteredOrders.length === 0 && (');
const mapContent = content.slice(start, end);
console.log(mapContent.slice(mapContent.lastIndexOf('<td className="px-6 py-4 text-right">')));