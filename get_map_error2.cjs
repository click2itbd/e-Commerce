const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(535, 560).join('\n'));