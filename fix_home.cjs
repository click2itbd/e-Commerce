const fs = require('fs');
let code = fs.readFileSync('src/pages/shop/Home.tsx', 'utf8');
code = code.replace(
  'const productsData = querySnapshot.docs.map((doc) => ({',
  'const productsData = querySnapshot.docs.map((doc) => ({\n        id: doc.id,\n        ...doc.data(),\n      }) as Product).filter(p => p.showInStore !== false);\n      // @ts-ignore'
);
fs.writeFileSync('src/pages/shop/Home.tsx', code);
console.log('Fixed Home.tsx');
