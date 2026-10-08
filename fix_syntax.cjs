const fs = require('fs');
let c = fs.readFileSync('src/pages/shop/ProductDetails.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

// Find and replace the double curly brace expression
c = c.replace(/\{product\.specs && Object\.keys\(product\.specs\)\.length > 0 \? \(\s*\{product\.specs && Object\.keys\(product\.specs\)\.length > 0 \? \(/, '{product.specs && Object.keys(product.specs).length > 0 ? (');

fs.writeFileSync('src/pages/shop/ProductDetails.tsx', c.replace(/\n/g, nl));
console.log('Fixed syntax error');