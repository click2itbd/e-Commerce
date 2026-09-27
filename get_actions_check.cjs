const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');
const start = content.indexOf('<div className="flex items-center justify-end gap-2">');
const end = content.indexOf('</div>', start + 100);
console.log(content.slice(start, start + 800));