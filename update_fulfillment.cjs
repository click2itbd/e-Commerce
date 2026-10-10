const fs = require('fs');
let code = fs.readFileSync('backend/src/services/fulfillment.ts', 'utf8');

const targetStr = `            <div style="font-size: 14px; margin-bottom: 6px;"><strong>cPanel Username:</strong> <code style="background:#e2e8f0; padding:2px 6px; border-radius:4px;">\${result.providerAccountId || 'See control panel'}</code></div>`;

const newStr = targetStr + `\n            <div style="font-size: 14px; margin-bottom: 6px;"><strong>cPanel Password:</strong> <code style="background:#e2e8f0; padding:2px 6px; border-radius:4px;">\${result.password || 'Contact Support'}</code></div>`;

code = code.replace(targetStr, newStr);

// Also replace the dynamic template vars
const dynTarget = `.replace(/\\{\\{username\\}\\}/g, result.providerAccountId || '')`;
const dynNew = `.replace(/\\{\\{username\\}\\}/g, result.providerAccountId || '')\n                .replace(/\\{\\{password\\}\\}/g, result.password || '')`;

code = code.replaceAll(dynTarget, dynNew);

fs.writeFileSync('backend/src/services/fulfillment.ts', code);
