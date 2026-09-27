const fs = require('fs');
let home = fs.readFileSync('src/pages/shop/Home.tsx', 'utf8');

home = home.replace('products.slice(0, 12).map', 'products.slice(0, 16).map');

fs.writeFileSync('src/pages/shop/Home.tsx', home, 'utf8');
console.log('Fixed Featured Products limit to 16');