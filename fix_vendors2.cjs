const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/purchase/Vendors.tsx', 'utf8');

content = content.replace(/type="email"\r?\n\s+required/, 'type="email"');
fs.writeFileSync('src/pages/admin/tabs/purchase/Vendors.tsx', content, 'utf8');
console.log("Fixed Vendors.tsx");
