const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

// Add preparedBy to initialFormState
code = code.replace(
  "    validUntil: ''\n  };",
  "    validUntil: '',\n    preparedBy: ''\n  };"
);

// Add the Prepared By input right after Valid Until
const oldValidUntil = `                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Valid Until</label>
                  <input 
                    type="date"
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                    value={formData.validUntil?.split('T')[0] || ''}
                    onChange={e => setFormData({ ...formData, validUntil: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                  />
                </div>`;

const newValidUntil = `                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Valid Until</label>
                  <input 
                    type="date"
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                    value={formData.validUntil?.split('T')[0] || ''}
                    onChange={e => setFormData({ ...formData, validUntil: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Prepared By</label>
                  <input 
                    type="text"
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                    value={formData.preparedBy || ''}
                    onChange={e => setFormData({ ...formData, preparedBy: e.target.value })}
                    placeholder="E.g., John Doe"
                  />
                </div>`;

code = code.replace(oldValidUntil, newValidUntil);

// Update setFormData in handleSaveQuotation isn't strictly necessary if it uses ...formData since we added it to initialFormState.
// But we should ensure the viewMode 'edit' sets it correctly when loading an existing quotation.
code = code.replace(
  "      validUntil: quotation.validUntil || ''",
  "      validUntil: quotation.validUntil || '',\n      preparedBy: quotation.preparedBy || ''"
);

fs.writeFileSync('src/components/QuotationManager.tsx', code);
console.log('Prepared By field added');
