const fs = require('fs');

let hpFile = 'src/pages/admin/tabs/hosting/HostingPlans.tsx';
let hpContent = fs.readFileSync(hpFile, 'utf8');
hpContent = hpContent.replace(/2 TB BDIX & Global/g, '2 TB Premium Bandwidth');
hpContent = hpContent.replace(/5 TB BDIX & Global/g, '5 TB Premium Bandwidth');
hpContent = hpContent.replace(/10 TB BDIX & Global/g, '10 TB Premium Bandwidth');
fs.writeFileSync(hpFile, hpContent, 'utf8');

let pricingFile = 'src/pages/hosting/PricingPage.tsx';
let pContent = fs.readFileSync(pricingFile, 'utf8');
// Let's replace the BDIX FAQ with a more generic one
pContent = pContent.replace(/What is BDIX Peering\?/g, 'Do you offer free SSL?');
pContent = pContent.replace(/BDIX \(Bangladesh Internet Exchange\) allows visitors from Bangladesh to load your website at blazing fast 1Gbps to 10Gbps local speeds\./g, 'Yes, all our hosting plans come with a free SSL certificate installed automatically.');
fs.writeFileSync(pricingFile, pContent, 'utf8');

