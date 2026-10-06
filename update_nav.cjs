const fs = require('fs');
let c = fs.readFileSync('src/components/navbars/EcommerceNavbar.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

if (!c.includes('/used-items')) {
  c = c.replace('<Link to="/track-order"', '<Link to="/used-items" className="hover:text-[#F97316] transition-colors font-bold text-green-400">Used Items</Link>\n              <Link to="/track-order"');
  fs.writeFileSync('src/components/navbars/EcommerceNavbar.tsx', c.replace(/\n/g, nl));
  console.log('Navbar updated');
} else {
  console.log('Already in Navbar');
}