const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');

// 1. Initial State
content = content.replace(
  /const \[quickProductData, setQuickProductData\] = useState\(\{ name: '', category: '', costPrice: 0, price: 0, stock: 0 \}\);/,
  "const [quickProductData, setQuickProductData] = useState({ name: '', model: '', category: '', costPrice: 0, price: 0, stock: 0 });"
);

// 2. addDoc payload
content = content.replace(
  /const productData = \{\s*name: trimmed,\s*category: quickProductData.category,/s,
  "const productData = {\n          name: trimmed,\n          model: quickProductData.model || '',\n          category: quickProductData.category,"
);

// 3. Reset after submit
content = content.replace(
  /setQuickProductData\(\{ name: '', category: '', costPrice: 0, price: 0, stock: 0 \}\);/g,
  "setQuickProductData({ name: '', model: '', category: '', costPrice: 0, price: 0, stock: 0 });"
);

// 4. Form inputs (adding model input next to name)
const targetForm = `<input type="text" placeholder="Product Name *" autoFocus value={quickProductData.name} onChange={e => setQuickProductData({...quickProductData, name: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-green-200" />
                      <select value={quickProductData.category}`;
const replacementForm = `<input type="text" placeholder="Product Name *" autoFocus value={quickProductData.name} onChange={e => setQuickProductData({...quickProductData, name: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-green-200" />
                      <input type="text" placeholder="Model Number (Optional)" value={quickProductData.model || ''} onChange={e => setQuickProductData({...quickProductData, model: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-green-200" />
                      <select value={quickProductData.category}`;
content = content.replace(targetForm, replacementForm);

// 5. Update purchase form search
const targetSearch = `const matchesName = product.name.toLowerCase().includes(q);`;
const replacementSearch = `const matchesName = product.name.toLowerCase().includes(q) || (product.model || '').toLowerCase().includes(q);`;
content = content.replace(targetSearch, replacementSearch);

fs.writeFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', content, 'utf8');
console.log("Updated Purchases.tsx");
