const fs = require('fs');
let c = fs.readFileSync('src/components/home/HomeSections.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

const regex = /const activeBanners = snapshot\.docs[\s\S]*?setPromoBanners\(activeBanners\);/;
const newFetchLogic = `const activeDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((b: any) => b.isActive);
        const leftPromo = activeDocs.find((b: any) => b.position === 'promo_banner_left' || (b.position === 'promo_banner' && b.order === 0));
        const rightPromo = activeDocs.find((b: any) => b.position === 'promo_banner_right' || (b.position === 'promo_banner' && b.order === 1));
        
        const combinedPromos = [];
        if (leftPromo) combinedPromos.push(leftPromo);
        if (rightPromo) combinedPromos.push(rightPromo);
        
        setPromoBanners(combinedPromos);`;

c = c.replace(regex, newFetchLogic);
fs.writeFileSync('src/components/home/HomeSections.tsx', c.replace(/\n/g, nl));
console.log('HomeSections updated');