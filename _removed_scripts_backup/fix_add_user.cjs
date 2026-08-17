const fs = require('fs');
const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes("import { setDoc } from ")) {
    content = content.replace("doc, query", "doc, setDoc, query");
}

content = content.replace(
    /await addDoc\(collection\(db, 'users'\), \{/g,
    "await setDoc(doc(db, 'users', userCred.user.uid), {"
);

fs.writeFileSync(path, content, 'utf8');
