import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const apiKeysRef = doc(db, 'settings', 'api_keys');
  const pubRef = doc(db, 'settings', 'public_config');
  const snap = await getDoc(apiKeysRef);
  if(snap.exists()) {
    const data = snap.data();
    if(data.usdToBdtRate) {
       await setDoc(pubRef, { usdToBdtRate: data.usdToBdtRate }, { merge: true });
       // Can't easily delete field from client without auth unless rules allow, which they do temporarily
       // wait, api_keys now has `allow read, write: if false;`
       // This script will fail!
    }
  }
}
run();
