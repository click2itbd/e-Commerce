const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

// 1. Fix useState
code = code.replace(
    "const [customItemForm, setCustomItemForm] = useState({\n    name: '',\n    description: '',\n    quantity: 1,\n    price: 0,\n    discount: 0\n  });",
    "const [customItemForm, setCustomItemForm] = useState({\n    name: '',\n    description: '',\n    quantity: 1,\n    price: 0,\n    discount: 0,\n    brand: '',\n    warranty: ''\n  });"
);

// 2. Fix addCustomItem newItem mapping
const targetMap = `      const newItem: any = {
        id: \`custom-\${Date.now()}\`,
        productId: \`custom-\${Date.now()}\`,
        name: customItemForm.name,
        description: customItemForm.description,
        price: Number(customItemForm.price),
        quantity: Number(customItemForm.quantity),
        discount: Number(customItemForm.discount),
        isCustomService: true,
        category: 'Custom'
      };`;

const newMap = `      const newItem: any = {
        id: \`custom-\${Date.now()}\`,
        productId: \`custom-\${Date.now()}\`,
        name: customItemForm.name,
        description: customItemForm.description,
        brand: (customItemForm as any).brand || '',
        warranty: (customItemForm as any).warranty || '',
        price: Number(customItemForm.price),
        quantity: Number(customItemForm.quantity),
        discount: Number(customItemForm.discount),
        isCustomService: true,
        category: 'Custom'
      };`;

if (code.includes(targetMap)) {
    code = code.replace(targetMap, newMap);
} else {
    console.log("Could not find targetMap in addCustomItem");
}

// 3. Fix clear form
code = code.replace(
    "setCustomItemForm({ name: '', description: '', quantity: 1, price: 0, discount: 0 });",
    "setCustomItemForm({ name: '', description: '', quantity: 1, price: 0, discount: 0, brand: '', warranty: '' } as any);"
);

fs.writeFileSync('src/components/QuotationManager.tsx', code);
console.log("Fixed custom item brand and warranty mapping");
