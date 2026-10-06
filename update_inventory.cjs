const fs = require('fs');
let c = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceInventory.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

const brandField = `<label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                      <input type="text" value={formData.brand || ''} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>`;

const brandWithCondition = `<label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                      <input type="text" value={formData.brand || ''} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                      <select value={formData.condition || 'new'} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="new">New (Default)</option>
                        <option value="used">Used / Pre-Owned</option>
                      </select>
                    </div>`;

if (c.includes(brandField) && !c.includes('<option value="used">Used / Pre-Owned</option>')) {
  c = c.replace(brandField, brandWithCondition);
  fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceInventory.tsx', c.replace(/\n/g, nl));
  console.log('Added condition field to Inventory');
} else {
  console.log('Could not find brand field or already added');
}