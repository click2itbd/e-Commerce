const fs = require('fs');
let code = fs.readFileSync('src/pages/hosting/HostingCheckout.tsx', 'utf8');

const sslLogic = `
      const sslItems = items.filter(item => item.itemType === 'ssl');
      for (const sslItem of sslItems) {
        const sOrderRef = doc(collection(db, 'sslOrders'));
        batch.set(sOrderRef, {
          userId: user?.uid || 'guest',
          orderId: newOrderRef.id,
          productId: sslItem.id.split('_')[0] + '_' + sslItem.id.split('_')[1], // e.g. ssl_positive
          name: sslItem.name,
          termYears: sslItem.termYears || 1,
          price: sslItem.price,
          status: 'pending_configuration', // User needs to enter CSR later
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
`;

if (!code.includes('const sslItems')) {
  code = code.replace(
    'const domainItems = items.filter(item => item.itemType === \'domain\');',
    sslLogic + '\n      const domainItems = items.filter(item => item.itemType === \'domain\');'
  );
  fs.writeFileSync('src/pages/hosting/HostingCheckout.tsx', code);
}
