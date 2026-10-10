const fs = require('fs');
let code = fs.readFileSync('src/pages/hosting/BulkDomainSearch.tsx', 'utf8');
code = code.split('\\`').join('`');
code = code.split('\\$').join('$');
fs.writeFileSync('src/pages/hosting/BulkDomainSearch.tsx', code);
