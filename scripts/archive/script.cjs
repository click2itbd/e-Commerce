
const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/hosting/HostingPlans.tsx', 'utf-8');

// replace the old modal
const startIndex = content.indexOf('{isAddingPackage && (');
const endIndex = content.indexOf('</div>\n      )}\n\n    </div>', startIndex);

if (startIndex !== -1) {
  let end = endIndex !== -1 ? endIndex : content.indexOf('</div>\r\n      )}\r\n\r\n    </div>', startIndex);
  if (end !== -1) {
    const modalReplacement = '<HostingPlanModal isOpen={isAddingPackage} onClose={() => setIsAddingPackage(false)} packageForm={packageForm} setPackageForm={setPackageForm} onSave={handleSavePackage} isEditing={!!editingPackage} features={features} />\n    </div>';
    content = content.substring(0, startIndex) + modalReplacement + content.substring(end + 30);
  } else {
    console.log('Could not find end index');
  }
} else {
  console.log('Could not find start index');
}

content = content.replace(
  'import { DEFAULT_HOSTING_FEATURES, DEFAULT_HOSTING_PACKAGES } from \'./plans/constants\';',
  'import { DEFAULT_HOSTING_FEATURES, DEFAULT_HOSTING_PACKAGES } from \'./plans/constants\';\nimport HostingPlanModal from \'./plans/HostingPlanModal\';'
);

fs.writeFileSync('src/pages/admin/tabs/hosting/HostingPlans.tsx', content, 'utf-8');
console.log('Done!');
