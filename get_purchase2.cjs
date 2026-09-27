const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('const handleSavePurchase'));
console.log(lines.slice(start + 120, start + 200).join('\n'));