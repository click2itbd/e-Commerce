const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');
const start = content.indexOf('{currentOrders.map(order => {');
const end = content.indexOf('{filteredOrders.length === 0 && (');
console.log(content.slice(start, start + 3000));