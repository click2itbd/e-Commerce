const fs = require('fs');
let c = fs.readFileSync('src/components/navbars/HostingNavbar.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/to="\/dashboard"/g, 'to="/profile"');
fs.writeFileSync('src/components/navbars/HostingNavbar.tsx', c);
console.log('Updated HostingNavbar.tsx');