const fs = require('fs');
let code = fs.readFileSync('src/pages/hosting/HostingCheckout.tsx', 'utf8');
code = code.replace(/const orderData = \{\s+userId: user\?\.uid \|\| 'guest',/, "const orderData = {\n        userId: user?.uid || 'guest',\n        platform: 'hosting',");
fs.writeFileSync('src/pages/hosting/HostingCheckout.tsx', code);
