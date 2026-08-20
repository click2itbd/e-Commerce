const fs = require('fs');
let content = fs.readFileSync('src/pages/hosting/DomainSearchResults.tsx', 'utf8');

const regexGetPrice = /const getPrice = \([\s\S]*?return domainObj\.price \|\| 1299;\s*\};/;
const newGetPrice = `const getPrice = (domainObj: any) => {
    const tld = domainObj.domain.substring(domainObj.domain.indexOf('.'));
    // 1. First check if Admin explicitly set a fixed retail price in the DB
    const p = pricing.find(p => p.tld === tld);
    if (p) return p.registerPrice;
    
    // 2. Otherwise, use the API price (which already has 15% markup from backend)
    if (domainObj.price && domainObj.price > 0) {
      return domainObj.price;
    }
    
    // 3. Absolute fallback if Dynadot returns 0 and admin didn't set a price
    return 1299;
  };`;

content = content.replace(regexGetPrice, newGetPrice);
fs.writeFileSync('src/pages/hosting/DomainSearchResults.tsx', content);
