const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

const oldStr = `        price: Number(customItemForm.price),
        quantity: Number(customItemForm.quantity),
        discount: Number(customItemForm.discount),
        isCustomService: true,
        category: 'Custom'`;

const newStr = `        price: Number(customItemForm.price),
        quantity: Number(customItemForm.quantity),
        discount: Number(customItemForm.discount),
        brand: customItemForm.brand || '',
        warranty: customItemForm.warranty || '',
        isCustomService: true,
        category: 'Custom'`;

code = code.replace(oldStr, newStr);

fs.writeFileSync('src/components/QuotationManager.tsx', code);
console.log('Fixed addCustomItem fields');
