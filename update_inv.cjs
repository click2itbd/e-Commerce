const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

// 1. Add bulkSpecInput state
const stateRegex = /const \[viewingProduct, setViewingProduct\] = useState<any>\(null\);/;
const newState = `const [viewingProduct, setViewingProduct] = useState<any>(null);
  const [bulkSpecInput, setBulkSpecInput] = useState('');`;

if (c.match(stateRegex)) {
  c = c.replace(stateRegex, newState);
}

// 2. Inject Bulk Add UI before the mapping of existing specs or empty state
const specHeaderRegex = /<h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Specifications<\/h4>[\s\S]*?<button[\s\S]*?onClick=\{addSpec\}[\s\S]*?<\/button>\s*<\/div>/;

const bulkAddUI = `<div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4 mt-2">
                          <label className="block text-[11px] font-bold text-blue-800 mb-1.5 uppercase">Quick Add Specs (Comma Separated)</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={bulkSpecInput}
                              onChange={e => setBulkSpecInput(e.target.value)}
                              placeholder="e.g. Processor, RAM, Storage, Warranty"
                              className="flex-1 px-3 py-1.5 border border-blue-200 rounded-md focus:ring-blue-500 text-sm bg-white"
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const items = bulkSpecInput.split(',').map(s => s.trim()).filter(s => s);
                                  if (items.length > 0) {
                                    const newSpecs = { ...(formData.specs || {}) };
                                    items.forEach(item => {
                                      if (!newSpecs[item]) newSpecs[item] = '';
                                    });
                                    setFormData({ ...formData, specs: newSpecs });
                                    setBulkSpecInput('');
                                  }
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const items = bulkSpecInput.split(',').map(s => s.trim()).filter(s => s);
                                if (items.length > 0) {
                                  const newSpecs = { ...(formData.specs || {}) };
                                  items.forEach(item => {
                                    if (!newSpecs[item]) newSpecs[item] = '';
                                  });
                                  setFormData({ ...formData, specs: newSpecs });
                                  setBulkSpecInput('');
                                }
                              }}
                              className="bg-blue-600 text-white px-3 py-1.5 rounded-md font-bold text-xs hover:bg-blue-700"
                            >
                              Add Fields
                            </button>
                          </div>
                        </div>`;

if (c.match(specHeaderRegex)) {
  c = c.replace(specHeaderRegex, match => match + '\n' + bulkAddUI);
  fs.writeFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', c.replace(/\n/g, nl));
  console.log('Added Bulk Spec Add to Inventory.tsx');
} else {
  console.log('Regex failed in Inventory.tsx');
}