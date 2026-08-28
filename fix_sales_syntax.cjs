const fs = require('fs');
let sales = fs.readFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', 'utf8');

sales = sales.replace(/hasWarranty: Boolean\(item\.hasWarranty\),\s*,\s*warrantyMonths: wMonths,/g, "hasWarranty: Boolean(item.hasWarranty),\n            warrantyMonths: wMonths,");

fs.writeFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', sales, 'utf8');
console.log("Fixed SalesForm syntax");
