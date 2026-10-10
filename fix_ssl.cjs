const fs = require('fs');

let sslCode = fs.readFileSync('src/pages/hosting/SslPage.tsx', 'utf8');
sslCode = sslCode.split('\\`').join('`');
sslCode = sslCode.split('\\$').join('$');
fs.writeFileSync('src/pages/hosting/SslPage.tsx', sslCode);

let svcCode = fs.readFileSync('src/components/MyServicesTab.tsx', 'utf8');
if (!svcCode.includes('ShieldCheck')) {
  svcCode = svcCode.replace(
    /import \{([^}]+)\} from 'lucide-react';/,
    "import { $1, ShieldCheck } from 'lucide-react';"
  );
  fs.writeFileSync('src/components/MyServicesTab.tsx', svcCode);
}
