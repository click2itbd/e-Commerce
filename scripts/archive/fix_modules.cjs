const fs = require('fs');
let content = fs.readFileSync('src/pages/hosting-dashboard/tabs/ModuleTabs.tsx', 'utf8');

// Imports
content = content.replace(
  "import SupportTickets from '../../admin/tabs/hosting/SupportTickets';",
  "import SupportTickets from '../../admin/tabs/hosting/SupportTickets';\nimport HostingPlans from '../../admin/tabs/hosting/HostingPlans';\nimport { DomainPricingManager } from '../../../components/admin/hosting/DomainPricingManager';"
);

// Exports from modules
content = content.replace("PlanPackagesModule, ", "");
content = content.replace("DomainPricingModule, ", "");

// JSX
content = content.replace(
  "{activeTab === 'plan-packages' && <PlanPackagesModule />}",
  "{activeTab === 'plan-packages' && <HostingPlans />}"
);
content = content.replace(
  "{activeTab === 'domain-pricing' && <DomainPricingModule />}",
  "{activeTab === 'domain-pricing' && <DomainPricingManager setActiveTab={setActiveTab} />}"
);

fs.writeFileSync('src/pages/hosting-dashboard/tabs/ModuleTabs.tsx', content);
console.log('Fixed ModuleTabs');
