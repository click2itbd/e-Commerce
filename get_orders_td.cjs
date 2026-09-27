const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('<div className="flex flex-col gap-1">'));
console.log(lines.slice(start - 10, start + 30).join('\n'));