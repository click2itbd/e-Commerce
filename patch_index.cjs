const fs = require('fs');
let c = fs.readFileSync('functions/index.js', 'utf8');
c = c.replace(/\.doc\('site_settings'\)\.get\(\);\s*const apiSettings = settingsSnap\.exists \? settingsSnap\.data\(\)\.apiSettings : null;/g, ".doc('api_keys').get();\n    const apiSettings = settingsSnap.exists ? settingsSnap.data() : null;");
fs.writeFileSync('functions/index.js', c);
console.log('Patched index.js');
