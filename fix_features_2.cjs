const fs = require('fs');
const file = 'src/pages/admin/tabs/hosting/HostingPlans.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /features:\s*\[\s*'50 GB Pure NVMe SSD in RAID 10',[\s\S]*?'Dedicated Account Manager'\s*\]/,
  "features: [\n      '50 GB NVMe SSD',\n      '6 vCPU & 8 GB RAM',\n      'WooCommerce Optimized',\n      'Free SSL Certificate',\n      'Automated Backups',\n      'DDoS Protection',\n      'VIP Support'\n    ]"
);

fs.writeFileSync(file, content, 'utf8');
