const fs = require('fs');
let c = fs.readFileSync('src/components/ProductCard.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

c = c.replace(/USED\n/g, 'PRE-OWNED\n');
fs.writeFileSync('src/components/ProductCard.tsx', c.replace(/\n/g, nl));
console.log('ProductCard badge updated');