const fs = require('fs');

const files = [
  'src/pages/shop/Home.tsx',
  'src/pages/shop/CategoryPage.tsx',
  'src/pages/shop/SearchPage.tsx',
  'src/pages/shop/PCBuilder.tsx',
  'src/components/navbars/EcommerceNavbar.tsx',
  'src/components/navbars/PCBuildNavbar.tsx',
  'src/components/QuotationManager.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace direct map to filter for showInStore
  code = code.replace(
    /(\.map\([^)]+\)\s*as\s*Product\[\];)/g,
    '$1\n        const filteredProducts = productsData.filter(p => p.showInStore !== false);\n        setProducts(filteredProducts);'
  );
  
  // Custom manual replacements for specific files
  
  if (file.includes('Home.tsx')) {
    code = code.replace(
      /const productsData = querySnapshot\.docs\.map\(\(doc\) => \(\{\n\s*id: doc\.id,\n\s*\.\.\.doc\.data\(\),\n\s*\}\)\) as Product\[\];\n\s*setProducts\(productsData\);/,
      `const productsData = querySnapshot.docs.map((doc) => ({\n          id: doc.id,\n          ...doc.data(),\n        })) as Product[];\n        setProducts(productsData.filter(p => p.showInStore !== false));`
    );
  }
  
  if (file.includes('CategoryPage.tsx')) {
    code = code.replace(
      /setProducts\(querySnapshot\.docs\.map\(doc => \(\{ id: doc\.id, \.\.\.doc\.data\(\) \}\) as Product\)\);/,
      `setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product).filter(p => p.showInStore !== false));`
    );
  }

  if (file.includes('SearchPage.tsx')) {
    code = code.replace(
      /const results = querySnapshot\.docs\.map\(doc => \(\{\n\s*id: doc\.id,\n\s*\.\.\.doc\.data\(\)\n\s*\}\) as Product\);/,
      `const results = querySnapshot.docs.map(doc => ({\n          id: doc.id,\n          ...doc.data()\n        }) as Product).filter(p => p.showInStore !== false);`
    );
  }

  if (file.includes('PCBuilder.tsx')) {
    code = code.replace(
      /setProducts\(querySnapshot\.docs\.map\(doc => \(\{ id: doc\.id, \.\.\.doc\.data\(\) \}\) as Product\)\);/,
      `setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product).filter(p => p.showInStore !== false));`
    );
  }

  fs.writeFileSync(file, code);
}

console.log('Fixed files');
