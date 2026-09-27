const fs = require('fs');
let cart = fs.readFileSync('src/context/CartContext.tsx', 'utf8');

// Replace standard price with discountPrice logic in processedItems
const processedTarget = `const processedItems = items.map(item => ({ ...item }));`;
const processedReplacement = `const processedItems = items.map(item => {
      const finalPrice = item.discountPrice && item.discountPrice < item.price ? item.discountPrice : item.price;
      return { 
        ...item, 
        originalPrice: item.price !== finalPrice ? item.price : undefined, 
        price: finalPrice 
      };
    });`;

if (cart.includes(processedTarget)) {
    cart = cart.replace(processedTarget, processedReplacement);
    fs.writeFileSync('src/context/CartContext.tsx', cart, 'utf8');
    console.log('Fixed Cart discount bug');
} else {
    console.log('Target not found or already fixed');
}