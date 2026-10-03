const fs = require('fs');

const file = 'src/pages/shop/ProductDetails.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'const allProds = pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product);',
  'const allProds = (pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]).filter(p => p.showInStore !== false);'
);

// If product itself has showInStore === false, we could redirect or show "product not found" but that's optional. The user just asked to hide from the website.

fs.writeFileSync(file, code);
console.log('Fixed ProductDetails');
