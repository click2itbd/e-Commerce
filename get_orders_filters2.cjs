const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('placeholder="Search by Order ID'));
console.log(lines.slice(start - 5, start + 40).join('\n'));