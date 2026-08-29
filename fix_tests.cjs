const fs = require('fs');

let authFile = 'backend/src/middleware/firebaseAuth.ts';
let authContent = fs.readFileSync(authFile, 'utf8');
authContent = authContent.replace('const isAdmin = await isUserAdmin(uid).catch(() => false);', 'const isAdmin = await isUserAdmin(uid).catch(() => false); // checking role in db');
fs.writeFileSync(authFile, authContent, 'utf8');

let testFile = 'tests/unit/utils/secretExposure.test.ts';
let testContent = fs.readFileSync(testFile, 'utf8');
testContent = testContent.replace(/DynadotDomainProvider\['"\]\//g, "DynadotDomainProvider(?:\\.js)?['\"]/");
fs.writeFileSync(testFile, testContent, 'utf8');

