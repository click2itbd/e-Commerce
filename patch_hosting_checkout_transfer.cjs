const fs = require('fs');
let content = fs.readFileSync('src/pages/hosting/HostingCheckout.tsx', 'utf8');

const regex = /const renewalItems = items\.filter\(item => item\.itemType === 'domain_renewal'\);/;

if (content.match(regex) && !content.includes('domain_transfer')) {
    const transferFilter = `
      const renewalItems = items.filter(item => item.itemType === 'domain_renewal');
      const transferItems = items.filter(item => item.itemType === 'domain_transfer');
`;
    content = content.replace(regex, transferFilter);
    
    // Inject the loop for transferItems
    const transferLoop = `
      for (const tItem of transferItems) {
        const dOrderRef = doc(collection(db, 'domainOrders'));
        batch.set(dOrderRef, {
          userId: user?.uid || 'guest',
          orderId: newOrderRef.id,
          domain: tItem.domain || tItem.id.replace('domain_transfer_', ''),
          tld: (tItem.domain || tItem.id.replace('domain_transfer_', '')).split('.').pop() || '',
          termYears: tItem.termYears || 1,
          price: tItem.price,
          status: 'pending',
          action: 'transfer',
          authCode: tItem.authCode || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
`;
    content = content.replace("for (const hostingItem of hostingItems) {", transferLoop + "\n      for (const hostingItem of hostingItems) {");
    
    fs.writeFileSync('src/pages/hosting/HostingCheckout.tsx', content, 'utf8');
    console.log('Patched HostingCheckout for domain transfers');
}
