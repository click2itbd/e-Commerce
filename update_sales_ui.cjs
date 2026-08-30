const fs = require('fs');
let file = 'src/pages/admin/tabs/sales/SalesForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Barcode to lucide-react imports if not there
if (!content.includes('Barcode,')) {
    content = content.replace('ShoppingBag,', 'ShoppingBag, Barcode, ScanLine,');
}

// 2. Change the search placeholder and icon
content = content.replace(
  'placeholder="Search products by name, SKU..."',
  'placeholder="Scan Barcode or Search (SKU/Name)..."'
);

content = content.replace(
  /<Search className="absolute left-2\.5 top-1\/2 -translate-y-1\/2 text-gray-400" size=\{14\} \/>/g,
  '<ScanLine className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />'
);

fs.writeFileSync(file, content, 'utf8');
