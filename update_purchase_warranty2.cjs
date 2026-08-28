const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');

const targetFormRegex = /<div className="flex gap-2">\s*<button type="submit" className="flex-1 bg-green-600/;
const replacementForm = `<div className="flex items-center justify-between bg-white p-2 border border-gray-200 rounded-lg">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={quickProductData.hasWarranty || false} onChange={e => setQuickProductData({...quickProductData, hasWarranty: e.target.checked})} className="rounded text-green-600 focus:ring-green-500 w-3 h-3" />
                          <span className="text-[11px] font-bold text-gray-700">Warranty Included</span>
                        </label>
                        {quickProductData.hasWarranty && (
                          <div className="flex items-center gap-1">
                            <input type="number" min="1" value={quickProductData.warrantyMonths || ''} onChange={e => setQuickProductData({...quickProductData, warrantyMonths: Number(e.target.value)})} className="w-12 border border-gray-200 rounded px-1 py-0.5 text-[10px] font-bold text-center outline-none" placeholder="12" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Mos</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-green-600`;

content = content.replace(targetFormRegex, replacementForm);

fs.writeFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', content, 'utf8');
console.log("Updated Purchases.tsx with Warranty UI");
