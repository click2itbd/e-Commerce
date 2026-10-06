const fs = require('fs');
let c = fs.readFileSync('src/components/navbars/EcommerceNavbar.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

if (c.includes('>Used Items<')) {
  c = c.replace('>Used Items<', '>Pre-Owned<');
  fs.writeFileSync('src/components/navbars/EcommerceNavbar.tsx', c.replace(/\n/g, nl));
  console.log('Navbar text updated');
} else {
  console.log('Could not find Used Items text');
}