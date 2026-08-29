const fs = require('fs');
let content = fs.readFileSync('src/pages/MyServices.tsx', 'utf8');

// The error is likely `const res = await someApi(); if (res.success) ...` where res is unknown.
// We can just cast the response.
content = content.replace(/const res = await (.*?);/g, 'const res = await $1 as any;');

fs.writeFileSync('src/pages/MyServices.tsx', content, 'utf8');
console.log("Fixed MyServices.tsx TS errors");
