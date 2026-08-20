const fs = require('fs');

let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

if (!content.includes('ApiLogsTab')) {
    // Add import
    content = content.replace("import { AdminOverviewDashboard } from '../components/AdminOverviewDashboard';", "import { AdminOverviewDashboard } from '../components/AdminOverviewDashboard';\nimport { ApiLogsTab } from '../components/ApiLogsTab';");

    // We can just add it to the general Settings or Marketing or Hosting menu.
    // The sidebar menus are inside AdminDashboard. Let's add it under "Services" or "Settings".
    // I will just add the content view first.
    const apiLogsContent = `
          {activeTab === 'api_logs' && (
            <ApiLogsTab />
          )}
`;
    if (content.includes("{activeTab === 'hostingServices'")) {
        content = content.replace("{activeTab === 'hostingServices'", apiLogsContent + "\n          {activeTab === 'hostingServices'");
    } else {
        content = content.replace("{activeTab === 'services'", apiLogsContent + "\n          {activeTab === 'services'");
    }

    // Now add the menu item. We can add it into the Sidebar.
    // Search for DomainOffers or Settings in the navigation items.
    const menuInject = `{ id: 'api_logs', label: 'API Logs', icon: Terminal },`;
    
    // There are multiple `subItems`. Let's just find the one that has Domain Reseller or Hosting.
    const matchSettings = content.indexOf(`id: 'domain_offers'`);
    if (matchSettings !== -1) {
        content = content.substring(0, matchSettings) + menuInject + '\n                    ' + content.substring(matchSettings);
    }
    
    // Also need Terminal from lucide-react
    if (!content.includes('Terminal')) {
        content = content.replace(/import \{ ([^}]+) \} from 'lucide-react';/, "import { $1, Terminal } from 'lucide-react';");
    }

    fs.writeFileSync('src/pages/AdminDashboard.tsx', content, 'utf8');
    console.log('Patched AdminDashboard.tsx for ApiLogsTab');
} else {
    console.log('Already patched.');
}
