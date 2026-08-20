const fs = require('fs');

let content = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

if (!content.includes('MyDomainsTab')) {
    // Add import
    content = content.replace("import { CreditCard, Edit2, LogOut, Package, Shield, User, Loader2, Save } from 'lucide-react';", "import { CreditCard, Edit2, LogOut, Package, Shield, User, Loader2, Save, Globe } from 'lucide-react';\nimport { MyDomainsTab } from '../components/MyDomainsTab';");

    // Add to tab list
    content = content.replace("{ id: 'orders', label: 'My Orders', icon: Package },", "{ id: 'orders', label: 'My Orders', icon: Package },\n              { id: 'my_domains', label: 'My Domains', icon: Globe },");

    // Add content view
    const myDomainsContent = `
          {activeTab === 'my_domains' && (
            <MyDomainsTab currentUser={currentUser} />
          )}
`;
    content = content.replace("{activeTab === 'orders' && (", myDomainsContent + "\n          {activeTab === 'orders' && (");

    fs.writeFileSync('src/pages/Profile.tsx', content, 'utf8');
    console.log('Patched Profile.tsx for MyDomains');
} else {
    console.log('Already patched.');
}
