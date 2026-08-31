const fs = require('fs');
let file = 'src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const regexSection1 = /\{\/\* Section 1 \*\/\}[\s\S]*?<div className="px-4 mb-2">[\s\S]*?<button onClick=\{\(\) => setActiveTab\('dashboard'\)\}.*?>[\s\S]*?<Activity.*?Overview\s*<\/button>[\s\S]*?<button onClick=\{\(\) => setActiveTab\('analytics'\)\}.*?>[\s\S]*?<BarChart2.*?Analytics\s*<\/button>[\s\S]*?<button onClick=\{\(\) => setActiveTab\('inventory'\)\}.*?>[\s\S]*?<Package.*?Stock\s*<\/button>[\s\S]*?<button onClick=\{\(\) => window\.open\('\/pos'.*?>[\s\S]*?<ShoppingCart.*?CLICK POS\s*<\/button>\s*<\/div>/;

const replacementSection1 = `{/* Section 1 */}
             <div className="px-4 mb-2">
               <button onClick={() => setActiveTab('dashboard')} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors", activeTab === 'dashboard' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 font-medium hover:bg-gray-50")}>
                 <Activity size={18} className={activeTab === 'dashboard' ? "text-blue-600" : "text-gray-400"} /> Overview
               </button>
               <button onClick={() => setActiveTab('analytics')} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors", activeTab === 'analytics' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 font-medium hover:bg-gray-50")}>
                 <BarChart2 size={18} className={activeTab === 'analytics' ? "text-blue-600" : "text-gray-400"} /> Analytics
               </button>
               <button onClick={() => window.open('/pos', '_blank')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-gray-600 font-medium hover:bg-gray-50">
                 <ShoppingCart size={18} className="text-gray-400" /> CLICK POS
               </button>
             </div>
             
             {/* Section: Catalog Management */}
             <div className="px-4 mb-2">
               <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 px-3">Catalog Management</div>
               {hasPermission('inventory') && (
                 <>
                   <button onClick={() => setActiveTab('inventory')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'inventory' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                     <Package size={16} className={activeTab === 'inventory' ? "text-blue-600" : "text-gray-400"} /> Products
                   </button>
                   <button onClick={() => setActiveTab('brands')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'brands' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                     <Tag size={16} className={activeTab === 'brands' ? "text-blue-600" : "text-gray-400"} /> Brands
                   </button>
                 </>
               )}
               {hasPermission('menus') && (
                 <button onClick={() => setActiveTab('menus')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'menus' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                     <List size={16} className={activeTab === 'menus' ? "text-blue-600" : "text-gray-400"} /> Categories
                 </button>
               )}
             </div>`;

if(regexSection1.test(content)) {
  content = content.replace(regexSection1, replacementSection1);
  console.log("Successfully replaced Section 1");
} else {
  console.log("Failed to match Section 1 regex.");
}

// Remove the old 'menus' button from System & Settings or wherever it is
const regexOldMenus = /\{hasPermission\('menus'\) && \([\s\S]*?<List.*?Products Category\s*<\/button>\s*\)\}/;
if(regexOldMenus.test(content)) {
  content = content.replace(regexOldMenus, '');
  console.log("Successfully removed old menus button");
}

fs.writeFileSync(file, content, 'utf8');
