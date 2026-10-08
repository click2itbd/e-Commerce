const fs = require('fs');
let c = fs.readFileSync('src/pages/shop/ProductDetails.tsx', 'utf8');

c = c.replace(/const otherGroup = \{ title: 'Main Features', items: \[\] as \[string, any\]\[\] \};/, "const otherGroup = { title: 'Main Features', items: [] as [string, any][] };");

c = c.replace(/return \[otherGroup, \.\.\.groups\]\.filter\(g => g\.items\.length > 0\);/, "return [...groups, otherGroup].filter(g => g.items.length > 0);");

fs.writeFileSync('src/pages/shop/ProductDetails.tsx', c);
console.log('Fixed group order');