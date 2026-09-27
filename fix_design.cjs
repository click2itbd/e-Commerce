const fs = require('fs');
let inv = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceInventory.tsx', 'utf8');

// 1. Remove the bulky block
const bulkyBlock = `
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
inv = inv.replace(bulkyBlock, '');

// 2. Add it to the checkboxes list
const checkboxesStart = `<div className="flex flex-wrap gap-4 pt-2">`;
const newCheckbox = `
                    <label className="flex items-center gap-2 text-sm font-bold text-red-700 cursor-pointer bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                      <input type="checkbox" checked={formData.isOutOfStock || false} onChange={e => setFormData({...formData, isOutOfStock: e.target.checked})} className="rounded border-red-300 text-red-600 focus:ring-red-500" />
                      Out of Stock
                    </label>`;
if(!inv.includes('Out of Stock</label>')) {
    inv = inv.replace(checkboxesStart, checkboxesStart + newCheckbox);
}

fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceInventory.tsx', inv, 'utf8');

// Same for main admin inventory
let mainInv = fs.readFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', 'utf8');

const bulkyBlockMain = `
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
                    
mainInv = mainInv.replace(bulkyBlockMain, '');

const checkboxesStartMain = `<div className="flex flex-wrap gap-4 pt-2">`;
if(!mainInv.includes('Out of Stock</label>')) {
    mainInv = mainInv.replace(checkboxesStartMain, checkboxesStartMain + newCheckbox);
}
fs.writeFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', mainInv, 'utf8');
console.log('Fixed design');