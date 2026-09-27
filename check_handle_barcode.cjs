const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');
const regex = /onClick=\{[^\}]*handleBarcodeScan/g;
const match = content.match(regex);
console.log(match);