const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');

code = code.replace(/<div className="grid grid-cols-1 md:grid-cols-4 gap-3">/, '<div className="grid grid-cols-1 md:grid-cols-2 gap-4">');

fs.writeFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', code, 'utf8');
console.log("Updated Purchases layout");
