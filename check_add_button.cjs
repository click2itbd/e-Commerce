const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');
const idx = content.indexOf('const handleBarcodeScan =');
console.log(content.slice(idx - 400, idx));