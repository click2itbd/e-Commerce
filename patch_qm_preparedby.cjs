const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

// 1. Add preparedBy to initialFormState
if (!code.includes("preparedBy: ''")) {
    code = code.replace(
        "validUntil: ''\n  };",
        "validUntil: '',\n    preparedBy: ''\n  };"
    );
    console.log("Added preparedBy to initialFormState");
}

// 2. Add input field to JSX
const targetJsx = `              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Valid Until</label>
                <input 
                  type="date"
                  className="w-full border p-2 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                  value={formData.validUntil?.split('T')[0] || ''}
                  onChange={e => setFormData({ ...formData, validUntil: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                />
              </div>`;
              
const replacementJsx = `              <div>
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
                  placeholder="Staff name"
                  className="w-full border p-2 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                  value={(formData as any).preparedBy || ''}
                  onChange={e => setFormData({ ...formData, preparedBy: e.target.value } as any)}
                />
              </div>`;

if (code.includes(targetJsx) && !code.includes('Prepared By</label>')) {
    code = code.replace(targetJsx, replacementJsx);
    console.log("Added Prepared By input field");
} else {
    // If exact string fails, find line by line
    const lines = code.split('\n');
    const idx = lines.findIndex(l => l.includes('Valid Until</label>'));
    if (idx !== -1 && !code.includes('Prepared By</label>')) {
        let endIdx = idx;
        while(!lines[endIdx].includes('</div>')) { endIdx++; }
        const injectFields = `              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Prepared By</label>
                <input 
                  type="text"
                  placeholder="Staff name"
                  className="w-full border p-2 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                  value={(formData as any).preparedBy || ''}
                  onChange={e => setFormData({ ...formData, preparedBy: e.target.value } as any)}
                />
              </div>`;
        lines.splice(endIdx + 1, 0, injectFields);
        code = lines.join('\n');
        console.log("Added Prepared By input field via line splicing");
    }
}

// 3. Make sure pdf.ts handles preparedBy for Quotations too.
// Wait, pdf.ts expects `ord.preparedBy`. But `handleSaveQuotation` must save it.
// `formData` is passed exactly as it is to `addDoc`/`updateDoc`, so it will be saved.

fs.writeFileSync('src/components/QuotationManager.tsx', code);
console.log("Done");
