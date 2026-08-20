const fs = require('fs');
let content = fs.readFileSync('src/pages/hosting/DomainSearchResults.tsx', 'utf8');

const regexGetPrice = /const getPrice = \([\s\S]*?return domainObj\.price \|\| 1299;\s*\};/;
const newGetPrice = `const getPrice = (domainObj: any) => { return domainObj.price || 1299; };`;

content = content.replace(regexGetPrice, newGetPrice);

fs.writeFileSync('src/pages/hosting/DomainSearchResults.tsx', content);
