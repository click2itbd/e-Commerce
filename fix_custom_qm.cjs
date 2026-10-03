const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

// 1. Fix customItemForm initial state
code = code.replace(
  "discount: 0\n    });",
  "discount: 0,\n      brand: '',\n      warranty: ''\n    });"
);

// 2. Fix addCustomItem to include brand and warranty
code = code.replace(
  "discount: Number(customItemForm.discount),\n        isCustomService: true,",
  "discount: Number(customItemForm.discount),\n        brand: customItemForm.brand || '',\n        warranty: customItemForm.warranty || '',\n        isCustomService: true,"
);

// 3. Fix setCustomItemForm reset
code = code.replace(
  "setCustomItemForm({ name: '', description: '', quantity: 1, price: 0, discount: 0 });",
  "setCustomItemForm({ name: '', description: '', quantity: 1, price: 0, discount: 0, brand: '', warranty: '' });"
);

// 4. Update the View layout in QuotationManager.tsx to check item.warranty too
const oldWarrantyView = `<td className="py-2 px-2 text-center">{(item as any).warrantyMonths ? ((item as any).warrantyMonths > 12 ? \`\${(item as any).warrantyMonths / 12} Yrs\` : \`\${(item as any).warrantyMonths} Mos\`) : ((item as any).specs?.Warranty || '-')}</td>`;
const newWarrantyView = `<td className="py-2 px-2 text-center">{(item as any).warrantyMonths ? ((item as any).warrantyMonths > 12 ? \`\${(item as any).warrantyMonths / 12} Yrs\` : \`\${(item as any).warrantyMonths} Mos\`) : ((item as any).warranty || (item as any).specs?.Warranty || '-')}</td>`;
code = code.replace(oldWarrantyView, newWarrantyView);

fs.writeFileSync('src/components/QuotationManager.tsx', code);
console.log('Fixed custom item brand and warranty in QuotationManager');
