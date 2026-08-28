const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');

// 1. Initial State
content = content.replace(
  /const \[quickProductData, setQuickProductData\] = useState\(\{ name: '', model: '', category: '', costPrice: 0, price: 0, stock: 0 \}\);/g,
  "const [quickProductData, setQuickProductData] = useState({ name: '', model: '', category: '', costPrice: 0, price: 0, stock: 0, hasWarranty: false, warrantyMonths: 0 });"
);

// 2. addDoc payload
content = content.replace(
  /stock: quickProductData.stock \|\| 0,/g,
  "stock: quickProductData.stock || 0,\n          warrantyMonths: quickProductData.hasWarranty ? (quickProductData.warrantyMonths || 12) : 0,"
);

// 3. Reset after submit
content = content.replace(
  /setQuickProductData\(\{ name: '', model: '', category: '', costPrice: 0, price: 0, stock: 0 \}\);/g,
  "setQuickProductData({ name: '', model: '', category: '', costPrice: 0, price: 0, stock: 0, hasWarranty: false, warrantyMonths: 0 });"
);

// 4. Form inputs (adding warranty block before buttons)
const targetForm = `<div className="flex gap-2">
                        <button type="submit"`;
const replacementForm = `<div className="flex items-center justify-between bg-white p-2 border border-gray-200 rounded-lg">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={quickProductData.hasWarranty} onChange={e => setQuickProductData({...quickProductData, hasWarranty: e.target.checked})} className="rounded text-green-600 focus:ring-green-500 w-3 h-3" />
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
                        <button type="submit"`;
content = content.replace(targetForm, replacementForm);

fs.writeFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', content, 'utf8');
console.log("Updated Purchases.tsx with Warranty UI");
