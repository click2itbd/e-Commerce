const fs = require('fs');
let c = fs.readFileSync('src/components/home/HomeSections.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

const fetchLogic = `const activeBanners = snapshot.docs
          .map(doc => doc.data() as Banner)
          .filter(b => b.isActive && b.position === 'promo_banner');
        setPromoBanners(activeBanners);`;

const newFetchLogic = `const activeDocs = snapshot.docs.map(doc => doc.data() as Banner).filter(b => b.isActive);
        const leftPromo = activeDocs.find(b => b.position === 'promo_banner_left' || (b.position === 'promo_banner' && b.order === 0));
        const rightPromo = activeDocs.find(b => b.position === 'promo_banner_right' || (b.position === 'promo_banner' && b.order === 1));
        
        const combinedPromos = [];
        if (leftPromo) combinedPromos.push(leftPromo);
        if (rightPromo) combinedPromos.push(rightPromo);
        
        setPromoBanners(combinedPromos);`;

if (c.includes(fetchLogic)) {
  c = c.replace(fetchLogic, newFetchLogic);
  fs.writeFileSync('src/components/home/HomeSections.tsx', c.replace(/\n/g, nl));
  console.log('HomeSections.tsx updated');
} else {
  console.log('Could not find fetchLogic in HomeSections');
}