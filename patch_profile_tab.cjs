const fs = require('fs');

let content = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

const targetRegex = /\{ id: 'orders', label: 'My Orders', icon: ShoppingBag \},/;

if (content.match(targetRegex) && !content.includes("{ id: 'my_domains'")) {
    content = content.replace(targetRegex, `{ id: 'orders', label: 'My Orders', icon: ShoppingBag },\n                { id: 'my_domains', label: 'My Domains', icon: Globe },`);
    
    // Also make sure Globe is imported
    if (!content.includes('Globe')) {
        content = content.replace(/import \{ ([^}]+) \} from 'lucide-react';/, "import { $1, Globe } from 'lucide-react';");
    }
    
    fs.writeFileSync('src/pages/Profile.tsx', content, 'utf8');
    console.log('Added My Domains tab button successfully');
} else {
    console.log('Already added or target not found');
}
