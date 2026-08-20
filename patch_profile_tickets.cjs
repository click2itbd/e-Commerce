const fs = require('fs');
let content = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

if (!content.includes('CustomerTicketsTab')) {
    // Import
    content = content.replace("import { MyDomainsTab } from '../components/MyDomainsTab';", "import { MyDomainsTab } from '../components/MyDomainsTab';\nimport { CustomerTicketsTab } from '../components/CustomerTicketsTab';");
    
    // Replace Lucide icon
    if (!content.includes('MessageSquare')) {
        content = content.replace(/import \{ ([^}]+) \} from 'lucide-react';/, "import { $1, MessageSquare } from 'lucide-react';");
    }

    // Add Tab Button
    const targetTab = `{ id: 'my_domains', label: 'My Domains', icon: Globe },`;
    const replaceTab = `{ id: 'my_domains', label: 'My Domains', icon: Globe },\n                { id: 'tickets', label: 'Support Tickets', icon: MessageSquare },`;
    content = content.replace(targetTab, replaceTab);
    
    // Add Tab Content
    const targetContent = `{activeTab === 'my_domains' && (
              <MyDomainsTab currentUser={user} />
            )}`;
    const replaceContent = `{activeTab === 'my_domains' && (
              <MyDomainsTab currentUser={user} />
            )}
            
            {activeTab === 'tickets' && (
              <CustomerTicketsTab currentUser={user} />
            )}`;
    content = content.replace(targetContent, replaceContent);
    
    fs.writeFileSync('src/pages/Profile.tsx', content, 'utf8');
    console.log('Patched Profile.tsx for CustomerTicketsTab');
}
