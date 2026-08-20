const fs = require('fs');

let content = fs.readFileSync('src/pages/hosting/DomainTransferPage.tsx', 'utf8');

if (!content.includes('authCode: authCode,')) {
    content = content.replace("itemType: 'domain_transfer' as const,", "itemType: 'domain_transfer' as const,\n        authCode: authCode,");
    fs.writeFileSync('src/pages/hosting/DomainTransferPage.tsx', content, 'utf8');
    console.log('Patched DomainTransferPage to expose authCode');
}
