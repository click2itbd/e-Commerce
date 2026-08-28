const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/admin/POS/index.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add model search
content = content.replace(
  `const matchesCategory = (p.category || '').toLowerCase().includes(q);`,
  `const matchesCategory = (p.category || '').toLowerCase().includes(q);\n      const matchesModel = (p.model || '').toLowerCase().includes(q);`
);
content = content.replace(
  `return matchesName || matchesCategory || matchesBrand;`,
  `return matchesName || matchesCategory || matchesBrand || matchesModel;`
);

// 2. Add saleSource state
content = content.replace(
  `const [receivedAmount, setReceivedAmount] = useState<number | ''>('');`,
  `const [receivedAmount, setReceivedAmount] = useState<number | ''>('');\n  const [saleSource, setSaleSource] = useState<'in_store'|'online'>('in_store');`
);

// 3. Add saleSource to orderData
content = content.replace(
  `type: 'pos_sale',`,
  `type: 'pos_sale',\n        saleSource,`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Updated POS/index.tsx search and data');
