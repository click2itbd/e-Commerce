const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

const theadIdx = code.indexOf('<table className="w-full text-left mb-8 border-collapse">');
if (theadIdx !== -1) {
    const tableEndIdx = code.indexOf('</table>', theadIdx) + '</table>'.length;
    const oldTable = code.substring(theadIdx, tableEndIdx);

    const replacement = `                 <table className="w-full text-left mb-8 border-collapse">
                     <thead className="bg-indigo-50 border-b border-indigo-100 text-indigo-900 text-xs">
                         <tr>
                             <th className="py-3 px-2 font-bold text-center">S.N.</th>
                             <th className="py-3 px-2 font-bold">Item</th>
                             <th className="py-3 px-2 font-bold">Description</th>
                             <th className="py-3 px-2 font-bold text-center">Brand</th>
                             <th className="py-3 px-2 font-bold text-center">Warranty</th>
                             <th className="py-3 px-2 font-bold text-center">Quantity</th>
                             <th className="py-3 px-2 font-bold text-center">Unit</th>
                             <th className="py-3 px-2 font-bold text-right">Discount</th>
                             <th className="py-3 px-2 font-bold text-right">Price</th>
                             <th className="py-3 px-2 font-bold text-right">Total</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 text-xs">
                         {formData.items.map((item, idx) => {
                             let warranty = "-";
                             if ((item as any).warrantyMonths) {
                               warranty = (item as any).warrantyMonths > 12 ? \`\${(item as any).warrantyMonths / 12} Yrs\` : \`\${(item as any).warrantyMonths} Mos\`;
                             } else if ((item as any).specs?.Warranty) {
                               warranty = (item as any).specs.Warranty;
                             } else if ((item as any).warranty) {
                               warranty = (item as any).warranty;
                             }
                             
                             return (
                             <tr key={idx}>
                                 <td className="py-3 px-2 text-center text-gray-600">{idx + 1}</td>
                                 <td className="py-3 px-2">
                                    <div className="font-medium text-gray-900">{item.name}</div>
                                    {(item as any).isCustomService && <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded">Custom</span>}
                                 </td>
                                 <td className="py-3 px-2 text-gray-600">{item.description || "-"}</td>
                                 <td className="py-3 px-2 text-center text-gray-600">{(item as any).brand || "-"}</td>
                                 <td className="py-3 px-2 text-center text-gray-600">{warranty}</td>
                                 <td className="py-3 px-2 text-center font-mono">{item.quantity}</td>
                                 <td className="py-3 px-2 text-center text-gray-600">pcs</td>
                                 <td className="py-3 px-2 text-right font-mono">{formatCurrency(item.discount || 0, {})}</td>
                                 <td className="py-3 px-2 text-right font-mono">{formatCurrency(item.price, {})}</td>
                                 <td className="py-3 px-2 text-right font-mono font-bold text-gray-700">{formatCurrency((item.price * item.quantity), {})}</td>
                             </tr>
                         )})}
                     </tbody>
                 </table>`;

    code = code.replace(oldTable, replacement);
    fs.writeFileSync('src/components/QuotationManager.tsx', code);
    console.log('Successfully replaced table by index in QM View');
} else {
    console.log('Table not found');
}
