const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

const targetStr = '<div className="mt-2">';
const replacementStr = `                         {(formData as any).preparedBy && <div className="text-sm text-gray-500 font-medium">Prepared By: {(formData as any).preparedBy}</div>}
                         <div className="mt-2">`;
                         
code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/components/QuotationManager.tsx', code);
console.log('Added Prepared By to Web View');
