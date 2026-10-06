const fs = require('fs');
let c = fs.readFileSync('src/components/HeroBanner.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

const fetchLogic = `setSidebarAds(activeBanners.filter(b => b.position === 'sidebar_ad'));`;
const newFetchLogic = `
      const topAd = activeBanners.find(b => b.position === 'sidebar_ad_top' || (b.position === 'sidebar_ad' && b.order === 0));
      const bottomAd = activeBanners.find(b => b.position === 'sidebar_ad_bottom' || (b.position === 'sidebar_ad' && b.order === 1));
      
      const combinedSideAds = [];
      if (topAd) combinedSideAds.push(topAd);
      if (bottomAd) combinedSideAds.push(bottomAd);
      
      setSidebarAds(combinedSideAds);`;

if (c.includes(fetchLogic)) {
  c = c.replace(fetchLogic, newFetchLogic);
  fs.writeFileSync('src/components/HeroBanner.tsx', c.replace(/\n/g, nl));
  console.log('HeroBanner.tsx updated');
} else {
  console.log('Could not find fetchLogic in HeroBanner');
}