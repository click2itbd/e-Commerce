const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/context/AuthContext.tsx');
let content = fs.readFileSync(file, 'utf8');

const target = `'manage_inventory': ['inventory', 'purchases', 'purchase_return', 'vendors', 'brands'],`;
const replacement = `'manage_inventory': ['inventory', 'menus', 'brands'],
      'manage_purchases': ['purchases', 'purchase_return', 'vendors'],`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated legacy mapping in AuthContext');
} else {
  console.log('Could not find target in AuthContext');
}
