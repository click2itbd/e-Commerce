const fs = require('fs');
let file = 'src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Import BrandsTab
content = content.replace(
  "const MenusTab = lazy(() => import('./admin/tabs/menus/Menus').then(m => ({ default: m.default })));",
  "const MenusTab = lazy(() => import('./admin/tabs/menus/Menus').then(m => ({ default: m.default })));\nconst BrandsTab = lazy(() => import('./admin/tabs/inventory/Brands').then(m => ({ default: m.default })));"
);

// 2. Add 'brands' to OFFLINE_SHOP_TABS
content = content.replace(
  "'dashboard', 'analytics', 'inventory', 'sales', 'sale_return', 'orders',",
  "'dashboard', 'analytics', 'inventory', 'brands', 'sales', 'sale_return', 'orders',"
);

// 3. Reorganize sidebar menus
// Look for where the main tabs are
const regexMainSection = /<div className="px-4 mb-2 space-y-1">[\s\S]*?<button onClick=\{\(\) => setActiveTab\('inventory'\)\}.*?>[\s\S]*?<\/button>[\s\S]*?<\/div>/;

// We will replace the Inventory button with a new section for Catalog Management, taking Menus and Inventory out of their previous places.
// Actually, it's easier to just append a new section below "Main Dashboard" and move "Stock" and "Products Category" there.

// Let's find "Products Category" (which is `menus` tab in Settings section) and "Stock" (in Main section) and reorganize them.
const replaceSidebarCode = `
             <div className="px-4 mb-2 space-y-1">
               <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 px-3">Main Dashboard</div>
               {hasPermission('view_dashboard') && (
                 <button onClick={() => setActiveTab('dashboard')} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors", activeTab === 'dashboard' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 font-medium hover:bg-gray-50")}>
                   <LayoutDashboard size={18} className={activeTab === 'dashboard' ? "text-blue-600" : "text-gray-400"} /> Overview
                 </button>
               )}
               <button onClick={() => setActiveTab('analytics')} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors", activeTab === 'analytics' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 font-medium hover:bg-gray-50")}>
                 <BarChart2 size={18} className={activeTab === 'analytics' ? "text-blue-600" : "text-gray-400"} /> Analytics
               </button>
               <button onClick={() => window.open('/pos', '_blank')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-gray-600 font-medium hover:bg-gray-50">
                 <ShoppingCart size={18} className="text-gray-400" /> CLICK POS
               </button>
             </div>

             {/* NEW: Catalog Management */}
             <div className="px-4 mb-2 space-y-1">
               <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 px-3">Catalog Management</div>
               {hasPermission('inventory') && (
                 <>
                   <button onClick={() => setActiveTab('inventory')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'inventory' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                     <Package size={16} className={activeTab === 'inventory' ? "text-blue-600" : "text-gray-400"} /> Products
                   </button>
                   <button onClick={() => setActiveTab('brands')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'brands' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                     <ShieldAlert size={16} className={activeTab === 'brands' ? "text-blue-600" : "text-gray-400"} /> Brands
                   </button>
                 </>
               )}
               {hasPermission('menus') && (
                 <button onClick={() => setActiveTab('menus')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'menus' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                   <List size={16} className={activeTab === 'menus' ? "text-blue-600" : "text-gray-400"} /> Categories
                 </button>
               )}
             </div>
`;

// Replace the first div section containing Main Dashboard
content = content.replace(
  /<div className="px-4 mb-2 space-y-1">\s*<div className="text-\[10px\] uppercase font-bold text-gray-400 mb-1 px-3">Main Dashboard<\/div>[\s\S]*?CLICK POS\s*<\/button>\s*<\/div>/,
  replaceSidebarCode
);

// Remove the old 'menus' button from wherever it is
content = content.replace(/\{hasPermission\('menus'\) && \([\s\S]*?Products Category\s*<\/button>\s*\)\}/g, '');

// 4. Add routing for BrandsTab
content = content.replace(
  ") : activeTab === 'inventory' ? (",
  ") : activeTab === 'brands' && hasPermission('inventory') ? (\n            <BrandsTab />\n          ) : activeTab === 'inventory' ? ("
);

fs.writeFileSync(file, content, 'utf8');
