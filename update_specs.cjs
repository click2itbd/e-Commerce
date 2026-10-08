const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

// 1. Remove the "Load Template" button
const btnRegex = /<button[\s\S]*?onClick=\{\(\) => \{[\s\S]*?Load Template[\s\S]*?<\/button>/;
c = c.replace(btnRegex, '');

// 2. Expand SPEC_TEMPLATES
const oldTemplatesRegex = /const SPEC_TEMPLATES: Record<string, Record<string, string>> = \{[\s\S]*?\};\s*const InventoryTab/;

const expandedTemplates = `const SPEC_TEMPLATES: Record<string, Record<string, string>> = {
  // PCs & Laptops
  'Laptop': { 'Processor': '', 'RAM': '', 'Storage': '', 'Display': '', 'Graphics': '', 'Battery': '', 'OS': '' },
  'Laptops': { 'Processor': '', 'RAM': '', 'Storage': '', 'Display': '', 'Graphics': '', 'Battery': '', 'OS': '' },
  'Desktop': { 'Processor': '', 'Motherboard': '', 'RAM': '', 'Storage': '', 'Graphics': '', 'Power Supply': '', 'Casing': '' },
  'PC': { 'Processor': '', 'Motherboard': '', 'RAM': '', 'Storage': '', 'Graphics': '', 'Power Supply': '', 'Casing': '' },
  
  // Core Components
  'Processor': { 'Cores': '', 'Threads': '', 'Base Clock': '', 'Boost Clock': '', 'Socket': '', 'TDP': '' },
  'CPU': { 'Cores': '', 'Threads': '', 'Base Clock': '', 'Boost Clock': '', 'Socket': '', 'TDP': '' },
  'Motherboard': { 'Form Factor': '', 'Socket': '', 'Chipset': '', 'Memory Slots': '', 'Max Memory': '' },
  'RAM': { 'Capacity': '', 'Type (DDR4/DDR5)': '', 'Speed': '', 'Latency': '', 'Voltage': '' },
  'Memory': { 'Capacity': '', 'Type': '', 'Speed': '', 'Latency': '', 'Voltage': '' },
  'Graphics Card': { 'Memory': '', 'Memory Type': '', 'Core Clock': '', 'Boost Clock': '', 'Ports': '' },
  'GPU': { 'Memory': '', 'Memory Type': '', 'Core Clock': '', 'Boost Clock': '', 'Ports': '' },
  'Storage': { 'Capacity': '', 'Type (SSD/HDD)': '', 'Form Factor': '', 'Interface': '', 'Read/Write Speed': '' },
  'SSD': { 'Capacity': '', 'Form Factor': '', 'Interface': '', 'Read/Write Speed': '' },
  'Power Supply': { 'Wattage': '', 'Efficiency Rating': '', 'Modular': '', 'Form Factor': '' },
  'PSU': { 'Wattage': '', 'Efficiency Rating': '', 'Modular': '', 'Form Factor': '' },
  'Casing': { 'Type': '', 'Motherboard Support': '', 'Front Ports': '', 'Fan Support': '', 'Radiator Support': '' },
  'Cooler': { 'Type (Air/Liquid)': '', 'Socket Support': '', 'Fan Speed': '', 'Noise Level': '' },
  
  // Peripherals
  'Monitor': { 'Panel Type': '', 'Refresh Rate': '', 'Resolution': '', 'Response Time': '', 'Ports': '' },
  'Keyboard': { 'Type (Mech/Membrane)': '', 'Switch Type': '', 'Connectivity': '', 'Backlight': '' },
  'Mouse': { 'Sensor': '', 'DPI': '', 'Connectivity': '', 'Buttons': '' },
  'Headphone': { 'Type': '', 'Connectivity': '', 'Frequency Response': '', 'Microphone': '', 'Impedance': '' },
  'Earphone': { 'Type': '', 'Connectivity': '', 'Frequency Response': '', 'Microphone': '' },
  'Speaker': { 'Configuration (2.0/2.1)': '', 'Total RMS': '', 'Connectivity': '', 'Frequency Response': '' },
  'Webcam': { 'Resolution': '', 'Frame Rate': '', 'Field of View': '', 'Microphone': '' },
  'Microphone': { 'Type': '', 'Polar Pattern': '', 'Frequency Response': '', 'Connectivity': '' },
  
  // Networking & Others
  'Router': { 'Antenna': '', 'Wi-Fi Speed': '', 'Bands': '', 'Ports': '', 'Coverage': '' },
  'Network': { 'Standard': '', 'Speed': '', 'Ports': '', 'Features': '' },
  'Printer': { 'Functions': '', 'Print Speed': '', 'Resolution': '', 'Paper Size': '', 'Connectivity': '' },
  'Smart Watch': { 'Display': '', 'Battery Life': '', 'Water Resistance': '', 'Sensors': '', 'Connectivity': '' },
  'UPS': { 'Capacity (VA)': '', 'Load Capacity (W)': '', 'Backup Time': '', 'Battery Type': '' },
  
  // Fallback
  'Accessory': { 'Type': '', 'Material': '', 'Compatibility': '', 'Dimensions': '' },
  'Default': { 'Brand': '', 'Model': '', 'Color': '', 'Weight': '', 'Warranty': '' }
};

const InventoryTab`;

if (c.match(oldTemplatesRegex)) {
  c = c.replace(oldTemplatesRegex, expandedTemplates);
}

// 3. Update onChange to use the fallback Default if no template matched
const oldOnChange = `// Try exact match or substring match (e.g. if category is "Gaming Laptop")
                                    const templateKey = Object.keys(SPEC_TEMPLATES).find(k => newCat.toLowerCase().includes(k.toLowerCase()));
                                    if (templateKey) {
                                      newSpecs = { ...SPEC_TEMPLATES[templateKey] };
                                    }`;

const newOnChange = `// Try exact match or substring match (e.g. if category is "Gaming Laptop")
                                    const templateKey = Object.keys(SPEC_TEMPLATES).find(k => k !== 'Default' && newCat.toLowerCase().includes(k.toLowerCase()));
                                    if (templateKey) {
                                      newSpecs = { ...SPEC_TEMPLATES[templateKey] };
                                    } else if (newCat) {
                                      newSpecs = { ...SPEC_TEMPLATES['Default'] };
                                    }`;
if (c.includes(oldOnChange)) {
  c = c.replace(oldOnChange, newOnChange);
}

fs.writeFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', c.replace(/\n/g, nl));
console.log('Updated templates and removed load button');