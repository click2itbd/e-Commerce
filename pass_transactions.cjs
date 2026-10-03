const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

code = code.replace(/<SalesForm\n\s*products=\{products\}\n\s*customers=\{customers\}/, "<SalesForm\n                    products={products}\n                    customers={customers}\n                    transactions={transactions}");
fs.writeFileSync('src/pages/AdminDashboard.tsx', code, 'utf8');
console.log("Updated AdminDashboard");
