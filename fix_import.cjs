const fs = require('fs');
let c = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceMarketing.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

if (!c.includes(' Info, ')) {
  c = c.replace('import { Tag, Globe,', 'import { Tag, Globe, Info,');
  fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceMarketing.tsx', c.replace(/\n/g, nl));
  console.log('Added Info import');
}