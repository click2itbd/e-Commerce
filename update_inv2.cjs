const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', 'utf8');

const regex = /<label className="block text-\[11px\] font-bold text-slate-500 uppercase mb-1\.5">Product Name<\/label>[\s\S]*?<\/div>/m;

if (regex.test(content)) {
  content = content.replace(regex, match => {
    return match + `\n\n                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Model Number</label>
                            <input
                              type="text"
                              value={formData.model || ''}
                              onChange={e => setFormData({ ...formData, model: e.target.value })}
                              className="w-full font-medium text-sm border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g. A2849"
                            />
                          </div>`;
  });
  fs.writeFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', content, 'utf8');
  console.log("SUCCESS: Replaced Inventory");
} else {
  console.log("FAILED to find Product Name div in Inventory.tsx");
}
