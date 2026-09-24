const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/hosting/HostingPlans.tsx', 'utf-8');

const startIndex = content.indexOf('{activeSubTab === \'pricing\' && (');
const endIndex = content.indexOf('      {/* SUBTAB 3: COMPARISON FEATURES */}');

if (startIndex !== -1 && endIndex !== -1) {
  const pricingReplacement = `{activeSubTab === 'pricing' && (
        <HostingPlanPricing
          customPricing={customPricing}
          setCustomPricing={setCustomPricing}
          handleSaveCustomPricing={handleSaveCustomPricing}
        />
      )}

`;
  content = content.substring(0, startIndex) + pricingReplacement + content.substring(endIndex);
}

content = content.replace(
  "import HostingPlanList from './plans/HostingPlanList';",
  "import HostingPlanList from './plans/HostingPlanList';\nimport HostingPlanPricing from './plans/HostingPlanPricing';"
);

fs.writeFileSync('src/pages/admin/tabs/hosting/HostingPlans.tsx', content, 'utf-8');
console.log('Done!');
