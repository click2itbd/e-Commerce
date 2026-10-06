const fs = require('fs');
let c = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceMarketing.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

// 1. Update dropdown
const oldDropdown = `<option value="hero_slider">Hero Slider</option>
                      <option value="promo_banner">Promo Banner</option>
                      <option value="sidebar_ad">Sidebar Ad</option>
                      <option value="pc_builder">PC Builder Banner</option>`;
                      
const newDropdown = `<option value="hero_slider">Hero Slider</option>
                      <option value="promo_banner_left">Promo Banner (Left - Large)</option>
                      <option value="promo_banner_right">Promo Banner (Right - Small)</option>
                      <option value="sidebar_ad_top">Sidebar Ad (Top)</option>
                      <option value="sidebar_ad_bottom">Sidebar Ad (Bottom)</option>
                      <option value="pc_builder">PC Builder Banner</option>`;
                      
c = c.replace(oldDropdown, newDropdown);

// 2. Update default banners
c = c.replace(`position: 'sidebar_ad', isActive: true, order: 0`, `position: 'sidebar_ad_top', isActive: true, order: 0`);
c = c.replace(`position: 'sidebar_ad', isActive: true, order: 1`, `position: 'sidebar_ad_bottom', isActive: true, order: 0`);
c = c.replace(`position: 'promo_banner', isActive: true, order: 0`, `position: 'promo_banner_left', isActive: true, order: 0`);
c = c.replace(`position: 'promo_banner', isActive: true, order: 1`, `position: 'promo_banner_right', isActive: true, order: 0`);

// 3. Update the getPositionBadge function to display nicely in the admin panel table
const oldBadge = `const getPositionBadge = (pos: string) => {
    switch(pos) {
      case 'hero_slider': return <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">HERO SLIDER</span>;
      case 'promo_banner': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">PROMO BANNER</span>;
      case 'sidebar_ad': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">SIDEBAR AD</span>;
      case 'pc_builder': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">PC BUILDER</span>;
      default: return null;
    }
  };`;
  
const newBadge = `const getPositionBadge = (pos: string) => {
    switch(pos) {
      case 'hero_slider': return <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">HERO SLIDER</span>;
      case 'promo_banner_left': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">PROMO (LEFT)</span>;
      case 'promo_banner_right': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">PROMO (RIGHT)</span>;
      case 'sidebar_ad_top': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">SIDEBAR (TOP)</span>;
      case 'sidebar_ad_bottom': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">SIDEBAR (BOTTOM)</span>;
      case 'pc_builder': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">PC BUILDER</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold uppercase">{pos}</span>;
    }
  };`;

c = c.replace(oldBadge, newBadge);

fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceMarketing.tsx', c.replace(/\n/g, nl));
console.log('EcommerceMarketing.tsx updated');