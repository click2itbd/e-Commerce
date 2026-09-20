const fs = require('fs');
const filePath = 'backend/src/routes/email.ts';
let content = fs.readFileSync(filePath, 'utf8');

// I might have literal \` and \$ in the file.
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');
content = content.replace(/ 3/g, '৳'); // Replace mangled taka sign

fs.writeFileSync(filePath, content);
console.log('Fixed syntax errors in email.ts');
