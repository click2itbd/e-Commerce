const fs = require('fs');
let lines = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8').split('\n');

lines.splice(185, 0, "        brand: customItemForm.brand || '',");
lines.splice(186, 0, "        warranty: customItemForm.warranty || '',");

fs.writeFileSync('src/components/QuotationManager.tsx', lines.join('\n'));
console.log('Spliced brand and warranty in');
