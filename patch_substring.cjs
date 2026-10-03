const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

const anchor = "updateItem(idx, 'warranty'";
const startIdx = code.lastIndexOf('<input', code.indexOf(anchor));
const endIdx = code.indexOf('/>', code.indexOf(anchor)) + 2;

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `                                  {(() => {
                                    const currentWarranty = ((item as any).warranty || (item as any).specs?.Warranty || ((item as any).warrantyMonths ? ((item as any).warrantyMonths > 12 ? \`\${(item as any).warrantyMonths / 12} Years\` : \`\${(item as any).warrantyMonths} Months\`) : '') || '').toString();
                                    const isLifeTime = currentWarranty.toLowerCase().includes('life');
                                    const numPart = isLifeTime ? '' : (currentWarranty.match(/\\d+/) || [''])[0];
                                    const textPart = isLifeTime ? 'Life Time' : (currentWarranty.toLowerCase().includes('year') || currentWarranty.toLowerCase().includes('yr') ? 'Years' : currentWarranty.toLowerCase().includes('month') || currentWarranty.toLowerCase().includes('mo') ? 'Months' : currentWarranty.toLowerCase().includes('day') ? 'Days' : 'Years');
                                    
                                    return (
                                      <div className="flex gap-1">
                                        <input 
                                          type="number"
                                          min="1"
                                          className="w-1/2 border border-gray-200 p-1 rounded text-xs text-gray-600 bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
                                          placeholder="1"
                                          disabled={isLifeTime}
                                          value={numPart}
                                          onChange={e => {
                                            const val = e.target.value;
                                            updateItem(idx, 'warranty', val ? \`\${val} \${textPart}\` : '');
                                          }}
                                        />
                                        <select
                                          className="w-1/2 border border-gray-200 p-1 rounded text-xs text-gray-600 bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-1 focus:ring-indigo-500"
                                          value={textPart}
                                          onChange={e => {
                                            const val = e.target.value;
                                            if (val === 'Life Time') {
                                              updateItem(idx, 'warranty', 'Life Time');
                                            } else {
                                              updateItem(idx, 'warranty', numPart ? \`\${numPart} \${val}\` : '');
                                            }
                                          }}
                                        >
                                          <option value="Days">Days</option>
                                          <option value="Months">Months</option>
                                          <option value="Years">Years</option>
                                          <option value="Life Time">Life</option>
                                        </select>
                                      </div>
                                    );
                                  })()}`;

    code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
    fs.writeFileSync('src/components/QuotationManager.tsx', code);
    console.log("Success with substring replacement");
} else {
    console.log("Failed to find boundaries");
}
