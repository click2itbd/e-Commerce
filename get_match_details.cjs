const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('const matchByDetails = products.find'));
console.log(lines.slice(idx - 5, idx + 30).join('\n'));