const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', 'utf8');

const target = `const matchesBrand = (product.brand || '').toLowerCase().includes(q);`;
const replacement = `const matchesBrand = (product.brand || '').toLowerCase().includes(q);
      const matchesModel = (product.model || '').toLowerCase().includes(q);`;

const targetReturn = `return matchesName || matchesCategory || matchesBrand;`;
const replacementReturn = `return matchesName || matchesCategory || matchesBrand || matchesModel;`;

content = content.replace(target, replacement);
content = content.replace(targetReturn, replacementReturn);

fs.writeFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', content, 'utf8');
console.log("Updated SalesForm search with model");
