const fs = require('fs');

function replaceInFile(file, search, replace) {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  if (code.includes(search)) {
    code = code.replace(search, replace);
    fs.writeFileSync(file, code);
    console.log(`Replaced in ${file}`);
  } else {
    console.log(`Search string not found in ${file}`);
  }
}

// 1. Home.tsx
replaceInFile(
  'src/pages/shop/Home.tsx',
  `        })) as Product[];
        setProducts(productsData);`,
  `        })) as Product[];
        setProducts(productsData.filter(p => p.showInStore !== false));`
);

// 2. CategoryPage.tsx
replaceInFile(
  'src/pages/shop/CategoryPage.tsx',
  `        setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product));`,
  `        setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product).filter(p => p.showInStore !== false));`
);

// 3. SearchPage.tsx
replaceInFile(
  'src/pages/shop/SearchPage.tsx',
  `        const results = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }) as Product);`,
  `        const results = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }) as Product).filter(p => p.showInStore !== false);`
);

// 4. PCBuilder.tsx
replaceInFile(
  'src/pages/shop/PCBuilder.tsx',
  `        setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product));`,
  `        setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product).filter(p => p.showInStore !== false));`
);

// 5. EcommerceNavbar.tsx (Search)
replaceInFile(
  'src/components/navbars/EcommerceNavbar.tsx',
  `        const allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product);`,
  `        const allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product).filter(p => p.showInStore !== false);`
);

// 6. PCBuildNavbar.tsx (Search)
replaceInFile(
  'src/components/navbars/PCBuildNavbar.tsx',
  `        const allProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product);`,
  `        const allProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product).filter(p => p.showInStore !== false);`
);

