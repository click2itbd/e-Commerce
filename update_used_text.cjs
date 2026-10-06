const fs = require('fs');
let c = fs.readFileSync('src/pages/shop/UsedItems.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

c = c.replace(/Used & Pre-Owned Items/g, 'Pre-Owned Items');
c = c.replace(/No Used Items Found/g, 'No Pre-Owned Items Found');
c = c.replace(/used electronics/g, 'pre-owned electronics');

fs.writeFileSync('src/pages/shop/UsedItems.tsx', c.replace(/\n/g, nl));
console.log('UsedItems.tsx text updated');