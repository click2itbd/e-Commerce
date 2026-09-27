const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');

content = content.replace(
    "Supplier: {viewingPurchase.vendorName} | Date: {new Date(viewingPurchase.date || \nviewingPurchase.createdAt).toLocaleDateString()}",
    "Supplier: {viewingPurchase.vendorName} | Date: {new Date(viewingPurchase.date || viewingPurchase.createdAt).toLocaleDateString()} | Handled By: {viewingPurchase.createdBy || 'Admin'}"
);

// Ah wait, powershell output truncated the line break.