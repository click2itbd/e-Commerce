const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const firebaseConfig = require('./firebase-applet-config.json');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkMenus() {
  const snap = await getDocs(collection(db, 'menus'));
  snap.forEach(d => {
    const data = d.data();
    const subsWithSubSubs = (data.subCategories || []).filter(s => s.subCategories && s.subCategories.length > 0);
    console.log(`Menu: ${data.name} (subs: ${(data.subCategories || []).length}, with sub-subs: ${subsWithSubSubs.length})`);
    subsWithSubSubs.forEach(s => {
      console.log(`  Sub: ${s.name} -> SubSubs:`, s.subCategories.map(ss => ss.name));
    });
  });
}
checkMenus().catch(console.error);
