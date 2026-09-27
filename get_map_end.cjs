const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');
const mapStart = content.indexOf('{currentOrders.map(order => {');
const mapEnd = content.indexOf('{processedOrders.length === 0 && (');
console.log(content.slice(mapEnd - 300, mapEnd));