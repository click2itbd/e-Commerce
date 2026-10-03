const fs = require('fs');
const files = [
  'src/pages/shop/Home.tsx',
  'src/pages/shop/CategoryPage.tsx',
  'src/pages/shop/SearchPage.tsx',
  'src/pages/shop/PCBuilder.tsx',
  'src/components/navbars/EcommerceNavbar.tsx',
  'src/components/navbars/PCBuildNavbar.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, 'utf8');
  
  // Basically anywhere we assign to products from a querySnapshot
  
  // Home.tsx
  code = code.replace(/setProducts\(productsData\);/g, 'setProducts(productsData.filter(p => p.showInStore !== false));');
  
  // CategoryPage.tsx and PCBuilder.tsx
  code = code.replace(/setProducts\(\s*querySnapshot\.docs\.map\(\(doc\)\s*=>\s*\(\{\s*id:\s*doc\.id,\s*\.\.\.doc\.data\(\)\s*\}\)\s*as\s*Product\)\s*\);/g, 'setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product).filter(p => p.showInStore !== false));');
  
  code = code.replace(/setProducts\(\s*querySnapshot\.docs\.map\(doc\s*=>\s*\(\{\s*id:\s*doc\.id,\s*\.\.\.doc\.data\(\)\s*\}\)\s*as\s*Product\)\s*\);/g, 'setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product).filter(p => p.showInStore !== false));');

  // SearchPage.tsx
  code = code.replace(/const results = querySnapshot\.docs\.map\(doc => \(\{[\s\S]*?\}\) as Product\);/g, 'const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product).filter(p => p.showInStore !== false);');
  
  // EcommerceNavbar.tsx and PCBuildNavbar.tsx
  code = code.replace(/const allProducts = [a-zA-Z]+\.docs\.map\(doc => \(\{ id: doc\.id, \.\.\.doc\.data\(\) \}\) as Product\);/g, 'const allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product).filter(p => p.showInStore !== false);');

  fs.writeFileSync(file, code);
  console.log(`Updated ${file}`);
}
