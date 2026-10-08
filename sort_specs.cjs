const fs = require('fs');
let c = fs.readFileSync('src/pages/shop/ProductDetails.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

const specPriorityCode = `
const SPEC_PRIORITY = [
  'brand', 'model', 'type', 'form factor', 
  'processor', 'cpu', 'architecture', 'cores', 'threads', 'base clock', 'boost clock',
  'motherboard', 'chipset', 'socket',
  'memory', 'ram', 
  'storage', 'capacity', 'ssd', 'hdd',
  'display', 'screen size', 'resolution', 'panel type', 'refresh rate', 'response time',
  'graphics', 'gpu',
  'camera', 'lens', 'sensor', 'night vision',
  'connectivity', 'network', 'wi-fi', 'bluetooth', 'connection type',
  'ports', 'interface', 'usb',
  'power', 'battery', 'battery life', 'charging time',
  'material', 'color', 'design', 'weight', 'dimensions', 
  'os support', 'compatibility', 'plug & play',
  'warranty'
];

const sortSpecs = (entries: [string, any][]) => {
  return entries.sort((a, b) => {
    const aKey = a[0].toLowerCase();
    const bKey = b[0].toLowerCase();
    const aIndex = SPEC_PRIORITY.findIndex(p => aKey.includes(p));
    const bIndex = SPEC_PRIORITY.findIndex(p => bKey.includes(p));
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return aKey.localeCompare(bKey);
  });
};
`;

if (!c.includes('SPEC_PRIORITY')) {
  // Inject before ProductDetails component
  const componentRegex = /const ProductDetails = \(\) => \{/;
  c = c.replace(componentRegex, specPriorityCode + '\n' + 'const ProductDetails = () => {');
}

// Replace standard Object.entries
const oldKeyFeatures = `{Object.entries(product.specs).slice(0, 5).map(([key, value]) => (`;
const newKeyFeatures = `{sortSpecs(Object.entries(product.specs)).slice(0, 5).map(([key, value]) => (`;

const oldSpecTable = `{Object.entries(product.specs).map(([key, value], i) => (`;
const newSpecTable = `{sortSpecs(Object.entries(product.specs)).map(([key, value], i) => (`;

c = c.replace(oldKeyFeatures, newKeyFeatures);
c = c.replace(oldSpecTable, newSpecTable);

fs.writeFileSync('src/pages/shop/ProductDetails.tsx', c.replace(/\n/g, nl));
console.log('Successfully injected sorting logic into ProductDetails.tsx');