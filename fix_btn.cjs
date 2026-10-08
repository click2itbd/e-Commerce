const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

const regex = /<h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Specifications<\/h4>[\s\S]*?<button[\s\S]*?onClick=\{addSpec\}[\s\S]*?<\/button>/;

const newHeader = `<h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Specifications</h4>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const cat = formData.category || '';
                                const templateKey = Object.keys(SPEC_TEMPLATES).find(k => cat.toLowerCase().includes(k.toLowerCase()));
                                if (templateKey) {
                                  setFormData({ ...formData, specs: { ...(formData.specs || {}), ...SPEC_TEMPLATES[templateKey] } });
                                  toast.success(templateKey + ' template loaded');
                                } else {
                                  toast.error('No template found for category: ' + cat);
                                }
                              }}
                              className="text-[11px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition-all flex items-center gap-1 border border-blue-200"
                            >
                              <Plus size={14} /> Load Template
                            </button>
                            <button
                              type="button"
                              onClick={addSpec}
                              className="text-[11px] bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-200 transition-all flex items-center gap-1"
                            >
                              <Plus size={14} /> Add Custom Spec
                            </button>
                          </div>`;

if (c.match(regex)) {
  c = c.replace(regex, newHeader);
  fs.writeFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', c.replace(/\n/g, nl));
  console.log('Successfully replaced header');
} else {
  console.log('Regex did not match');
}