const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('../../firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
    const snap = await getDocs(collection(db, 'orders'));
    let totalCogs = 0;
    snap.docs.forEach(doc => {
        const data = doc.data();
        let orderCogs = 0;
        if (data.items) {
           data.items.forEach(i => {
              if (i.costPrice) orderCogs += Number(i.costPrice) * (i.quantity || 1);
              else if (i.purchasePrice) orderCogs += Number(i.purchasePrice) * (i.quantity || 1);
           });
        }
        if (data.totalCost) {
           orderCogs += Number(data.totalCost);
        }
        if (orderCogs > 100000 || data.totalCost > 100000) {
            console.log(`Order: ${doc.id}, totalCost: ${data.totalCost}, calculatedCogs: ${orderCogs}`);
        }
    });
    console.log("Done checking orders");
}
run();