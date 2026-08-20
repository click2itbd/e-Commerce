const fs = require('fs');

let content = fs.readFileSync('src/pages/hosting/HostingCheckout.tsx', 'utf8');

if (!content.includes('writeBatch')) {
    content = content.replace("import { addDoc, collection, getDocs, doc, updateDoc }", "import { addDoc, collection, getDocs, doc, updateDoc, writeBatch }");
    content = content.replace("import { addDoc, collection, doc, getDocs, query, updateDoc, where }", "import { addDoc, collection, doc, getDocs, query, updateDoc, where, writeBatch }");
}

const matchRegex = /const docRef = await addDoc\(collection\(db, 'orders'\), orderData\);[\s\S]*?orderId = docRef\.id;/;
const match = content.match(matchRegex);

if (match) {
    const newLogic = `const batch = writeBatch(db);
      const newOrderRef = doc(collection(db, 'orders'));
      batch.set(newOrderRef, orderData);
      
      const domainItems = items.filter(item => item.itemType === 'domain');
      const hostingItems = items.filter(item => item.itemType === 'hosting');

      for (const domainItem of domainItems) {
        const domain = domainItem.id.replace('domain_', '');
        const tld = domainItem.domainTld || domain.split('.').pop() || '';
        const dOrderRef = doc(collection(db, 'domainOrders'));
        batch.set(dOrderRef, {
          userId: user?.uid || 'guest',
          orderId: newOrderRef.id,
          domain: domain,
          tld: tld,
          termYears: domainItem.termYears || 1,
          price: domainItem.price,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      for (const hostingItem of hostingItems) {
        const hAccountRef = doc(collection(db, 'hostingAccounts'));
        batch.set(hAccountRef, {
          userId: user?.uid || 'guest',
          orderId: newOrderRef.id,
          planId: hostingItem.id.replace('hosting_', ''),
          domain: hostingConfig.domain, // Associated domain
          provider: 'dummy',
          status: 'pending',
          billingCycle: hostingItem.billingCycle || 'monthly',
          autoRenew: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      await batch.commit();
      orderId = newOrderRef.id;`;
      
    content = content.replace(match[0], newLogic);
    fs.writeFileSync('src/pages/hosting/HostingCheckout.tsx', content, 'utf8');
    console.log('Patched HostingCheckout.tsx');
} else {
    console.log('Could not match logic in HostingCheckout.tsx');
}
