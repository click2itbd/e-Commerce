const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('<Globe size={13} />'));
console.log(lines.slice(start, start + 50).join('\n'));