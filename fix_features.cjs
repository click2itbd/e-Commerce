const fs = require('fs');
const file = 'src/pages/admin/tabs/hosting/HostingPlans.tsx';
let content = fs.readFileSync(file, 'utf8');

// The WP plans have long arrays. We will just use regex to replace the entire features array for these 4 WP plans.
// Or we can just manually replace the arrays with simple strings.

content = content.replace(
  /features:\s*\[\s*'10 GB Pure NVMe SSD',\s*'2 vCPU Cores & 2 GB RAM',\s*'LiteSpeed Enterprise Web Server',\s*'LSCache & Redis Acceleration',\s*'Free Unlimited SSL Certificate',\s*'1-Click WordPress Staging',\s*'Daily Automated JetBackup',\s*'Automated WP Core & Plugin Updates',\s*'Free Website Migration',\s*'24\/7 Priority Support'\s*\]/,
  "features: [\n      '10 GB NVMe SSD',\n      '2 vCPU & 2 GB RAM',\n      'LiteSpeed Web Server',\n      'Free SSL Certificate',\n      'Daily Automated Backups',\n      '1-Click WordPress',\n      '24/7 Support'\n    ]"
);

content = content.replace(
  /features:\s*\[\s*'25 GB Pure NVMe SSD',\s*'4 vCPU Cores & 4 GB RAM',\s*'LiteSpeed Enterprise \+ QUIC\.cloud',\s*'Dedicated Redis Object Cache',\s*'Free SSL & HTTP\/3 Support',\s*'Multi-Site Staging Environment',\s*'Daily Automated JetBackup \(30 Days\)',\s*'Malware Scanner & Auto-Clean',\s*'Free VIP Migration by Experts',\s*'Dedicated DevOps WhatsApp Support'\s*\]/,
  "features: [\n      '25 GB NVMe SSD',\n      '4 vCPU & 4 GB RAM',\n      'LiteSpeed Web Server',\n      'Free SSL Certificate',\n      'Daily Automated Backups',\n      'Malware Scanner',\n      'Priority Support'\n    ]"
);

content = content.replace(
  /features:\s*\[\s*'50 GB Pure NVMe SSD in RAID 10',\s*'6 vCPU Cores & 8 GB RAM',\s*'WooCommerce High-Concurrency Engine',\s*'Dedicated Redis Cache Instance',\s*'Free Wildcard SSL Certificate',\s*'Real-time Cart Abandonment Protection',\s*'Automated Hourly Database Backup',\s*'Enterprise DDoS Mitigation \(Cloudflare\)',\s*'Zero-Downtime Traffic Spike Shield',\s*'Dedicated Account Manager'\s*\]/,
  "features: [\n      '50 GB NVMe SSD',\n      '6 vCPU & 8 GB RAM',\n      'WooCommerce Optimized',\n      'Free SSL Certificate',\n      'Automated Backups',\n      'DDoS Protection',\n      'VIP Support'\n    ]"
);

content = content.replace(
  /features:\s*\[\s*'100 GB Enterprise NVMe SSD',\s*'8 vCPU Cores & 16 GB RAM',\s*'Isolated Containerized Environment',\s*'Custom Redis & Memcached Pools',\s*'Dedicated Public IPv4 Address',\s*'Enterprise SLA 99\.99% Guaranteed',\s*'Real-time Continuous Backups',\s*'Custom PHP Extension Configuration',\s*'24\/7\/365 On-Call Senior Engineer',\s*'White-Glove Architecture Consultation'\s*\]/,
  "features: [\n      '100 GB NVMe SSD',\n      '8 vCPU & 16 GB RAM',\n      'Dedicated IP Address',\n      'Free SSL Certificate',\n      'Real-time Backups',\n      'DDoS Protection',\n      '24/7 Priority Support'\n    ]"
);

fs.writeFileSync(file, content, 'utf8');
