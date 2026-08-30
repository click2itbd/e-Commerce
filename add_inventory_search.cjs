const fs = require('fs');
let file = 'src/pages/admin/tabs/inventory/Inventory.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add state
content = content.replace(
  'const [itemsPerPage, setItemsPerPage] = useState(25);',
  'const [itemsPerPage, setItemsPerPage] = useState(25);\n  const [inventorySearchQuery, setInventorySearchQuery] = useState("");'
);

// Add search bar UI
const filterUI = `
            <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex flex-col gap-4">
              <div className="relative max-w-md w-full">
                <input
                  type="text"
                  placeholder="Search products by name, SKU, model..."
                  value={inventorySearchQuery}
                  onChange={(e) => { setInventorySearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#EF4444]"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              </div>
              <div className="flex flex-wrap gap-2 items-center">
`;
content = content.replace('<div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex flex-wrap gap-2 items-center">', filterUI);
content = content.replace('              {isAddingProduct || editingProduct ? (', '              </div>\n\n              {isAddingProduct || editingProduct ? (');

// Update filter logic in table body
content = content.replace(
  'const filtered = [...products]\n                      .filter(p => inventoryCategoryFilter === \'all\' || p.category === inventoryCategoryFilter)\n                      .sort((a, b) => a.name.localeCompare(b.name));',
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

// Update totalItems in Pagination
content = content.replace(
  'totalItems={products.filter(p => inventoryCategoryFilter === \'all\' || p.category === inventoryCategoryFilter).length}',
  'totalItems={products.filter(p => inventoryCategoryFilter === \'all\' || p.category === inventoryCategoryFilter).filter(p => !inventorySearchQuery.trim() || (p.name || "").toLowerCase().includes(inventorySearchQuery.toLowerCase()) || (p.sku || p.id || "").toLowerCase().includes(inventorySearchQuery.toLowerCase()) || (p.model || "").toLowerCase().includes(inventorySearchQuery.toLowerCase())).length}'
);

fs.writeFileSync(file, content, 'utf8');
