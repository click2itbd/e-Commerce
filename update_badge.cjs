const fs = require('fs');
let c = fs.readFileSync('src/components/ProductCard.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

if (c.includes('>USED<')) {
  c = c.replace('>USED<', '>PRE-OWNED<');
  fs.writeFileSync('src/components/ProductCard.tsx', c.replace(/\n/g, nl));
  console.log('ProductCard badge updated');
} else {
  console.log('Could not find USED badge');
}