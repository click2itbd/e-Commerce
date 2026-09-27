const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');
const start = content.indexOf('const handleSavePurchase = async');
console.log(content.slice(start, start + 1200));