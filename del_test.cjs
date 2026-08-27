const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, deleteDoc, doc } = require('firebase/firestore');

const firebaseConfig = require('./firebase-applet-config.json');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function findAndDelete() {
    const txRef = collection(db, 'transactions');
    const q = query(txRef);
    const snap = await getDocs(q);
    
    let deleted = 0;
    for (let docSnap of snap.docs) {
        let data = docSnap.data();
        if (data.description && (
            data.description.includes('invoice-00006') || 
            data.description.includes('invoice-00007') ||
            data.description.includes('invoice-00008') ||
            data.description.includes('INV-00056')
        )) {
            console.log('Deleting tx:', data.description, data.amount);
            await deleteDoc(docSnap.ref);
            deleted++;
        }
    }
    
    const ordersRef = collection(db, 'orders');
    const orderSnap = await getDocs(ordersRef);
    for (let docSnap of orderSnap.docs) {
        let data = docSnap.data();
        if (data.documentNumber && (
            data.documentNumber.includes('invoice-00006') || 
            data.documentNumber.includes('invoice-00007') ||
            data.documentNumber.includes('invoice-00008') ||
            data.documentNumber.includes('INV-00056')
        )) {
            console.log('Deleting order:', data.documentNumber);
            await deleteDoc(docSnap.ref);
            deleted++;
        }
    }
    console.log('Total deleted:', deleted);
}

findAndDelete().catch(console.error);
