const fs = require('fs');

function fix(file, from, to) {
  if (fs.existsSync(file)) {
    let c = fs.readFileSync(file, 'utf8');
    c = c.replace(from, to);
    fs.writeFileSync(file, c);
  }
}

fix('src/pages/shop/SearchPage.tsx', 
    'let productsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];', 
    'let productsData = (snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]).filter(p => p.showInStore !== false);');

fix('src/pages/shop/PCBuilder.tsx', 
    'const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];', 
    'const productsData = (querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]).filter(p => p.showInStore !== false);');

fix('src/components/navbars/EcommerceNavbar.tsx', 
    'const allProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];', 
    'const allProducts = (snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]).filter(p => p.showInStore !== false);');

fix('src/components/navbars/PCBuildNavbar.tsx', 
    'const allProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];', 
    'const allProducts = (snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]).filter(p => p.showInStore !== false);');

console.log('Fixed');
