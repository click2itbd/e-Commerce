const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');
const lines = content.split('\n');
const startIndex = lines.findIndex(l => l.includes('interface PurchaseItem'));
console.log(lines.slice(startIndex, startIndex + 30).join('\n'));