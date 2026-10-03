const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

const targetStr = "        description: customItemForm.description,";
const replacementStr = "        description: customItemForm.description,\n        brand: (customItemForm as any).brand || '',\n        warranty: (customItemForm as any).warranty || '',";

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync('src/components/QuotationManager.tsx', code);
    console.log("Injected brand and warranty into addCustomItem");
} else {
    console.log("Could not find description line");
}
