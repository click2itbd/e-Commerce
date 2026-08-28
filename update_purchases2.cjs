const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');

const regex = /<input type="text" placeholder="Product Name \*" autoFocus value=\{quickProductData\.name\} onChange=\{e => setQuickProductData\(\{\.\.\.quickProductData, name: e\.target\.value\}\)\} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-green-200" \/>/m;

if (regex.test(content)) {
  content = content.replace(regex, match => {
    return match + `\n                      <input type="text" placeholder="Model Number (Optional)" value={quickProductData.model || ''} onChange={e => setQuickProductData({...quickProductData, model: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-green-200" />`;
  });
  fs.writeFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', content, 'utf8');
  console.log("SUCCESS: Replaced Purchases Form");
} else {
  console.log("FAILED to find Product Name input in Purchases.tsx");
}
