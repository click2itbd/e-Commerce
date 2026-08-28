const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/admin/tabs/sales/SalesForm.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add model search
content = content.replace(
  `const matchesBrand = (product.brand || '').toLowerCase().includes(q);`,
  `const matchesBrand = (product.brand || '').toLowerCase().includes(q);\n      const matchesModel = (product.model || '').toLowerCase().includes(q);`
);
content = content.replace(
  `return matchesName || matchesCategory || matchesBrand;`,
  `return matchesName || matchesCategory || matchesBrand || matchesModel;`
);

// 2. Add model display in the product list
content = content.replace(
  `<h4 className="font-bold text-gray-800 line-clamp-1">{product.name}</h4>`,
  `<h4 className="font-bold text-gray-800 line-clamp-1">{product.name}</h4>\n                      {product.model && <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">Model: {product.model}</span>}`
);

// 3. Add saleSource to state
content = content.replace(
  `type: 'invoice' as 'invoice' | 'challan' | 'quotation',`,
  `type: 'invoice' as 'invoice' | 'challan' | 'quotation',\n    saleSource: 'in_store' as 'in_store' | 'online',`
);

// 4. Save saleSource to DB
content = content.replace(
  `type: saleData.type,`,
  `type: saleData.type,\n        saleSource: saleData.saleSource,`
);
content = content.replace(
  `paymentAccountId: paymentAccounts[0]?.id || '',`,
  `paymentAccountId: paymentAccounts[0]?.id || '',\n        saleSource: 'in_store',`
);

// 5. Add toggle to UI
const uiTarget = `<div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Document Type</label>`;
const uiReplacement = `<div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Sale Source</label>
                      <select
                        value={saleData.saleSource}
                        onChange={e => setSaleData({ ...saleData, saleSource: e.target.value as 'in_store' | 'online' })}
                        className="w-full border border-gray-200 rounded-lg p-2 font-bold text-gray-700 bg-gray-50 text-xs"
                      >
                        <option value="in_store">In-Store / POS</option>
                        <option value="online">Online Sale</option>
                      </select>
                    </div>\n                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Document Type</label>`;
content = content.replace(uiTarget, uiReplacement);

fs.writeFileSync(file, content, 'utf8');
console.log('Updated SalesForm.tsx');
