const fs = require('fs');
let c = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceMarketing.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

const regex = /<select value=\{bannerForm\.position\}[\s\S]*?<\/select>/;
const newSelect = `<select value={bannerForm.position} onChange={e => setBannerForm({...bannerForm, position: e.target.value as any})} className="w-full px-4 py-2 border border-gray-200 rounded-lg">
                      <option value="hero_slider">Hero Slider</option>
                      <option value="promo_banner_left">Promo Banner (Left - Large)</option>
                      <option value="promo_banner_right">Promo Banner (Right - Small)</option>
                      <option value="sidebar_ad_top">Sidebar Ad (Top)</option>
                      <option value="sidebar_ad_bottom">Sidebar Ad (Bottom)</option>
                      <option value="pc_builder">PC Builder Banner</option>
                    </select>`;

c = c.replace(regex, newSelect);

fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceMarketing.tsx', c.replace(/\n/g, nl));
console.log('Dropdown updated successfully');