const fs = require('fs');
let content = fs.readFileSync('src/pages/hosting/DomainSearchResults.tsx', 'utf8');

const regexGetPrice = /const getPrice = \([\s\S]*?return 1299;\s*\};/;
const newGetPrice = `const getPrice = (domainObj: any) => {
    // 1. If API provides a valid price (> 0), prioritize it (it includes the 15% markup)
    if (domainObj.price && domainObj.price > 0) {
      return domainObj.price;
    }

    // 2. Fallback to fixed DB pricing for TLDs Dynadot doesn't sell (like .com.bd)
    const tld = domainObj.domain.substring(domainObj.domain.indexOf('.'));
    const p = pricing.find(p => p.tld === tld);
    if (p) return p.registerPrice;
    
    // 3. Absolute fallback
    return 1299;
  };`;

content = content.replace(regexGetPrice, newGetPrice);
fs.writeFileSync('src/pages/hosting/DomainSearchResults.tsx', content);
