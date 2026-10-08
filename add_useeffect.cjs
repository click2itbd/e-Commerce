const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

const useEffectCode = `
  // Auto-populate specs when opening a product without specs
  React.useEffect(() => {
    if (editingProduct && formData.category && (!formData.specs || Object.keys(formData.specs).length === 0)) {
      const cat = formData.category;
      const templateKey = Object.keys(SPEC_TEMPLATES).find(k => k !== 'Default' && cat.toLowerCase().includes(k.toLowerCase()));
      const newSpecs = templateKey ? { ...SPEC_TEMPLATES[templateKey] } : { ...SPEC_TEMPLATES['Default'] };
      
      // Update form data safely without causing infinite loops
      // We only do this if specs are TRULY empty and we haven't done it yet
      setFormData((prev: any) => ({
        ...prev,
        specs: newSpecs
      }));
    }
  }, [editingProduct, formData.category]); // Dependency on category change or edit mode change
`;

// Find where to insert it. Inside InventoryTab, after `const [viewingProduct, setViewingProduct] = useState<any>(null);`
const insertPoint = `const [viewingProduct, setViewingProduct] = useState<any>(null);`;
if (c.includes(insertPoint) && !c.includes('Auto-populate specs when opening a product without specs')) {
  c = c.replace(insertPoint, insertPoint + '\n' + useEffectCode);
  fs.writeFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', c.replace(/\n/g, nl));
  console.log('Added useEffect for auto-populating existing products');
}