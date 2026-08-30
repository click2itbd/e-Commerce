const fs = require('fs');

let fbFile = 'src/firebase.ts';
let fbContent = fs.readFileSync(fbFile, 'utf8');

if (!fbContent.includes('enableIndexedDbPersistence')) {
  fbContent = fbContent.replace(
    "import { initializeFirestore } from 'firebase/firestore';",
    "import { initializeFirestore, enableIndexedDbPersistence } from 'firebase/firestore';"
  );
  
  fbContent = fbContent.replace(
    "export const db = initializeFirestore(app, {\n  experimentalForceLongPolling: true,\n}, firebaseConfig.firestoreDatabaseId);",
    "export const db = initializeFirestore(app, {\n  experimentalForceLongPolling: true,\n}, firebaseConfig.firestoreDatabaseId);\n\ntry {\n  enableIndexedDbPersistence(db).catch(() => {});\n} catch(err) {}\n"
  );
  
  fs.writeFileSync(fbFile, fbContent, 'utf8');
}

