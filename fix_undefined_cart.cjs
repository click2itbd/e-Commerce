const fs = require('fs');
let cartCtx = fs.readFileSync('src/context/CartContext.tsx', 'utf8');

cartCtx = cartCtx.replace(
    'originalPrice: item.price !== finalPrice ? item.price : undefined,',
    'originalPrice: item.price !== finalPrice ? item.price : null,'
);

fs.writeFileSync('src/context/CartContext.tsx', cartCtx, 'utf8');
console.log('Fixed undefined originalPrice in CartContext.tsx');