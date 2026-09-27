const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');

content = content.replace(
    /Supplier: \{viewingPurchase\.vendorName\} \| Date: \{new Date\(viewingPurchase\.date \|\| viewingPurchase\.createdAt\)\.toLocaleDateString\(\)\}/g,
    "Supplier: {viewingPurchase.vendorName} | Date: {new Date(viewingPurchase.date || viewingPurchase.createdAt).toLocaleDateString()} | By: {viewingPurchase.createdBy || 'Admin'}"
);
fs.writeFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', content, 'utf8');
console.log('Patched Purchases view');