const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/hosting/HostingPlans.tsx', 'utf-8');

const startIndex = content.indexOf('{activeSubTab === \'packages\' && (');
const endIndex = content.indexOf('      {/* SUBTAB 2: CUSTOM PACKAGE RATES FORM */}');

if (startIndex !== -1 && endIndex !== -1) {
  const listReplacement = `{activeSubTab === 'packages' && (
        <HostingPlanList
          packages={packages}
          filteredPackages={filteredPackages}
          uniqueCategories={uniqueCategories}
          packageCategoryFilter={packageCategoryFilter}
          setPackageCategoryFilter={setPackageCategoryFilter}
          calculatePlanPrice={calculatePlanPrice}
          setEditingPackage={setEditingPackage}
          setPackageForm={setPackageForm}
          setIsAddingPackage={setIsAddingPackage}
          setPackageModalTab={setPackageModalTab}
          handleDeletePackage={handleDeletePackage}
        />
      )}

`;
  content = content.substring(0, startIndex) + listReplacement + content.substring(endIndex);
}

content = content.replace(
  "import HostingPlanModal from './plans/HostingPlanModal';",
  "import HostingPlanModal from './plans/HostingPlanModal';\nimport HostingPlanList from './plans/HostingPlanList';"
);

fs.writeFileSync('src/pages/admin/tabs/hosting/HostingPlans.tsx', content, 'utf-8');
console.log('Done!');
