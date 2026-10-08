const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

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

const InventoryTab`;

if (c.includes('const InventoryTab: React.FC')) {
  c = c.replace('const InventoryTab', templatesCode);
  fs.writeFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', c.replace(/\n/g, nl));
  console.log('Injected templates');
}