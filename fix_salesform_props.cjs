const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', 'utf8');

code = code.replace(/setActiveTab,\n\s*\}\)\s*=>\s*\{/, "setActiveTab,\n    transactions = [],\n  }) => {");
fs.writeFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', code, 'utf8');
console.log("Updated SalesForm props");
