const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');
const search = 'const existingProduct = products.find(p => p.sku === scannedCode || p.availableSerials?.includes(scannedCode));';
console.log("Includes search?", content.includes(search));