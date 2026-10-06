const fs = require('fs');
let c = fs.readFileSync('src/components/HeroBanner.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

// 1. Remove the main hero overlay
const mainRegex = /<div className="absolute inset-0 bg-gradient-to-r[^>]*>([\s\S]*?)<\/div>\n\s*<\/BannerLink>/;
c = c.replace(mainRegex, '</BannerLink>');

// 2. Remove the sidebar overlay
const sideRegex = /<div className="absolute inset-0 bg-gradient-to-t[^>]*>([\s\S]*?)<\/div>\n\s*<\/BannerLink>/;
c = c.replace(sideRegex, '</BannerLink>');

fs.writeFileSync('src/components/HeroBanner.tsx', c.replace(/\n/g, nl));
console.log('Overlays removed from HeroBanner');