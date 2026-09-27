const fs = require('fs');

// 4. EcommerceInventory.tsx - add Out of Stock toggle
let inv = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceInventory.tsx', 'utf8');

// a. Add isOutOfStock to initialForm
inv = inv.replace(
  "name: '', sku: '', description: '', price: 0, stock: 0, categoryId: '', images: [], category: ''",
  "name: '', sku: '', description: '', price: 0, stock: 0, isOutOfStock: false, categoryId: '', images: [], category: ''"
);

// b. Update stock display in table to show Out of Stock badge
const oldStockBadge = `<span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${
                      product.stock > (product.lowStockThreshold || 5) ? 'bg-green-100 text-green-800' : 
                      product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }\`}>
                        {product.stock} in stock
                      </span>`;

const newStockBadge = `{product.isOutOfStock ? (
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

inv = inv.replace(oldStockBadge, newStockBadge);

// c. Add Out of Stock toggle after the Stock input field
const stockInputEnd = `<input type="number" required min="0" value={formData.stock || ''} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                      </div>`;

const stockInputEndWithToggle = `<input type="number" required min="0" value={formData.stock || ''} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                      </div>
                      
                      {/* Out of Stock Toggle */}
                      <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
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

inv = inv.replace(stockInputEnd, stockInputEndWithToggle);

fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceInventory.tsx', inv, 'utf8');
console.log('4. EcommerceInventory.tsx updated');