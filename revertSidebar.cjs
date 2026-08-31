const fs = require('fs');
let file = 'src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const regexCatalog = /\{\/\* Section: Catalog Management \*\/\}[\s\S]*?<\/div>/;
content = content.replace(regexCatalog, '');

const replacementSection1 = `{/* Section 1 */}
             <div className="px-4 mb-2">
               <button onClick={() => setActiveTab('dashboard')} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors", activeTab === 'dashboard' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 font-medium hover:bg-gray-50")}>
                 <Activity size={18} className={activeTab === 'dashboard' ? "text-blue-600" : "text-gray-400"} /> Overview
               </button>
               <button onClick={() => setActiveTab('analytics')} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors", activeTab === 'analytics' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 font-medium hover:bg-gray-50")}>
                 <BarChart2 size={18} className={activeTab === 'analytics' ? "text-blue-600" : "text-gray-400"} /> Analytics
               </button>
               <button onClick={() => setActiveTab('inventory')} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors", activeTab === 'inventory' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 font-medium hover:bg-gray-50")}>
                 <Package size={18} className={activeTab === 'inventory' ? "text-blue-600" : "text-gray-400"} /> Stock
               </button>
               <button onClick={() => window.open('/pos', '_blank')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-gray-600 font-medium hover:bg-gray-50">
                 <ShoppingCart size={18} className="text-gray-400" /> CLICK POS
               </button>
             </div>`;

const regexSection1 = /\{\/\* Section 1 \*\/\}[\s\S]*?CLICK POS\s*<\/button>\s*<\/div>/;
content = content.replace(regexSection1, replacementSection1);

const oldMenusButton = `{hasPermission('menus') && (
              <button onClick={() => setActiveTab('menus')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'menus' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                  <List size={16} className={activeTab === 'menus' ? "text-blue-600" : "text-gray-400"} /> Products Category
                </button>
              )}`;

const regexStaffNotes = /<MessageSquare size=\{16\} className=\{activeTab === 'internal_notes'.*?Staff Notes\s*<\/button>\s*\)\}/;
content = content.replace(regexStaffNotes, match => match + '\n              ' + oldMenusButton);

fs.writeFileSync(file, content, 'utf8');
