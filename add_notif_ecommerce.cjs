const fs = require('fs');
let content = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceDashboard.tsx', 'utf8');

if (!content.includes('AdminNotifications')) {
    content = content.replace(
        "import { Menu as MenuIcon", 
        "import { AdminNotifications } from '../../components/AdminNotifications';\nimport { Menu as MenuIcon"
    );
    content = content.replace(
        "<div className=\"flex items-center gap-4\">\n              <div className=\"flex items-center gap-2 text-sm",
        "<div className=\"flex items-center gap-4\">\n              <AdminNotifications setActiveTab={setActiveTab} />\n              <div className=\"flex items-center gap-2 text-sm"
    );
    fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceDashboard.tsx', content, 'utf8');
    console.log('Added to EcommerceDashboard');
}