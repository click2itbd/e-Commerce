const fs = require('fs');

// 1. types.ts - add isOutOfStock field
let types = fs.readFileSync('src/types.ts', 'utf8');
types = types.replace(
  '  stock: number;\r\n  images: string[];',
  '  stock: number;\r\n  isOutOfStock?: boolean;\r\n  images: string[];'
);
if (!types.includes('isOutOfStock')) {
  types = types.replace(
    '  stock: number;\n  images: string[];',
    '  stock: number;\n  isOutOfStock?: boolean;\n  images: string[];'
  );
}
fs.writeFileSync('src/types.ts', types, 'utf8');
console.log('1. types.ts updated');

// 2. ProductCard.tsx - change stock checks to isOutOfStock
let card = fs.readFileSync('src/components/ProductCard.tsx', 'utf8');
// "In Stock" badge
card = card.replace(/product\.stock\s*>\s*0\s*&&\s*\(\s*\n?\s*<span/g, '!product.isOutOfStock && (\n                <span');
// "Stock Out" overlay  
card = card.replace(/product\.stock\s*<=\s*0\s*&&\s*\(/g, 'product.isOutOfStock && (');
// disabled={product.stock <= 0} for buttons
card = card.replaceAll('disabled={product.stock <= 0}', 'disabled={product.isOutOfStock === true}');
// Stock Out text
card = card.replace(/>Stock Out</g, '>Out of Stock<');
fs.writeFileSync('src/components/ProductCard.tsx', card, 'utf8');
console.log('2. ProductCard.tsx updated');

// 3. ProductDetails.tsx - change stock checks to isOutOfStock
let details = fs.readFileSync('src/pages/shop/ProductDetails.tsx', 'utf8');
// Availability display: product.stock > 0 ? => !product.isOutOfStock ?
details = details.replace(/product\.stock\s*>\s*0\s*\?/g, '!product.isOutOfStock ?');
// disabled={product.stock <= 0}
details = details.replaceAll('disabled={product.stock <= 0}', 'disabled={product.isOutOfStock === true}');
// disabled={quantity >= product.stock}
details = details.replace('disabled={quantity >= product.stock}', 'disabled={product.isOutOfStock === true}');
fs.writeFileSync('src/pages/shop/ProductDetails.tsx', details, 'utf8');
console.log('3. ProductDetails.tsx updated');

console.log('All 3 UI files updated successfully!');