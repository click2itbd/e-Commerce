const fs = require('fs');
let lines = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8').split('\n');

const inputsToInsert = [
'                            <div className="grid grid-cols-2 gap-2 mt-1">',
'                              <input',
'                                type="text"',
'                                className="w-full border border-gray-200 p-1.5 rounded text-xs text-gray-600 bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-1 focus:ring-indigo-500"',
'                                placeholder="Brand (Optional)"',
'                                value={item.brand || \'\'}',
'                                onChange={e => updateItem(idx, \'brand\', e.target.value)}',
'                              />',
'                              <input',
'                                type="text"',
'                                className="w-full border border-gray-200 p-1.5 rounded text-xs text-gray-600 bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-1 focus:ring-indigo-500"',
'                                placeholder="Warranty (Optional)"',
'                                value={(item as any).warranty || (item as any).specs?.Warranty || ((item as any).warrantyMonths ? ((item as any).warrantyMonths > 12 ? `${(item as any).warrantyMonths / 12} Yrs` : `${(item as any).warrantyMonths} Mos`) : \'\') || \'\'}',
'                                onChange={e => updateItem(idx, \'warranty\', e.target.value)}',
'                              />',
'                            </div>'
];

// Insert after line index 647
lines.splice(648, 0, ...inputsToInsert);

fs.writeFileSync('src/components/QuotationManager.tsx', lines.join('\n'));
console.log('Successfully spliced inline brand/warranty inputs');
