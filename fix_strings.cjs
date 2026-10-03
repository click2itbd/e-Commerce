const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/services/Services.tsx', 'utf8');

code = code.replace(/value=\{serviceFormData\.supplierName \|\| '\}/g, "value={serviceFormData.supplierName || ''}");
code = code.replace(/value=\{serviceFormData\.supplierRmaDate \|\| '\}/g, "value={serviceFormData.supplierRmaDate || ''}");
code = code.replace(/value=\{serviceFormData\.supplierReturnDate \|\| '\}/g, "value={serviceFormData.supplierReturnDate || ''}");

fs.writeFileSync('src/pages/admin/tabs/services/Services.tsx', code);
console.log('Fixed unterminated string literals');
