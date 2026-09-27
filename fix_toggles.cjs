const fs = require('fs');
let inv = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceInventory.tsx', 'utf8');

// a. Add isOutOfStock to initialForm if not exists
if (!inv.includes('isOutOfStock: false')) {
  inv = inv.replace(
    "stock: 0,",
    "stock: 0, isOutOfStock: false,"
  );
}

// b. Add toggle before the grid gap-4 (Discount Price / Brand)
if (!inv.includes('Out of Stock</label>')) {
  // Let's find the stock input wrapper
  const targetRegex = /(<input type="number".*?stock: Number\(e\.target\.value\)\}\)}.*? \/>\s*<\/div>)/;
  
  const toggleCode = `
                      {/* Out of Stock Toggle */}
                      <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg col-span-2">
                        <div>
                          <label className="font-bold text-sm text-gray-700">Out of Stock</label>
                          <p className="text-xs text-gray-500 mt-0.5">ON করলে কাস্টমার অর্ডার করতে পারবে না</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, isOutOfStock: !formData.isOutOfStock})}
                          className={\`relative w-12 h-6 rounded-full transition-colors \${
                            formData.isOutOfStock ? 'bg-red-500' : 'bg-gray-300'
                          }\`}
                        >
                          <span className={\`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform \${
                            formData.isOutOfStock ? 'translate-x-6' : 'translate-x-1'
                          }\`} />
                        </button>
                      </div>`;
                      
  inv = inv.replace(targetRegex, `$1\n${toggleCode}`);
}

// c. Fix table badge
if (!inv.includes('product.isOutOfStock ? (')) {
  const badgeRegex = /<span className=\{\`inline-flex items-center px-2\.5 py-0\.5 rounded-full text-xs font-medium \$\{\s*product\.stock > \(product\.lowStockThreshold \|\| 5\) \? 'bg-green-100 text-green-800' :\s*product\.stock > 0 \? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'\s*\}\`\}>\s*\{product\.stock\} in stock\s*<\/span>/;
  
  const newBadge = `{product.isOutOfStock ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Out of Stock
                      </span>
                    ) : (
                      <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${
                        product.stock > (product.lowStockThreshold || 5) ? 'bg-green-100 text-green-800' : 
                        product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }\`}>
                        {product.stock} in stock
                      </span>
                    )}`;
                    
  inv = inv.replace(badgeRegex, newBadge);
}

fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceInventory.tsx', inv, 'utf8');

// Same for main admin Inventory tab
let mainInv = fs.readFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', 'utf8');
if (!mainInv.includes('Out of Stock</label>')) {
  const targetRegexMain = /(<input type="number".*?stock: Number\(e\.target\.value\)\}\)}.*? \/>\s*<\/div>)/;
  
  const toggleCodeMain = `
                    <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                      <div>
                        <label className="font-bold text-sm text-gray-700">Out of Stock</label>
                        <p className="text-xs text-gray-500 mt-0.5">ON করলে কাস্টমার অর্ডার করতে পারবে না</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, isOutOfStock: !formData.isOutOfStock})}
                        className={\`relative w-12 h-6 rounded-full transition-colors \${
                          formData.isOutOfStock ? 'bg-red-500' : 'bg-gray-300'
                        }\`}
                      >
                        <span className={\`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform \${
                          formData.isOutOfStock ? 'translate-x-6' : 'translate-x-1'
                        }\`} />
                      </button>
                    </div>`;
                    
  mainInv = mainInv.replace(targetRegexMain, `$1\n${toggleCodeMain}`);
  
  const badgeRegexMain = /<span className=\{\`inline-flex items-center px-2\.5 py-0\.5 rounded-full text-xs font-medium \$\{\s*product\.stock > \(product\.lowStockThreshold \|\| 5\) \? 'bg-green-100 text-green-800' :\s*product\.stock > 0 \? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'\s*\}\`\}>\s*\{product\.stock\} in stock\s*<\/span>/;
  
  const newBadgeMain = `{product.isOutOfStock ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Out of Stock
                    </span>
                  ) : (
                    <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${
                      product.stock > (product.lowStockThreshold || 5) ? 'bg-green-100 text-green-800' : 
                      product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    }\`}>
                      {product.stock} in stock
                    </span>
                  )}`;
                  
  mainInv = mainInv.replace(badgeRegexMain, newBadgeMain);
  
  fs.writeFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', mainInv, 'utf8');
}
console.log('Fixed toggles in both inventories');