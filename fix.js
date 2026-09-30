const fs = require('fs');
const path = 'src/pages/hosting-sections/CloudLinuxLicenseSection.jsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/৳/g, '?');
content = content.replace(/\?/g, '?'); // If it already mangled to ?
fs.writeFileSync(path, content, 'utf8');
