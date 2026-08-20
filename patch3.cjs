const fs = require('fs');
let content = fs.readFileSync('src/pages/hosting/DomainSearchResults.tsx', 'utf8');

const regexGetPrice = /const getPrice = \([\s\S]*?Fallback price\s*\};/;
const newGetPrice = `const getPrice = (domainObj: any) => {
    const tld = domainObj.domain.substring(domainObj.domain.indexOf('.'));
    const p = pricing.find(p => p.tld === tld);
    if (p) return p.registerPrice;
    return domainObj.price || 1299;
  };`;

content = content.replace(regexGetPrice, newGetPrice);

// Also replace usages
content = content.replace(/getPrice\(alt\.domain\.substring\(alt\.domain\.indexOf\("."\)\)\)/g, 'getPrice(alt)');
content = content.replace(/getPrice\(exactMatch\.domain\.substring\(exactMatch\.domain\.indexOf\("."\)\)\)/g, 'getPrice(exactMatch)');

fs.writeFileSync('src/pages/hosting/DomainSearchResults.tsx', content);
