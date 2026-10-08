const fs = require('fs');
let c = fs.readFileSync('src/pages/shop/CategoryPage.tsx', 'utf8');

c = c.replace(/const \[showOutOfStock, setShowOutOfStock\] = useState\(true\);/, 'const [showOutOfStock, setShowOutOfStock] = useState(false);');

c = c.replace(/setShowOutOfStock\(true\);/, 'setShowOutOfStock(false);');

fs.writeFileSync('src/pages/shop/CategoryPage.tsx', c);
console.log('Fixed Out of Stock default state');