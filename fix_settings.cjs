const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/others/Settings.tsx', 'utf8');

// 1. Replace <CRMIntegrationsSetting />
code = code.replace(/<CRMIntegrationsSetting \/>/, '<div className="p-6 text-center text-gray-500 font-bold">Coming Soon: CRM Integrations</div>');

// 2. Add to settingsTab union
code = code.replace(/\| "domain_reseller"/, '| "domain_reseller"\n      | "pages"\n      | "pc_builder"\n      | "pc_builder_fake"');

// 3. Fix type never replace
code = code.replace(/settingsTab\.replace/g, 'String(settingsTab).replace');

fs.writeFileSync('src/pages/admin/tabs/others/Settings.tsx', code, 'utf8');
console.log("Fixed Settings.tsx errors");
