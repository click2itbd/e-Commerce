const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', 'utf8');

const skuField = `
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase">Barcode / SKU</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const randomSku = 'PRD-' + Math.floor(10000000 + Math.random() * 90000000);
                                    setFormData({ ...formData, sku: randomSku });
                                  }}
                                  className="text-blue-600 text-[10px] font-bold hover:underline"
                                >
                                  Generate Auto
                                </button>
                              </div>
                              <input
                                type="text"
                                value={formData.sku || ''}
                                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                className="w-full font-medium text-sm border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Scan or enter barcode"
                              />
                            </div>
`;

if (!c.includes('Barcode / SKU</label>')) {
  // Insert after the Model field
  c = c.replace(/(placeholder="e\.g\. A2849"\s*\/>\s*<\/div>)/, "$1\n" + skuField);
  fs.writeFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', c);
  console.log('Added SKU field to Inventory.tsx');
}

// We should also check if we need to add it to EcommerceInventory.tsx!
let c2 = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceInventory.tsx', 'utf8');
if (!c2.includes('Barcode / SKU</label>')) {
  c2 = c2.replace(/(placeholder="e\.g\. A2849"\s*\/>\s*<\/div>)/, "$1\n" + skuField);
  fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceInventory.tsx', c2);
  console.log('Added SKU field to EcommerceInventory.tsx');
}