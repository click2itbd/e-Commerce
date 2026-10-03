const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

const oldTable = `<table className="w-full text-left mb-8 border-collapse">
                     <thead className="bg-indigo-50 border-b border-indigo-100 text-indigo-900 text-sm">
                         <tr>
                             <th className="py-3 px-4 font-bold">Description</th>
                             <th className="py-3 px-4 font-bold text-center">Qty</th>
                             <th className="py-3 px-4 font-bold text-right">Unit Price</th>
                             <th className="py-3 px-4 font-bold text-right">Discount</th>
                             <th className="py-3 px-4 font-bold text-right">Total</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 text-sm">
                         {formData.items.map((item, idx) => (
                             <tr key={idx}>
                                 <td className="py-3 px-4">
                                    <div className="font-medium text-gray-900">{item.name}</div>
                                    {(item as any).isCustomService && <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded">Custom</span>}
                                 </td>
                                 <td className="py-3 px-4 text-center">{item.quantity}</td>
                                 <td className="py-3 px-4 text-right font-mono">{formatCurrency(item.price, {})}</td>
                                 <td className="py-3 px-4 text-right font-mono">{formatCurrency(item.discount || 0, {})}</td>
                                 <td className="py-3 px-4 text-right font-mono font-bold text-gray-700">{formatCurrency((item.price * item.quantity) - (item.discount || 0), {})}</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>`;

const newTable = `<table className="w-full text-left mb-8 border-collapse">
                     <thead className="bg-indigo-50 border-b border-indigo-100 text-indigo-900 text-[11px] uppercase tracking-wider">
                         <tr>
                             <th className="py-2 px-2 font-bold text-center">SN</th>
                             <th className="py-2 px-2 font-bold">Item</th>
                             <th className="py-2 px-2 font-bold">Description</th>
                             <th className="py-2 px-2 font-bold text-center">Brand</th>
                             <th className="py-2 px-2 font-bold text-center">Warranty</th>
                             <th className="py-2 px-2 font-bold text-center">Quantity</th>
                             <th className="py-2 px-2 font-bold text-center">Unit</th>
                             <th className="py-2 px-2 font-bold text-right">Discount</th>
                             <th className="py-2 px-2 font-bold text-right">Price</th>
                             <th className="py-2 px-2 font-bold text-right">Total</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 text-[12px]">
                         {formData.items.map((item, idx) => (
                             <tr key={idx}>
                                 <td className="py-2 px-2 text-center">{idx + 1}</td>
                                 <td className="py-2 px-2">
                                    <div className="font-medium text-gray-900 line-clamp-2" title={item.name}>{item.name}</div>
                                    {(item as any).isCustomService && <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded mt-1 inline-block">Custom</span>}
                                 </td>
                                 <td className="py-2 px-2">
                                    <div className="text-gray-600 line-clamp-2" title={item.description || '-'}>{item.description || '-'}</div>
                                 </td>
                                 <td className="py-2 px-2 text-center">{item.brand || '-'}</td>
                                 <td className="py-2 px-2 text-center">{(item as any).warrantyMonths ? ((item as any).warrantyMonths > 12 ? \`\${(item as any).warrantyMonths / 12} Yrs\` : \`\${(item as any).warrantyMonths} Mos\`) : ((item as any).specs?.Warranty || '-')}</td>
                                 <td className="py-2 px-2 text-center">{item.quantity}</td>
                                 <td className="py-2 px-2 text-center">Pcs</td>
                                 <td className="py-2 px-2 text-right font-mono">{formatCurrency(item.discount || 0, {})}</td>
                                 <td className="py-2 px-2 text-right font-mono">{formatCurrency(item.price, {})}</td>
                                 <td className="py-2 px-2 text-right font-mono font-bold text-gray-700">{formatCurrency((item.price * item.quantity) - (item.discount || 0), {})}</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>`;

code = code.replace(oldTable, newTable);
fs.writeFileSync('src/components/QuotationManager.tsx', code);
console.log('Fixed QuotationManager.tsx table');
