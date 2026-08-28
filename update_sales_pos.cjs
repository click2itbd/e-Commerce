const fs = require('fs');
let pos = fs.readFileSync('src/pages/admin/POS/index.tsx', 'utf8');

pos = pos.replace(/warrantyYears\?: number/g, 'warrantyMonths?: number');
pos = pos.replace(/warrantyYears: c\.warrantyYears \|\| 0/g, 'warrantyMonths: c.warrantyMonths || (c.product.warrantyMonths || 0)');
pos = pos.replace(/const wMonths = item\.hasWarranty \? \(item\.warrantyYears \|\| 0\) \* 12 : \(item\.product\.warrantyMonths \|\| 0\);/g, 'const wMonths = item.hasWarranty ? (item.warrantyMonths || item.product.warrantyMonths || 0) : (item.product.warrantyMonths || 0);');
pos = pos.replace(/Warranty: \$\{item\.warrantyYears\} Years/g, 'Warranty: ${item.warrantyMonths || item.product.warrantyMonths || 0} Months');

fs.writeFileSync('src/pages/admin/POS/index.tsx', pos, 'utf8');

let sales = fs.readFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', 'utf8');
sales = sales.replace(/warrantyYears: 0/g, 'warrantyMonths: 0');
sales = sales.replace(/warrantyYears: Number\(item\.warrantyYears\) \|\| 0/g, ''); // just remove it
sales = sales.replace(/const wMonths = item\.hasWarranty \? \(item\.warrantyYears \|\| 0\) \* 12 : \(currentProduct\?\.warrantyMonths \|\| 0\);/g, 'const wMonths = item.hasWarranty ? (item.warrantyMonths || currentProduct?.warrantyMonths || 0) : (currentProduct?.warrantyMonths || 0);');
sales = sales.replace(/const wMonths = item\.hasWarranty \? \(item\.warrantyYears \|\| 0\) \* 12 : \(currentProduct\.warrantyMonths \|\| 0\);/g, 'const wMonths = item.hasWarranty ? (item.warrantyMonths || currentProduct.warrantyMonths || 0) : (currentProduct.warrantyMonths || 0);');

fs.writeFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', sales, 'utf8');
console.log("Updated POS and Sales to use Months");
