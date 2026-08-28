const fs = require('fs');
let sales = fs.readFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', 'utf8');

sales = sales.replace(/warrantyMonths: 0,\s*warrantyMonths: 0,/g, "warrantyMonths: 0,");

fs.writeFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', sales, 'utf8');
console.log("Fixed SalesForm duplicate warrantyMonths");
