const fs = require('fs');

let wpFile = 'src/pages/hosting-sections/WordPressCloudSection.jsx';
let wpContent = fs.readFileSync(wpFile, 'utf8');
wpContent = wpContent.replace(/Unlimited BDIX Traffic/g, 'Unlimited Bandwidth');
wpContent = wpContent.replace(/Unmetered 1Gbps BDIX/g, 'Unmetered 1Gbps Port');
wpContent = wpContent.replace(/Unmetered BDIX Traffic/g, 'Unmetered Bandwidth');
wpContent = wpContent.replace(/Optimized BDIX Turbo/g, 'Optimized Turbo');
fs.writeFileSync(wpFile, wpContent, 'utf8');

let vpsFile = 'src/pages/hosting-sections/CloudVpsSection.jsx';
if(fs.existsSync(vpsFile)) {
  let vpsContent = fs.readFileSync(vpsFile, 'utf8');
  vpsContent = vpsContent.replace(/BDIX & Global/g, 'Premium Bandwidth');
  vpsContent = vpsContent.replace(/BDIX 1Gbps Peering Included/g, '1Gbps Network Port');
  vpsContent = vpsContent.replace(/BDIX 10Gbps Peering Included/g, '10Gbps Network Port');
  vpsContent = vpsContent.replace(/5 TB BDIX/g, '5 TB Premium Bandwidth');
  vpsContent = vpsContent.replace(/BDIX local network peering, /g, '');
  fs.writeFileSync(vpsFile, vpsContent, 'utf8');
}

let hostFile = 'src/pages/Hosting.jsx';
if(fs.existsSync(hostFile)) {
  let hContent = fs.readFileSync(hostFile, 'utf8');
  hContent = hContent.replace(/with BDIX connectivity./g, 'with premium connectivity.');
  hContent = hContent.replace(/5. BDIX Turbo/g, '5. Turbo');
  fs.writeFileSync(hostFile, hContent, 'utf8');
}

