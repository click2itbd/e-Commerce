const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, limit } = require('firebase/firestore');
const firebaseConfig = require('./firebase-applet-config.json');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const snap = await getDocs(query(collection(db, 'products'), limit(5)));
  snap.forEach(d => {
    const data = d.data();
    console.log({
      name: data.name,
      hasShortDesc: !!data.shortDescription,
      shortDesc: data.shortDescription,
      hasDesc: !!data.description
    });
  });
}
check().catch(console.error);
