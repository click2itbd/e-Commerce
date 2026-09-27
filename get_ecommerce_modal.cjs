const fs = require('fs');
const content = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceOrders.tsx', 'utf8');
const start = content.indexOf('{viewingOrder && (');
const end = content.indexOf('</div>', content.indexOf('</div>', start) + 1000);
// Wait, that might be too naive. Let's just grab the last 150 lines.
const lines = content.split('\n');
console.log(lines.slice(lines.length - 150).join('\n'));