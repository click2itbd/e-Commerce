const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function checkQuotes() {
  const qSnap = await db.collection('orders').where('type', '==', 'quotation').get();
  qSnap.forEach(doc => {
    console.log(doc.id, doc.data().documentNumber);
    doc.data().items.forEach(item => {
      if (item.warranty === "3") {
        console.log("  Found item with warranty '3':", item.name);
      }
    });
  });
}
checkQuotes();
