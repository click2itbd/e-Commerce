const fs = require('fs');
let c = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceMarketing.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

if (c.includes('<option value="sidebar_ad">Sidebar Ad</option>')) {
  c = c.replace('<option value="sidebar_ad">Sidebar Ad</option>', '<option value="sidebar_ad">Sidebar Ad</option>\n                      <option value="pc_builder">PC Builder Banner</option>');
  fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceMarketing.tsx', c.replace(/\n/g, nl));
  console.log('Added PC Builder to dropdown');
} else {
  console.log('Could not find dropdown options');
}