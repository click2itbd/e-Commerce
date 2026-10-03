const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const targetRegex = /<User\s*size=\{18\}\s*className="hover:text-gray-800 cursor-pointer"\s*onClick=\{\(\) => toast\("Coming Soon: Admin Profile Settings"\)\}\s*\/>/s;

const replacement = `<div className="relative">
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors flex items-center justify-center focus:outline-none"
                  title="Profile"
                >
                  <User size={18} className={isProfileDropdownOpen ? "text-blue-600" : "text-gray-600"} />
                </button>
                
                {isProfileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setIsProfileDropdownOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-1 z-[9999] animate-in fade-in zoom-in duration-200 overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                        <p className="text-sm font-black text-gray-900 truncate">{profile?.displayName || profile?.email?.split('@')[0] || 'Admin User'}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{profile?.email || 'admin@click2it.com.bd'}</p>
                        <div className="mt-2 inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black bg-blue-100 text-blue-700 uppercase tracking-wider">
                          {profile?.role || 'Admin'}
                        </div>
                      </div>
                      <div className="py-2">
                        <button 
                          onClick={() => { setIsProfileDropdownOpen(false); setActiveTab('settings'); }}
                          className="w-full text-left px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors flex items-center gap-3"
                        >
                          <Settings size={16} /> Global Settings
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>`;

if (code.match(targetRegex)) {
    code = code.replace(targetRegex, replacement);
    fs.writeFileSync('src/pages/AdminDashboard.tsx', code, 'utf8');
    console.log("Successfully replaced User icon with dropdown");
} else {
    console.log("Could not find the target string with regex.");
}
