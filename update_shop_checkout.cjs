const fs = require('fs');
let code = fs.readFileSync('src/pages/shop/Checkout.tsx', 'utf8');

const sslLogic = `
      const sslItems = items.filter(item => item.itemType === 'ssl');
      for (const sslItem of sslItems) {
        const sOrderRef = doc(collection(db, 'sslOrders'));
        batch.set(sOrderRef, {
          userId: user?.uid || 'guest',
          orderId: newOrderRef.id,
          productId: sslItem.id.split('_')[0] + '_' + sslItem.id.split('_')[1],
          name: sslItem.name,
          termYears: sslItem.termYears || 1,
          price: sslItem.price,
          status: 'pending_configuration',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
`;

if (!code.includes('const sslItems')) {
  // Wait, does Checkout.tsx have domainItems? Let's replace at hostingItems
  code = code.replace(
    /const hostingItems = items\.filter[\s\S]*?'hosting'\);/,
    `const hostingItems = items.filter(item => item.itemType === 'hosting');\n${sslLogic}`
  );
  fs.writeFileSync('src/pages/shop/Checkout.tsx', code);
}
