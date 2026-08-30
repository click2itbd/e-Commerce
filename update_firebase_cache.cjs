const fs = require('fs');

let fbFile = 'src/firebase.ts';
let fbContent = fs.readFileSync(fbFile, 'utf8');

// Replace the old initializeFirestore + enableIndexedDbPersistence
fbContent = fbContent.replace(
  "import { initializeFirestore, enableIndexedDbPersistence } from 'firebase/firestore';",
  "import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';"
);

// We need to replace the exact initialization block
let oldInit = `export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId); 

try {
  if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch(() => {});
  }
} catch (err) {}`;

let newInit = `export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: typeof window !== 'undefined' ? persistentLocalCache({ tabManager: persistentMultipleTabManager() }) : undefined
}, firebaseConfig.firestoreDatabaseId);`;

fbContent = fbContent.replace(oldInit, newInit);

// Just in case exact string replacement fails due to whitespace:
if (fbContent.includes('enableIndexedDbPersistence')) {
  fbContent = fbContent.replace(/export const db = initializeFirestore[\s\S]*?} catch \(err\) {}/m, newInit);
}

fs.writeFileSync(fbFile, fbContent, 'utf8');
