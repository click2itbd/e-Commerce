const fs = require('fs');
let content = fs.readFileSync('src/pages/hosting-dashboard/components/TopNavbar.tsx', 'utf8');

// Replace the entire bell dropdown section with AdminNotifications
content = content.replace(
    "import { Menu, ChevronDown, Bell, User, LogOut, Settings2, Server, Ticket, RefreshCw, Globe, CheckCheck } from 'lucide-react';",
    "import { Menu, ChevronDown, User, LogOut, Settings2, Server, Ticket, RefreshCw, Globe, CheckCheck } from 'lucide-react';\nimport { AdminNotifications } from '../../../../components/AdminNotifications';"
);

// In TopNavbar: 
// We need to inject <AdminNotifications setActiveTab={setActiveTab} /> 
// instead of the manual bell button.

const manualBellRegex = /<div className="relative" ref={bellRef}>[\s\S]*?<\/div>\s*<!-- End Bell -->/;

// wait, the bell button in TopNavbar: