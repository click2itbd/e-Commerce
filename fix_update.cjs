const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

const oldUpdateItem = `  const updateItem = (idx: number, field: string, value: any) => {
    const newItems = [...formData.items];
    if (field === 'quantity' && value < 1) value = 1;
    if (field === 'discount' && value < 0) value = 0;
    if (field === 'price' && value < 0) value = 0;
    
    (newItems[idx] as any)[field] = value;
    setFormData({ ...formData, items: newItems });
  };`;

// Note: indentation in file is 2 spaces for the function body!
const actualOld = `  const updateItem = (idx: number, field: string, value: any) => {
    const newItems = [...formData.items];
    if (field === 'quantity' && value < 1) value = 1;
    if (field === 'discount' && value < 0) value = 0;
    if (field === 'price' && value < 0) value = 0;
    
    (newItems[idx] as any)[field] = value;
    setFormData({ ...formData, items: newItems });
  };`;

const newUpdateItem = `  const updateItem = (idx: number, field: string, value: any) => {
    const newItems = [...formData.items];
    if (field === 'quantity' && value < 1) value = 1;
    if (field === 'discount' && value < 0) value = 0;
    if (field === 'price' && value < 0) value = 0;
    
    if (field === 'warranty') {
      (newItems[idx] as any).warranty = value;
      delete (newItems[idx] as any).warrantyMonths;
      if (!(newItems[idx] as any).specs) (newItems[idx] as any).specs = {};
      (newItems[idx] as any).specs.Warranty = value;
    } else {
      (newItems[idx] as any)[field] = value;
    }
    
    setFormData({ ...formData, items: newItems });
  };`;

// Try an index-based replacement just in case
const lines = code.split('\n');
const updateIndex = lines.findIndex(line => line.includes("const updateItem = (idx: number, field: string, value: any) => {"));

if (updateIndex !== -1) {
    lines.splice(updateIndex, 8, 
        "  const updateItem = (idx: number, field: string, value: any) => {",
        "    const newItems = [...formData.items];",
        "    if (field === 'quantity' && value < 1) value = 1;",
        "    if (field === 'discount' && value < 0) value = 0;",
        "    if (field === 'price' && value < 0) value = 0;",
        "    ",
        "    if (field === 'warranty') {",
        "      (newItems[idx] as any).warranty = value;",
        "      delete (newItems[idx] as any).warrantyMonths;",
        "      if (!(newItems[idx] as any).specs) (newItems[idx] as any).specs = {};",
        "      (newItems[idx] as any).specs.Warranty = value;",
        "    } else {",
        "      (newItems[idx] as any)[field] = value;",
        "    }",
        "    ",
        "    setFormData({ ...formData, items: newItems });",
        "  };"
    );
    fs.writeFileSync('src/components/QuotationManager.tsx', lines.join('\n'));
    console.log('Fixed updateItem by lines!');
} else {
    console.log('Could not find updateItem');
}
