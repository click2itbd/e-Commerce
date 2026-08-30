const fs = require('fs');
let file = 'src/pages/admin/tabs/purchase/Purchases.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update state
content = content.replace(
  "const [quickProductData, setQuickProductData] = useState({ name: '', model: '', category: '', costPrice: 0, price: 0, stock: 0, hasWarranty: false, warrantyMonths: 0 });",
  "const [quickProductData, setQuickProductData] = useState({ name: '', sku: '', model: '', category: '', costPrice: 0, price: 0, stock: 0, hasWarranty: false, warrantyMonths: 0 });"
);

// Update payload
content = content.replace(
  "model: quickProductData.model || '',",
  "model: quickProductData.model || '',\n          sku: quickProductData.sku || '',"
);

// Update reset
content = content.replace(
  "setQuickProductData({ name: '', model: '', category: '', costPrice: 0, price: 0, stock: 0, hasWarranty: false, warrantyMonths: 0 });",
  "setQuickProductData({ name: '', sku: '', model: '', category: '', costPrice: 0, price: 0, stock: 0, hasWarranty: false, warrantyMonths: 0 });"
);
content = content.replace(
  "setQuickProductData({ name: '', model: '', category: '', costPrice: 0, price: 0, stock: 0, hasWarranty: false, warrantyMonths: 0 });",
  "setQuickProductData({ name: '', sku: '', model: '', category: '', costPrice: 0, price: 0, stock: 0, hasWarranty: false, warrantyMonths: 0 });"
);

// Add SKU input to form
const modelInput = `<input type="text" placeholder="Model Number (Optional)" value={quickProductData.model || ''} onChange={e => setQuickProductData({...quickProductData, model: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-green-200" />`;
const skuInput = `<input type="text" placeholder="Scan Global Barcode / SKU (Optional)" value={quickProductData.sku || ''} onChange={e => setQuickProductData({...quickProductData, sku: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-green-200" />`;

content = content.replace(modelInput, modelInput + '\n                      ' + skuInput);

fs.writeFileSync(file, content, 'utf8');
