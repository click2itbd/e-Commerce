const fs = require('fs');
let code = fs.readFileSync('src/pages/hosting/HostingCheckout.tsx', 'utf8');

// Fix imports
code = code.replace(/from '\.\.\//g, "from '../../");

// Fix redeclarations
code = code.replace(/const domainItems = items\.filter/g, 'let extDomainItems = items.filter');
code = code.replace(/const hostingItems = items\.filter/g, 'let extHostingItems = items.filter');
code = code.replace(/for \(const domainItem of domainItems\)/g, 'for (const domainItem of extDomainItems)');
code = code.replace(/for \(const hostingItem of hostingItems\)/g, 'for (const hostingItem of extHostingItems)');

// There are duplicate declarations due to the two branches (!user vs user)
code = code.replace(/let extDomainItems = items\.filter.*?;/g, '');
code = code.replace(/let extHostingItems = items\.filter.*?;/g, '');
code = code.replace(/const newOrderRef/g, 'let extDomainItems = items.filter(i => i.itemType === \\\'domain\\\' || i.itemType === \\\'domain_transfer\\\');\n      let extHostingItems = items.filter(i => i.itemType === \\\'hosting\\\');\n      const newOrderRef');

fs.writeFileSync('src/pages/hosting/HostingCheckout.tsx', code);
console.log('Fixed imports and duplicate variables in HostingCheckout.tsx');
