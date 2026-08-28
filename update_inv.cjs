const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', 'utf8');

const target = `<label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Product Name</label>
                            <input
                              type="text"
                              required
                              value={formData.name}
                              onChange={e => setFormData({ ...formData, name: e.target.value })}
                              className="w-full font-medium text-sm border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g. iPhone 15 Pro Max"
                            />
                          </div>`;

const replacement = `<label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Product Name</label>
                            <input
                              type="text"
                              required
                              value={formData.name}
                              onChange={e => setFormData({ ...formData, name: e.target.value })}
                              className="w-full font-medium text-sm border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g. iPhone 15 Pro Max"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Model Number</label>
                            <input
                              type="text"
                              value={formData.model || ''}
                              onChange={e => setFormData({ ...formData, model: e.target.value })}
                              className="w-full font-medium text-sm border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g. A2849"
                            />
                          </div>`;

content = content.replace(target, replacement);

fs.writeFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', content, 'utf8');
console.log("Updated Inventory.tsx with model field");
