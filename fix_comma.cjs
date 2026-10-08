const fs = require('fs');
let c = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
c = c.replace(/,\s*,\s*Loader2/g, ', Loader2');
fs.writeFileSync('src/pages/AdminDashboard.tsx', c);
console.log('Fixed double comma');