const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('../../firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
    const snap = await getDocs(collection(db, 'products'));
    snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.costPrice > 100000 || data.price > 100000) {
            console.log(`Product: ${data.name}, ID: ${doc.id}, CostPrice: ${data.costPrice}, Price: ${data.price}`);
        }
    });
    console.log("Done checking high cost products");
}
run();