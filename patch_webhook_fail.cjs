const fs = require('fs');

let content = fs.readFileSync('functions/index.js', 'utf8');

const webhookFailLogic = `
    if (status === "success") {
      // (existing code will be kept)
`;

const failureBlock = `
    } else {
      // Payment Failed or Cancelled - Mark order as failed!
      let targetRef = admin.firestore().collection("orders").doc(orderId);
      let docSnap = await targetRef.get();

      if (!docSnap.exists) {
        targetRef = admin.firestore().collection("invoices").doc(orderId);
        docSnap = await targetRef.get();
      }

      if (docSnap.exists) {
        await targetRef.update({
          status: "cancelled",
          paymentStatus: "failed",
          paymentCompletedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Also mark domainOrders as failed
        const dOrdersSnap = await admin.firestore().collection('domainOrders')
          .where('orderId', '==', orderId)
          .get();
          
        if (!dOrdersSnap.empty) {
          const batch = admin.firestore().batch();
          dOrdersSnap.docs.forEach(doc => {
            batch.update(doc.ref, { status: 'failed' });
          });
          await batch.commit();
        }
      }

      return res.status(200).send({ message: "Payment failed status updated successfully" });
    }
`;

content = content.replace(/\} else \{\s*return res\.status\(200\)\.send\(\{ message: "Payment was not successful or cancelled" \}\);\s*\}/, failureBlock.trim());

fs.writeFileSync('functions/index.js', content, 'utf8');
console.log('Patched webhook failure logic');
