const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', 'utf8');

// Remove duplicate declaration
content = content.replace(
  /const matchesModel = \(product\.model \|\| ''\)\.toLowerCase\(\)\.includes\(q\);\r?\n\s*const matchesModel = \(product\.model \|\| ''\)\.toLowerCase\(\)\.includes\(q\);/g,
  "const matchesModel = (product.model || '').toLowerCase().includes(q);"
);

// Fix the return condition
content = content.replace(
  /if \(\!matchesName && \!matchesCategory && \!matchesBrand\) return false;/g,
  "if (!matchesName && !matchesCategory && !matchesBrand && !matchesModel) return false;"
);

fs.writeFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', content, 'utf8');
console.log("Fixed SalesForm");
