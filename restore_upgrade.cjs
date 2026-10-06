const fs = require('fs');
let c = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceMarketing.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

// 1. Add Info import
if (!c.includes(' Info, ')) {
  c = c.replace('import { Tag, Globe,', 'import { Tag, Globe, Info,');
}

// 2. Update default banners
c = c.replace(`position: 'sidebar_ad', isActive: true, order: 0`, `position: 'sidebar_ad_top', isActive: true, order: 0`);
c = c.replace(`position: 'sidebar_ad', isActive: true, order: 1`, `position: 'sidebar_ad_bottom', isActive: true, order: 0`);
c = c.replace(`position: 'promo_banner', isActive: true, order: 0`, `position: 'promo_banner_left', isActive: true, order: 0`);
c = c.replace(`position: 'promo_banner', isActive: true, order: 1`, `position: 'promo_banner_right', isActive: true, order: 0`);

// 3. Update the getPositionBadge function
const oldBadge = `const getPositionBadge = (pos: string) => {
    switch(pos) {
      case 'hero_slider': return <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">HERO SLIDER</span>;
      case 'promo_banner': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">PROMO BANNER</span>;
      case 'sidebar_ad': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">SIDEBAR AD</span>;
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

// 4. Update the Banner Modal
// First, find the exact block for isBannerModalOpen
const modalRegex = /\{isBannerModalOpen && \([\s\S]*?<div className="fixed inset-0 bg-black\/50 z-\[100\] flex items-center justify-center p-4">\s*<div className="bg-white rounded-2xl shadow-xl w-full max-w-md">\s*<div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">\s*<h3 className="font-bold text-gray-900">\{editingBannerId \? 'Edit Banner' : 'Upload Banner'\}<\/h3>\s*<button onClick=\{\(\) => setIsBannerModalOpen\(false\)\} className="p-2 hover:bg-gray-200 rounded-lg"><X size=\{18\}\/><\/button>\s*<\/div>\s*<form onSubmit=\{handleSaveBanner\} className="p-6 space-y-4">[\s\S]*?<\/form>\s*<\/div>\s*<\/div>\s*\)\}/;

const newModal = `{isBannerModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                <h3 className="font-bold text-gray-900 text-lg">{editingBannerId ? 'Edit Banner' : 'Upload Banner'}</h3>
                <button type="button" onClick={() => setIsBannerModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors"><X size={20}/></button>
              </div>
              <form onSubmit={handleSaveBanner} className="flex-1 overflow-y-auto">
                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Left Column: Image Upload & Link */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Banner Image</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-2 text-center hover:bg-gray-50 transition-colors relative group h-48 flex flex-col items-center justify-center bg-gray-50/50">
                        {bannerForm.imageUrl ? (
                          <div className="relative w-full h-full">
                            <img src={bannerForm.imageUrl} alt="Preview" className="w-full h-full object-contain rounded-lg bg-gray-100" />
                            <button type="button" onClick={() => setBannerForm({...bannerForm, imageUrl: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition-colors"><X size={14}/></button>
                          </div>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                            <ImageIcon size={36} className="text-blue-500 mb-3 opacity-80" />
                            <span className="text-sm font-bold text-blue-600 mb-1">Click to upload image</span>
                            <span className="text-xs text-gray-500">Supports JPG, PNG, WEBP</span>
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploading} />
                          </label>
                        )}
                        {isUploading && <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-xl font-bold text-blue-600 backdrop-blur-sm z-10">Uploading...</div>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 py-2">
                      <div className="h-px bg-gray-200 flex-1"></div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">OR</span>
                      <div className="h-px bg-gray-200 flex-1"></div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Paste Image URL directly</label>
                      <input type="url" value={bannerForm.imageUrl} onChange={e => setBannerForm({...bannerForm, imageUrl: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="https://example.com/image.jpg" />
                      <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1"><Info size={12} /> Useful if you already have the image link.</p>
                    </div>
                  </div>

                  {/* Right Column: Details */}
                  <div className="space-y-5 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Banner Title</label>
                      <input required type="text" value={bannerForm.title} onChange={e => setBannerForm({...bannerForm, title: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Premium Gaming Setups" />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-700">Target URL / Click Link</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select 
                          className="px-3 py-2.5 border border-gray-200 rounded-lg bg-white font-medium text-sm sm:w-1/3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={bannerForm.targetUrl.startsWith('/category/') ? 'category' : 'custom'}
                          onChange={(e) => {
                            if(e.target.value === 'category') {
                              setBannerForm({...bannerForm, targetUrl: menus[0] ? \`/category/\${menus[0].slug}\` : ''});
                            } else {
                              setBannerForm({...bannerForm, targetUrl: ''});
                            }
                          }}
                        >
                          <option value="custom">Custom URL</option>
                          <option value="category">Category Page</option>
                        </select>
                        
                        {bannerForm.targetUrl.startsWith('/category/') ? (
                          <select 
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={bannerForm.targetUrl.replace('/category/', '')}
                            onChange={(e) => setBannerForm({...bannerForm, targetUrl: \`/category/\${e.target.value}\`})}
                          >
                            {menus.map(m => (
                              <option key={m.id} value={m.slug}>{m.title}</option>
                            ))}
                          </select>
                        ) : (
                          <input type="text" value={bannerForm.targetUrl} onChange={e => setBannerForm({...bannerForm, targetUrl: e.target.value})} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. /shop/sale or https://..." />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Position</label>
                        <select value={bannerForm.position} onChange={e => setBannerForm({...bannerForm, position: e.target.value as any})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <option value="hero_slider">Hero Slider</option>
                          <option value="promo_banner_left">Promo Banner (Left - Large)</option>
                          <option value="promo_banner_right">Promo Banner (Right - Small)</option>
                          <option value="sidebar_ad_top">Sidebar Ad (Top)</option>
                          <option value="sidebar_ad_bottom">Sidebar Ad (Bottom)</option>
                          <option value="pc_builder">PC Builder Banner</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Display Order</label>
                        <input type="number" min="0" value={bannerForm.order} onChange={e => setBannerForm({...bannerForm, order: Number(e.target.value)})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                      </div>
                    </div>

                    <div className="pt-2 pb-2">
                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
                        <input type="checkbox" checked={bannerForm.isActive} onChange={e => setBannerForm({...bannerForm, isActive: e.target.checked})} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                        <span className="text-sm font-bold text-gray-900">Banner is Active & Visible</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3 shrink-0">
                  <button type="button" onClick={() => setIsBannerModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
                  <button type="submit" disabled={!bannerForm.imageUrl || isUploading} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-600/20">
                    Save Banner
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}`;

if (c.match(modalRegex)) {
  c = c.replace(modalRegex, newModal);
  fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceMarketing.tsx', c.replace(/\n/g, nl));
  console.log('Restored and upgraded cleanly.');
} else {
  console.log('Could not find modal regex. Let me check the file content.');
}