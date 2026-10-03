const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

code = code.replace(/"customers",/, '"customers",\n    "customer_due_list",');
code = code.replace(/"vendors",/, '"vendors",\n    "vendor_due_list",');

fs.writeFileSync('src/pages/AdminDashboard.tsx', code, 'utf8');
console.log('Added due lists to OFFLINE_SHOP_TABS');
