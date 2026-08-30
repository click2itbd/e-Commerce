const fs = require('fs');
let file = 'src/pages/admin/tabs/inventory/Inventory.tsx';
let content = fs.readFileSync(file, 'utf8');

// The replacement for filtered array
content = content.replace(
  /const filtered = \[\.\.\.products\]\s*\.filter\(p => inventoryCategoryFilter === 'all' \|\| p\.category === inventoryCategoryFilter\)\s*\.sort\(\(a, b\) => a\.name\.localeCompare\(b\.name\)\);/g,
  `const filtered = [...products]
                      .filter(p => inventoryCategoryFilter === 'all' || p.category === inventoryCategoryFilter)
                      .filter(p => {
                        if (!inventorySearchQuery.trim()) return true;
                        const q = inventorySearchQuery.toLowerCase();
                        return (p.name || '').toLowerCase().includes(q) ||
                               (p.sku || p.id || '').toLowerCase().includes(q) ||
                               (p.model || '').toLowerCase().includes(q);
                      })
                      .sort((a, b) => a.name.localeCompare(b.name));`
);

fs.writeFileSync(file, content, 'utf8');
