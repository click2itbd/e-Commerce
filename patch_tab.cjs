const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/AdminDashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

const target = `        ) : activeTab === 'hostingOrders' && isAdmin ? (
          <HostingOrdersTab />
        ) : activeTab === 'hostingPlans' && isAdmin ? (`;

const replace = `        ) : activeTab === 'hostingOrders' && isAdmin ? (
          <HostingOrdersTab />
        ) : activeTab === 'hosting_support_tickets' && isAdmin ? (
          <SupportTicketsTab />
        ) : activeTab === 'hostingPlans' && isAdmin ? (`;

content = content.replace(target, replace);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed hosting_support_tickets tab');
