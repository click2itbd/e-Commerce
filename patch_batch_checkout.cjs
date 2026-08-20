const fs = require('fs');

let content = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');

if (!content.includes('writeBatch')) {
    content = content.replace("import { collection, addDoc } from 'firebase/firestore';", "import { collection, addDoc, doc, writeBatch } from 'firebase/firestore';");
}

const matchRegex = /const docRef = await addDoc\(collection\(db, 'orders'\), orderData\);[\s\S]*?\/\/ Only clear cart and show success if not redirecting to a payment gateway/;
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
          domain,
          tld,
          userId: currentUserId,
          orderId: newOrderRef.id,
          status: 'pending',
          years: domainItem.termYears || 1,
          autoRenew: false,
          nameservers: [],
          price: domainItem.price,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      for (const hostingItem of hostingItems) {
        const hAccountRef = doc(collection(db, 'hostingAccounts'));
        batch.set(hAccountRef, {
          userId: currentUserId,
          orderId: newOrderRef.id,
          planId: hostingItem.id.replace('hosting_', ''),
          provider: 'dummy',
          status: 'pending',
          billingCycle: hostingItem.billingCycle || 'monthly',
          autoRenew: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      await batch.commit();
      
      // Update docRef for payment initiation logic below
      const docRef = newOrderRef;

      // Only clear cart and show success if not redirecting to a payment gateway`;
      
    content = content.replace(match[0], newLogic);
    fs.writeFileSync('src/pages/Checkout.tsx', content, 'utf8');
    console.log('Patched Checkout.tsx');
} else {
    console.log('Could not match logic in Checkout.tsx');
}
