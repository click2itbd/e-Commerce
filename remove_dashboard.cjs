const fs = require('fs');
let c = fs.readFileSync('src/pages/Profile.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';

// Remove the dashboard tab from baseTabs
c = c.replace(/\{ id: 'dashboard', label: 'Dashboard', icon: Globe \},?\s*/, '');

fs.writeFileSync('src/pages/Profile.tsx', c);
console.log('Removed Dashboard tab from Profile.tsx');