const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');
const search = 'const existingProduct = products.find(p => p.sku === scannedCode || p.availableSerials?.includes(scannedCode));';
const searchTable = '<div className="font-bold text-gray-900">{item.name}</div>';
console.log("Found existingProduct search:", content.includes(search));
console.log("Found table name:", content.includes(searchTable));