const fs = require('fs');
let code = fs.readFileSync('src/components/HeroBanner.tsx', 'utf8');

// We will add a small helper function that replaces '/banners/...' with the imported images.
const replacement = `const resolveImageUrl = (url: string) => {
  if (url === '/banners/hero-main.jpg') return heroMainImg;
  if (url === '/banners/side-acc.jpg') return sideAccImg;
  if (url === '/banners/side-gadget.jpg') return sideGadgetImg;
  return url;
};

export const HeroBanner`;

code = code.replace(/export const HeroBanner/, replacement);

// Now we replace src={currentSlideData?.imageUrl} with src={resolveImageUrl(currentSlideData?.imageUrl || '')}
code = code.replace(/src=\{currentSlideData\?\.imageUrl\}/g, "src={currentSlideData?.imageUrl ? resolveImageUrl(currentSlideData.imageUrl) : ''}");

// And replace src={banner.imageUrl} with src={resolveImageUrl(banner.imageUrl)}
code = code.replace(/src=\{banner\.imageUrl\}/g, "src={resolveImageUrl(banner.imageUrl)}");

fs.writeFileSync('src/components/HeroBanner.tsx', code, 'utf8');
console.log('Modified HeroBanner to resolve images');
