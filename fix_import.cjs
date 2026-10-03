const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/hr/StaffPerformance.tsx', 'utf8');

code = code.replace(
  'import { formatCurrency } from \'../../../../utils/formatCurrency\';',
  'import { formatCurrency } from \'../../../../lib/utils\';'
);

fs.writeFileSync('src/pages/admin/tabs/hr/StaffPerformance.tsx', code);
console.log('Fixed import');
