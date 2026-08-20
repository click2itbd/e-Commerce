const fs = require('fs');
let content = fs.readFileSync('functions/index.js', 'utf8');
content = content.replace(/https:\/\/api\.dynadot\.com\/api3\.json/g, "https://api-sandbox.dynadot.com/api3.json");

// Wait! I shouldn't replace ALL of them. The logic should be:
// const actualBaseUrl = isSandbox ? 'https://api-sandbox.dynadot.com/api3.json' : 'https://api.dynadot.com/api3.json';

// Let's use string replace properly for dynadotProxy
content = content.replace("const baseUrl = 'https://api.dynadot.com/api3.json';", "const baseUrl = isSandbox ? 'https://api-sandbox.dynadot.com/api3.json' : 'https://api.dynadot.com/api3.json';");

// Let's use string replace properly for manageDomain
content = content.replace("const actualBaseUrl = 'https://api.dynadot.com/api3.json';", "const actualBaseUrl = isSandbox ? 'https://api-sandbox.dynadot.com/api3.json' : 'https://api.dynadot.com/api3.json';");

fs.writeFileSync('functions/index.js', content, 'utf8');
console.log('Fixed sandbox URLs correctly');
