const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function check() {
  const transSnap = await db.collection('transactions').get();
  console.log('Transactions count:', transSnap.size);
  if(transSnap.size > 0) {
     console.log('First transaction:', transSnap.docs[0].data());
  }

  const purchSnap = await db.collection('purchases').get();
  console.log('Purchases count:', purchSnap.size);

  const ordersSnap = await db.collection('orders').get();
  console.log('Orders count:', ordersSnap.size);
}
check();
