const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('const orderData = {'));
console.log(lines.slice(start, start + 35).join('\n'));