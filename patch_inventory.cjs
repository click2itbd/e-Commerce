const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/admin/tabs/inventory/Inventory.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add model to the initial form state
content = content.replace(/price: 0,\n      stock: 0,/, `price: 0,\n      stock: 0,\n      model: '',`);

// Add input field in the form
const formTarget = `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">SKU / Code</label>`;
const formReplacement = `<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Model Number</label>
                <input
                  type="text"
                  value={formData.model || ''}
                  onChange={e => setFormData({ ...formData, model: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2 font-medium"
                  placeholder="e.g. A2643"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">SKU / Code</label>`;
content = content.replace(formTarget, formReplacement);

// Optional: display in the table
const tableThTarget = `<th className="px-6 py-3 text-left">SKU</th>`;
const tableThReplacement = `<th className="px-6 py-3 text-left">Model</th>\n                <th className="px-6 py-3 text-left">SKU</th>`;
content = content.replace(tableThTarget, tableThReplacement);

const tableTdTarget = `<td className="px-6 py-4">\n                  <span className="text-sm font-medium text-gray-600 uppercase">#{product.id.slice(0, 8)}</span>\n                </td>`;
const tableTdReplacement = `<td className="px-6 py-4 text-gray-600 text-sm">{product.model || '-'}</td>\n                <td className="px-6 py-4">\n                  <span className="text-sm font-medium text-gray-600 uppercase">#{product.id.slice(0, 8)}</span>\n                </td>`;
content = content.replace(tableTdTarget, tableTdReplacement);

fs.writeFileSync(file, content, 'utf8');
console.log('Added model to Inventory.tsx');
