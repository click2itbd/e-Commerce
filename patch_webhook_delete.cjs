const fs = require('fs');

let content = fs.readFileSync('functions/index.js', 'utf8');

const failureBlock = `
    } else {
      // Payment Failed or Cancelled - DELETE the order!
      let targetRef = admin.firestore().collection("orders").doc(orderId);
      let docSnap = await targetRef.get();

      if (!docSnap.exists) {
        targetRef = admin.firestore().collection("invoices").doc(orderId);
        docSnap = await targetRef.get();
      }

      if (docSnap.exists) {
        await targetRef.delete();

        // Also delete domainOrders
        const dOrdersSnap = await admin.firestore().collection('domainOrders')
          .where('orderId', '==', orderId)
          .get();
          
        if (!dOrdersSnap.empty) {
          const batch = admin.firestore().batch();
          dOrdersSnap.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
        }

        // Also delete hostingAccounts
        const hAccountsSnap = await admin.firestore().collection('hostingAccounts')
          .where('orderId', '==', orderId)
          .get();
          
        if (!hAccountsSnap.empty) {
          const batch = admin.firestore().batch();
          hAccountsSnap.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
        }
      }

      return res.status(200).send({ message: "Order deleted successfully due to failed payment" });
    }
`;

content = content.replace(/\} else \{\s*\/\/ Payment Failed or Cancelled[\s\S]*?return res\.status\(200\)\.send\(\{ message: "Payment failed status updated successfully" \}\);\s*\}/, failureBlock.trim());

fs.writeFileSync('functions/index.js', content, 'utf8');
console.log('Patched webhook to delete failed orders');
