const admin = require('firebase-admin');
const serviceAccount = require('./backend/firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function findAndDelete() {
    const txRef = db.collection('transactions');
    const snap = await txRef.get();
    
    let deleted = 0;
    for (let docSnap of snap.docs) {
        let data = docSnap.data();
        if (data.description && (
            data.description.includes('00006') || 
            data.description.includes('00007') ||
            data.description.includes('00008') ||
            data.description.includes('00056')
        )) {
            console.log('Deleting tx:', data.description, data.amount);
            await docSnap.ref.delete();
            deleted++;
        }
    }
    
    const ordersRef = db.collection('orders');
    const orderSnap = await ordersRef.get();
    for (let docSnap of orderSnap.docs) {
        let data = docSnap.data();
        if (data.documentNumber && (
            data.documentNumber.includes('00006') || 
            data.documentNumber.includes('00007') ||
            data.documentNumber.includes('00008') ||
            data.documentNumber.includes('00056')
        )) {
            console.log('Deleting order:', data.documentNumber);
            await docSnap.ref.delete();
            deleted++;
        }
    }
    console.log('Total deleted:', deleted);
}

findAndDelete().catch(console.error);
