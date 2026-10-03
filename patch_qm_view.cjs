const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

code = code.replace(
    "if ((item as any).warranty) {\n                               warranty = (item as any).warranty;\n                             }",
    "if ((item as any).warranty) {\n                               warranty = (item as any).warranty;\n                               if (/^\\d+$/.test(warranty)) warranty += ' Years';\n                             }"
);

fs.writeFileSync('src/components/QuotationManager.tsx', code);
console.log("Patched QuotationManager.tsx view mode");
