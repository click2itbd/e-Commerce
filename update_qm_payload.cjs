const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

code = code.replace(
  "validUntil: formData.validUntil\n          };",
  "validUntil: formData.validUntil,\n            preparedBy: formData.preparedBy\n          };"
);

code = code.replace(
  "validUntil: formData.validUntil\n          };\n\n          await updateDoc",
  "validUntil: formData.validUntil,\n            preparedBy: formData.preparedBy\n          };\n\n          await updateDoc"
);

fs.writeFileSync('src/components/QuotationManager.tsx', code);
console.log('Saved preparedBy in payload');
