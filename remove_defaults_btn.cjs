const fs = require('fs');
let c = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceMarketing.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

// Remove the button
const buttonRegex = /<button onClick=\{handleRestoreDefaults\}.*?Load Defaults\s*<\/button>/s;
c = c.replace(buttonRegex, '');

// Optionally remove the function to clean up, though not strictly necessary
const funcRegex = /const handleRestoreDefaults = async \(\) => \{[\s\S]*?toast\.success\('Default banners restored'\);\s*\}\s*catch[^\}]*?\}\s*\};/s;
c = c.replace(funcRegex, '');

fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceMarketing.tsx', c.replace(/\n/g, nl));
console.log('Load Defaults button removed');