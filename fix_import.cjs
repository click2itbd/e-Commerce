const fs = require('fs');
let content = fs.readFileSync('src/pages/hosting-dashboard/components/TopNavbar.tsx', 'utf8');

content = content.replace(
    "import { AdminNotifications } from '../../../../components/AdminNotifications';",
    "import { AdminNotifications } from '../../../components/AdminNotifications';"
);
fs.writeFileSync('src/pages/hosting-dashboard/components/TopNavbar.tsx', content, 'utf8');