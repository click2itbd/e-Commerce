const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('function handleBarcodeScan'));
// let's grab the actual handleBarcodeScan implementation
const start = content.indexOf('const handleBarcodeScan = async () => {');
const end = content.indexOf('const handleSavePurchase = async');
console.log(content.slice(start, end));