const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

const oldEmptyState = `<p className="text-xs text-slate-400 font-bold">No technical specifications added.</p>`;
const newEmptyState = `<p className="text-xs text-slate-400 font-bold mb-3">No technical specifications added.</p>
                            <button
                              type="button"
                              onClick={() => {
                                const cat = formData.category || '';
                                const templateKey = Object.keys(SPEC_TEMPLATES).find(k => k !== 'Default' && cat.toLowerCase().includes(k.toLowerCase()));
                                const newSpecs = templateKey ? { ...SPEC_TEMPLATES[templateKey] } : { ...SPEC_TEMPLATES['Default'] };
                                setFormData({ ...formData, specs: newSpecs });
                                toast.success(templateKey ? templateKey + ' template loaded' : 'Default template loaded');
                              }}
                              className="text-[11px] bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-100 transition-all mx-auto flex items-center gap-2"
                            >
                              <Plus size={14} /> Auto-Fill Template
                            </button>`;

if (c.includes(oldEmptyState)) {
  c = c.replace(oldEmptyState, newEmptyState);
  fs.writeFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', c.replace(/\n/g, nl));
  console.log('Added Auto-Fill button to empty state');
} else {
  console.log('Empty state not found');
}