const fs = require('fs');
let hcFile = 'src/pages/hosting/HostingCart.tsx';
let hcContent = fs.readFileSync(hcFile, 'utf8');
hcContent = hcContent.replace('export default HostingCart;', '');
fs.writeFileSync(hcFile, hcContent, 'utf8');
