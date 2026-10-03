const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

// Use regex to catch any spacing
code = code.replace(/description:\s*customItemForm\.description,/g, "description: customItemForm.description,\n        brand: (customItemForm as any).brand || '',\n        warranty: (customItemForm as any).warranty || '',");

fs.writeFileSync('src/components/QuotationManager.tsx', code);
console.log("Injected brand and warranty via regex");
