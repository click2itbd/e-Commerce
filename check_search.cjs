const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');
const firebaseConfig = require('./firebase-applet-config.json');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkSearchData() {
  try {
    const q = query(collection(db, 'search_analytics'), limit(5));
    const snap = await getDocs(q);
    console.log('search_analytics docs:', snap.size);
  } catch(e) {
    console.log('search_analytics error:', e.message);
  }
}
checkSearchData().catch(console.error);
