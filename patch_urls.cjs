const fs = require('fs');
let content = fs.readFileSync('functions/index.js', 'utf8');
content = content.replace(/https:\/\/api\.sandbox\.dynadot\.com\/api3\.json/g, 'https://api.dynadot.com/api3.json');
fs.writeFileSync('functions/index.js', content, 'utf8');
console.log('Fixed sandbox URLs');
