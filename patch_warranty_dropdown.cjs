const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

// 1. Patch the mapping in addCustomItem
code = code.replace(
    "warranty: (customItemForm as any).warranty || '',",
    "warranty: ((customItemForm as any).warrantyUnit === 'Life Time') ? 'Life Time' : ((customItemForm as any).warrantyValue ? `${(customItemForm as any).warrantyValue} ${(customItemForm as any).warrantyUnit || 'Years'}` : ''),"
);

// 2. Patch the clear function to clear the new fields
code = code.replace(
    "setCustomItemForm({ name: '', description: '', quantity: 1, price: 0, discount: 0 });",
    "setCustomItemForm({ name: '', description: '', quantity: 1, price: 0, discount: 0, brand: '', warrantyValue: '', warrantyUnit: 'Years' } as any);"
);
// Also in cancel button just to be safe if there is one
code = code.replace(
    "onClick={() => setShowCustomModal(false)}",
    "onClick={() => { setShowCustomModal(false); setCustomItemForm({ name: '', description: '', quantity: 1, price: 0, discount: 0, brand: '', warrantyValue: '', warrantyUnit: 'Years' } as any); }}"
);

// 3. Patch the JSX input
const oldJsx = `                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Warranty (optional)</label>
                      <input 
                        className="w-full border p-2 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                        value={customItemForm.warranty}
                        onChange={e => setCustomItemForm({...customItemForm, warranty: e.target.value})}
                        placeholder="e.g. 1 Year"
                      />
                    </div>`;
                    
const oldJsxAlt = `                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Warranty (optional)</label>
                      <input 
                        className="w-full border p-2 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                        value={(customItemForm as any).warranty}
                        onChange={e => setCustomItemForm({...customItemForm, warranty: e.target.value})}
                        placeholder="e.g. 1 Year"
                      />
                    </div>`;

const newJsx = `                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Warranty (optional)</label>
                      <div className="flex gap-2">
                        <input 
                          type="number"
                          min="1"
                          className="w-1/2 border p-2 rounded focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-400" 
                          value={(customItemForm as any).warrantyValue || ''}
                          onChange={e => setCustomItemForm({...customItemForm, warrantyValue: e.target.value} as any)}
                          placeholder="e.g. 1"
                          disabled={(customItemForm as any).warrantyUnit === 'Life Time'}
                        />
                        <select
                          className="w-1/2 border p-2 rounded focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                          value={(customItemForm as any).warrantyUnit || 'Years'}
                          onChange={e => {
                             const unit = e.target.value;
                             const updates: any = { warrantyUnit: unit };
                             if (unit === 'Life Time') updates.warrantyValue = '';
                             setCustomItemForm({...customItemForm, ...updates} as any);
                          }}
                        >
                          <option value="Days">Days</option>
                          <option value="Months">Months</option>
                          <option value="Years">Years</option>
                          <option value="Life Time">Life Time</option>
                        </select>
                      </div>
                    </div>`;

if (code.includes(oldJsx)) {
    code = code.replace(oldJsx, newJsx);
    console.log("Replaced JSX (standard)");
} else if (code.includes(oldJsxAlt)) {
    code = code.replace(oldJsxAlt, newJsx);
    console.log("Replaced JSX (alt)");
} else {
    // try regex fallback
    code = code.replace(/<div>\s*<label[^>]*>Warranty \(optional\)<\/label>\s*<input[^>]*value=\{[^\}]*\}[^>]*onChange=\{[^\}]*\}[^>]*placeholder="e\.g\. 1 Year"\s*\/>\s*<\/div>/g, newJsx);
    console.log("Tried replacing JSX via regex");
}

fs.writeFileSync('src/components/QuotationManager.tsx', code);
console.log("Warranty dropdown patch applied");
