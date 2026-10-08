const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

// Insert Spec Templates definition right before the component
const templatesCode = `const SPEC_TEMPLATES: Record<string, Record<string, string>> = {
  'Laptop': { 'Processor': '', 'RAM': '', 'Storage': '', 'Display': '', 'Graphics': '', 'Battery': '', 'OS': '' },
  'Laptops': { 'Processor': '', 'RAM': '', 'Storage': '', 'Display': '', 'Graphics': '', 'Battery': '', 'OS': '' },
  'Monitor': { 'Panel Type': '', 'Refresh Rate': '', 'Resolution': '', 'Response Time': '', 'Ports': '' },
  'Monitors': { 'Panel Type': '', 'Refresh Rate': '', 'Resolution': '', 'Response Time': '', 'Ports': '' },
  'Desktop': { 'Processor': '', 'Motherboard': '', 'RAM': '', 'Storage': '', 'Graphics': '', 'Power Supply': '', 'Casing': '' },
  'Processor': { 'Cores': '', 'Threads': '', 'Base Clock': '', 'Boost Clock': '', 'Socket': '', 'TDP': '' },
  'Graphics Card': { 'Memory': '', 'Memory Type': '', 'Core Clock': '', 'Boost Clock': '', 'Ports': '' },
  'GPU': { 'Memory': '', 'Memory Type': '', 'Core Clock': '', 'Boost Clock': '', 'Ports': '' },
  'Motherboard': { 'Form Factor': '', 'Socket': '', 'Chipset': '', 'Memory Slots': '', 'Max Memory': '' },
  'RAM': { 'Capacity': '', 'Type': '', 'Speed': '', 'Latency': '', 'Voltage': '' },
  'Storage': { 'Capacity': '', 'Type (SSD/HDD)': '', 'Form Factor': '', 'Interface': '', 'Read Speed': '' }
};

export const Inventory = () => {`;

if (c.includes('export const Inventory = () => {') && !c.includes('SPEC_TEMPLATES')) {
  c = c.replace('export const Inventory = () => {', templatesCode);
}

// Update the category onChange handler
const oldOnChange = `onChange={e => setFormData({ ...formData, category: e.target.value, subCategory: '' })}`;
const newOnChange = `onChange={e => {
                                  const newCat = e.target.value;
                                  let newSpecs = formData.specs || {};
                                  
                                  // Auto-apply template if specs are empty
                                  if (Object.keys(newSpecs).length === 0) {
                                    // Try exact match or substring match (e.g. if category is "Gaming Laptop")
                                    const templateKey = Object.keys(SPEC_TEMPLATES).find(k => newCat.toLowerCase().includes(k.toLowerCase()));
                                    if (templateKey) {
                                      newSpecs = { ...SPEC_TEMPLATES[templateKey] };
                                    }
                                  }
                                  
                                  setFormData({ ...formData, category: newCat, subCategory: '', specs: newSpecs });
                                }}`;

if (c.includes(oldOnChange)) {
  c = c.replace(oldOnChange, newOnChange);
  fs.writeFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', c.replace(/\n/g, nl));
  console.log('Category auto-template updated');
} else {
  console.log('Could not find onChange for category');
}