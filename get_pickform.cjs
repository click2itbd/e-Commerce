const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('const [pickForm'));
console.log(lines.slice(idx, idx + 20).join('\n'));