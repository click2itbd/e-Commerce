const fs = require('fs');

let fbFile = 'src/firebase.ts';
let fbContent = fs.readFileSync(fbFile, 'utf8');

if (!fbContent.includes('enableIndexedDbPersistence(db)')) {
  fbContent = fbContent.replace(
    /export const db = initializeFirestore[\s\S]*?\);/,
    "$& \n\ntry {\n  if (typeof window !== 'undefined') {\n    enableIndexedDbPersistence(db).catch(() => {});\n  }\n} catch (err) {}"
  );
  fs.writeFileSync(fbFile, fbContent, 'utf8');
}
