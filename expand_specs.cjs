const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

const oldTemplatesRegex = /const SPEC_TEMPLATES: Record<string, Record<string, string>> = \{[\s\S]*?\};\s*const InventoryTab/;

const expandedTemplates = `const SPEC_TEMPLATES: Record<string, Record<string, string>> = {
  // PCs & Laptops
  'Laptop': { 'Processor': '', 'RAM': '', 'Storage': '', 'Display': '', 'Graphics': '', 'Battery': '', 'OS': '' },
  'Laptops': { 'Processor': '', 'RAM': '', 'Storage': '', 'Display': '', 'Graphics': '', 'Battery': '', 'OS': '' },
  'Desktop': { 'Processor': '', 'Motherboard': '', 'RAM': '', 'Storage': '', 'Graphics': '', 'Power Supply': '', 'Casing': '' },
  'PC': { 'Processor': '', 'Motherboard': '', 'RAM': '', 'Storage': '', 'Graphics': '', 'Power Supply': '', 'Casing': '' },
  'Server': { 'Processor': '', 'RAM': '', 'Storage Controller': '', 'Drive Bays': '', 'Form Factor': '', 'Power Supply': '' },
  
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
  'HDD': { 'Capacity': '', 'RPM': '', 'Cache': '', 'Form Factor': '', 'Interface': '' },
  'Power Supply': { 'Wattage': '', 'Efficiency Rating': '', 'Modular': '', 'Form Factor': '' },
  'PSU': { 'Wattage': '', 'Efficiency Rating': '', 'Modular': '', 'Form Factor': '' },
  'Casing': { 'Type': '', 'Motherboard Support': '', 'Front Ports': '', 'Fan Support': '', 'Radiator Support': '' },
  'Cooler': { 'Type (Air/Liquid)': '', 'Socket Support': '', 'Fan Speed': '', 'Noise Level': '' },
  
  // Peripherals & Audio
  'Monitor': { 'Panel Type': '', 'Refresh Rate': '', 'Resolution': '', 'Response Time': '', 'Ports': '' },
  'Keyboard': { 'Type (Mech/Membrane)': '', 'Switch Type': '', 'Connectivity': '', 'Backlight': '' },
  'Mouse': { 'Sensor': '', 'DPI': '', 'Connectivity': '', 'Buttons': '' },
  'Headphone': { 'Type': '', 'Connectivity': '', 'Frequency Response': '', 'Microphone': '', 'Impedance': '' },
  'Earphone': { 'Type': '', 'Connectivity': '', 'Frequency Response': '', 'Microphone': '' },
  'Earbud': { 'Bluetooth Version': '', 'Driver Size': '', 'Play Time': '', 'Charging Time': '', 'Water Resistance': '' },
  'TWS': { 'Bluetooth Version': '', 'Driver Size': '', 'Play Time': '', 'Charging Time': '', 'Water Resistance': '' },
  'Speaker': { 'Configuration (2.0/2.1)': '', 'Total RMS': '', 'Connectivity': '', 'Frequency Response': '' },
  'Webcam': { 'Resolution': '', 'Frame Rate': '', 'Field of View': '', 'Microphone': '' },
  'Microphone': { 'Type': '', 'Polar Pattern': '', 'Frequency Response': '', 'Connectivity': '' },
  
  // IT, Networking & Security
  'Router': { 'Antenna': '', 'Wi-Fi Speed': '', 'Bands': '', 'Ports': '', 'Coverage': '' },
  'Network': { 'Standard': '', 'Speed': '', 'Ports': '', 'Features': '' },
  'Switch': { 'Ports': '', 'Speed': '', 'PoE Support': '', 'Managed/Unmanaged': '' },
  'Access Point': { 'Wi-Fi Standard': '', 'Speed': '', 'Antenna': '', 'Coverage': '' },
  'CCTV': { 'Resolution': '', 'Lens': '', 'Night Vision Distance': '', 'Connectivity': '', 'Weatherproof Rating': '' },
  'Camera': { 'Resolution': '', 'Lens': '', 'Night Vision Distance': '', 'Connectivity': '', 'Weatherproof Rating': '' },
  'NVR': { 'Channels': '', 'Storage Capacity': '', 'Resolution Support': '', 'Video Output': '' },
  'DVR': { 'Channels': '', 'Storage Capacity': '', 'Resolution Support': '', 'Video Output': '' },
  'Printer': { 'Functions': '', 'Print Speed': '', 'Resolution': '', 'Paper Size': '', 'Connectivity': '' },
  'Scanner': { 'Type': '', 'Resolution': '', 'Scan Speed': '', 'Connectivity': '' },
  'Barcode': { 'Scan Type (1D/2D)': '', 'Connectivity': '', 'Scan Rate': '', 'Drop Resistance': '' },
  'POS': { 'Processor': '', 'RAM': '', 'Storage': '', 'Display': '', 'OS': '' },
  
  // Gadgets & Smart Home
  'Smart Watch': { 'Display': '', 'Battery Life': '', 'Water Resistance': '', 'Sensors': '', 'Connectivity': '' },
  'Power Bank': { 'Capacity': '', 'Input Ports': '', 'Output Ports': '', 'Fast Charging': '' },
  'Flash Drive': { 'Capacity': '', 'Interface (USB 2.0/3.0)': '', 'Read Speed': '', 'Material': '' },
  'Pen Drive': { 'Capacity': '', 'Interface (USB 2.0/3.0)': '', 'Read Speed': '', 'Material': '' },
  'Memory Card': { 'Capacity': '', 'Class': '', 'Read Speed': '', 'Format (SD/MicroSD)': '' },
  'Projector': { 'Brightness (Lumens)': '', 'Resolution': '', 'Contrast Ratio': '', 'Lamp Life': '', 'Projection Size': '' },
  'Drone': { 'Camera Resolution': '', 'Flight Time': '', 'Control Range': '', 'Weight': '' },
  'Action Camera': { 'Resolution': '', 'Frame Rate': '', 'Waterproof': '', 'Battery Life': '' },
  'Gimbal': { 'Payload': '', 'Battery Life': '', 'Axes': '', 'Compatibility': '' },
  'Stabilizer': { 'Payload': '', 'Battery Life': '', 'Axes': '', 'Compatibility': '' },
  'Gamepad': { 'Compatibility': '', 'Connectivity': '', 'Vibration': '', 'Battery Life': '' },
  'Controller': { 'Compatibility': '', 'Connectivity': '', 'Vibration': '', 'Battery Life': '' },
  
  // Accessories & Power
  'UPS': { 'Capacity (VA)': '', 'Load Capacity (W)': '', 'Backup Time': '', 'Battery Type': '' },
  'Cable': { 'Type': '', 'Length': '', 'Data Transfer Rate': '', 'Material': '' },
  'Adapter': { 'Input': '', 'Output': '', 'Supported Resolution/Speed': '', 'Material': '' },
  'Converter': { 'Input': '', 'Output': '', 'Supported Resolution/Speed': '', 'Material': '' },
  'Hub': { 'Input Interface': '', 'Output Ports': '', 'Data Transfer Rate': '', 'Material': '' },
  'Docking Station': { 'Input Interface': '', 'Output Ports': '', 'Power Delivery': '', 'Material': '' },
  
  // TV & Display
  'TV': { 'Screen Size': '', 'Resolution': '', 'Panel Type': '', 'Smart Features': '', 'Ports': '' },
  'Television': { 'Screen Size': '', 'Resolution': '', 'Panel Type': '', 'Smart Features': '', 'Ports': '' },
  
  // Fallback
  'Accessory': { 'Type': '', 'Material': '', 'Compatibility': '', 'Dimensions': '' },
  'Default': { 'Brand': '', 'Model': '', 'Color': '', 'Weight': '', 'Warranty': '' }
};

const InventoryTab`;

if (c.match(oldTemplatesRegex)) {
  c = c.replace(oldTemplatesRegex, expandedTemplates);
  fs.writeFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', c.replace(/\n/g, nl));
  console.log('Expanded SPEC_TEMPLATES successfully');
} else {
  console.log('Regex did not match to replace SPEC_TEMPLATES');
}