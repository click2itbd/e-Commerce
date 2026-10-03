const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

const targetStr = "placeholder=\"Description (Optional)\"";
const lines = code.split('\n');

const descIdx = lines.findIndex(l => l.includes(targetStr));

if (descIdx !== -1) {
    // Description input ends at descIdx + 3 (approx) -> />
    let endIdx = descIdx;
    while (!lines[endIdx].includes('/>')) { endIdx++; }
    
    // Check if we already injected it to avoid duplicates
    if (!lines[endIdx + 1].includes('placeholder="Brand (Optional)"')) {
        const injectHtml = `                              <div className="grid grid-cols-2 gap-2 mt-1">
                                <input 
                                  type="text"
                                  className="w-full border border-gray-200 p-1.5 rounded text-xs text-gray-600 bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-1 focus:ring-indigo-500"
                                  placeholder="Brand (Optional)"
                                  value={item.brand || ''}
                                  onChange={e => updateItem(idx, 'brand', e.target.value)}
                                />
                                <input 
                                  type="text"
                                  className="w-full border border-gray-200 p-1.5 rounded text-xs text-gray-600 bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-1 focus:ring-indigo-500"
                                  placeholder="Warranty (Optional)"
                                  value={(item as any).warranty || (item as any).specs?.Warranty || ((item as any).warrantyMonths ? ((item as any).warrantyMonths > 12 ? \`\${(item as any).warrantyMonths / 12} Yrs\` : \`\${(item as any).warrantyMonths} Mos\`) : '') || ''}
                                  onChange={e => updateItem(idx, 'warranty', e.target.value)}
                                />
                              </div>`;
        
        lines.splice(endIdx + 1, 0, injectHtml);
        code = lines.join('\n');
        fs.writeFileSync('src/components/QuotationManager.tsx', code);
        console.log('Successfully injected Brand and Warranty inputs');
    } else {
        console.log('Already injected!');
    }
} else {
    console.log('Description placeholder not found!');
}
