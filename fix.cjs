@
const fs = require('fs');
const logo = fs.readFileSync('public/logo.png');
const b64 = logo.toString('base64');
fs.writeFileSync('src/lib/logoBase64.ts', 'export const logoBase64 = "data:image/png;base64,' + b64 + '";');
console.log('fixed');
@
