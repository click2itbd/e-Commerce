const fs = require('fs');
let file = 'src/pages/admin/tabs/purchase/Purchases.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add sku to PurchaseItem interface
content = content.replace(
  "newSerials?: string | string[];\n}",
  "newSerials?: string | string[];\n  sku?: string;\n}"
);

// 2. Initialize sku when adding item
content = content.replace(
  "hasSerialTracking: Boolean(product.hasSerialTracking),",
  "hasSerialTracking: Boolean(product.hasSerialTracking),\n              sku: product.sku || '',"
);

// 3. Render the SKU input in the item row
const itemRowUI = `<span className="font-bold text-gray-900 block text-xs">{item.name}</span>
                                <span className="text-[10px] text-gray-400">Category: {item.category}</span>`;
const newItemRowUI = `<span className="font-bold text-gray-900 block text-xs">{item.name}</span>
                                <span className="text-[10px] text-gray-400 block mb-1">Category: {item.category}</span>
                                <input
                                  type="text"
                                  placeholder="Update Global Barcode/SKU..."
                                  value={item.sku || ''}
                                  onChange={e => updateItem(item.id, 'sku', e.target.value)}
                                  className="w-full text-[10px] border border-gray-200 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-blue-500"
                                />`;
content = content.replace(itemRowUI, newItemRowUI);

// 4. Update the firestore update logic
const updateLogic = `if (item.hasWarranty && item.warrantyYears) {
              updates.warrantyMonths = Number(item.warrantyYears) * 12;
            }`;
const newUpdateLogic = `if (item.hasWarranty && item.warrantyYears) {
              updates.warrantyMonths = Number(item.warrantyYears) * 12;
            }
            if (item.sku) {
              updates.sku = item.sku;
            }`;
content = content.replace(updateLogic, newUpdateLogic);

fs.writeFileSync(file, content, 'utf8');
