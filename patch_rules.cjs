const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'firestore.rules');
let content = fs.readFileSync(file, 'utf8');

const target = `    match /tasks/{taskId} {`;
const replacement = `    match /internal_notes/{noteId} {\n      allow read, write: if hasStaffAccess();\n    }\n\n    match /tasks/{taskId} {`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log('Updated firestore.rules');
