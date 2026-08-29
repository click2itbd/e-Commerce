const fs = require('fs');

let file1 = 'src/pages/hosting-sections/WordPressCloudSection.jsx';
let content1 = fs.readFileSync(file1, 'utf8');

// Replace "BDIX Powered CloudLinux Hosting" with "Premium CloudLinux Hosting"
content1 = content1.replace('BDIX Powered CloudLinux Hosting', 'Premium CloudLinux Hosting');

// Replace "Affordable, fast, and secure shared hosting with NVMe SSDs and BDIX support for optimal speed."
content1 = content1.replace(
  'Affordable, fast, and secure shared hosting with NVMe SSDs and BDIX support for optimal speed.',
  'Affordable, fast, and secure shared hosting with NVMe SSDs for optimal speed and reliability.'
);

fs.writeFileSync(file1, content1, 'utf8');

// Check HostingPlans.tsx for BDIX mentions in the features
let file2 = 'src/pages/admin/tabs/hosting/HostingPlans.tsx';
let content2 = fs.readFileSync(file2, 'utf8');

// Replace occurrences of "BDIX" with "Global" or remove it if it's bandwidth related
content2 = content2.replace(/BDIX 1Gbps Peering Included/g, '1Gbps Network Port');
content2 = content2.replace(/BDIX 10Gbps Peering Included/g, '10Gbps Network Port');
content2 = content2.replace(/100 GB BDIX/g, '100 GB Premium Bandwidth');
content2 = content2.replace(/Unlimited BDIX/g, 'Unlimited Bandwidth');

fs.writeFileSync(file2, content2, 'utf8');
