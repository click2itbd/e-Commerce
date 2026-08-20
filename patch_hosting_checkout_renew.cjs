const fs = require('fs');

let content = fs.readFileSync('src/pages/hosting/HostingCheckout.tsx', 'utf8');

const regex = /const domainItems = items\.filter\(item => item\.itemType === 'domain'\);/;

if (content.match(regex) && !content.includes('domain_renewal')) {
    const newItemsFilter = `
      const domainItems = items.filter(item => item.itemType === 'domain');
      const renewalItems = items.filter(item => item.itemType === 'domain_renewal');
`;
    content = content.replace(regex, newItemsFilter);
    
    // Now inject the loop for renewalItems
    const renewalLoop = `
      for (const rItem of renewalItems) {
        const dOrderRef = doc(collection(db, 'domainOrders'));
        batch.set(dOrderRef, {
          userId: user?.uid || 'guest',
          orderId: newOrderRef.id,
          domain: rItem.domain,
          tld: rItem.domain.split('.').pop() || '',
          termYears: rItem.termYears || 1,
          price: rItem.price,
          status: 'pending',
          action: 'renewal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
`;
    content = content.replace("for (const hostingItem of hostingItems) {", renewalLoop + "\n      for (const hostingItem of hostingItems) {");
    
    fs.writeFileSync('src/pages/hosting/HostingCheckout.tsx', content, 'utf8');
    console.log('Patched HostingCheckout for renewals');
}
