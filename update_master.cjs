const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

const oldDefault = `'Default': { 'Brand': '', 'Model': '', 'Color': '', 'Weight': '', 'Warranty': '' }`;

const newDefault = `'Default': { 
    'Brand': '', 
    'Model': '', 
    'Type': '',
    'Color': '', 
    'Material': '',
    'Weight': '', 
    'Dimensions': '', 
    'Resolution': '',
    'Display / Lens': '',
    'Processor / Chipset': '',
    'Memory / RAM': '',
    'Storage': '',
    'Connectivity': '',
    'Ports & Interfaces': '',
    'Power / Voltage': '',
    'Battery Life': '',
    'Charging Time': '',
    'Sensor': '',
    'Night Vision': '',
    'Water/Dust Resistance': '',
    'Compatibility': '',
    'Special Features': '',
    'Included in Box': '',
    'Warranty': ''
  }`;

if (c.includes(oldDefault)) {
  c = c.replace(oldDefault, newDefault);
  fs.writeFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', c.replace(/\n/g, nl));
  console.log('Master Default template injected successfully');
} else {
  console.log('Could not find old Default template');
}