const fs = require('fs');
const lines = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8').split('\n');

// Replace lines 5412-5433 (0-indexed: 5411-5432)
const startIdx = 5411;
const endIdx = 5433; // exclusive

const newDropdown = `                {isProfileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setIsProfileDropdownOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] overflow-hidden">
                      
                      {/* Dark header with avatar */}
                      <div className="bg-gradient-to-br from-[#081621] to-[#0f2744] px-5 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[#EF4444] flex items-center justify-center text-white font-black text-lg shadow-lg flex-shrink-0">
                            {(profile?.displayName || profile?.email || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-white truncate">{profile?.displayName || profile?.email?.split('@')[0] || 'Admin User'}</p>
                            <p className="text-xs text-blue-300 truncate mt-0.5">{profile?.email || 'admin@click2it.com.bd'}</p>
                            <span className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-[#EF4444] text-white uppercase tracking-wider">
                              {profile?.role || 'Admin'}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-4">
                          <div className="bg-white/10 rounded-lg px-2 py-2 text-center">
                            <p className="text-white font-black text-sm">{orders?.length || 0}</p>
                            <p className="text-blue-300 text-[10px]">Orders</p>
                          </div>
                          <div className="bg-white/10 rounded-lg px-2 py-2 text-center">
                            <p className="text-white font-black text-sm">{customers?.length || 0}</p>
                            <p className="text-blue-300 text-[10px]">Customers</p>
                          </div>
                          <div className="bg-white/10 rounded-lg px-2 py-2 text-center">
                            <p className="text-white font-black text-sm">{products?.length || 0}</p>
                            <p className="text-blue-300 text-[10px]">Products</p>
                          </div>
                        </div>
                      </div>

                      {/* Quick links */}
                      <div className="p-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider px-3 py-1.5">Quick Access</p>
                        {[
                          { icon: '??', label: 'Dashboard', tab: 'dashboard' },
                          { icon: '??', label: 'New Sale', tab: 'sales' },
                          { icon: '??', label: 'Inventory', tab: 'inventory' },
                          { icon: '??', label: 'Customer Due List', tab: 'customer_due_list' },
                          { icon: '??', label: 'Sales Report', tab: 'reports' },
                          { icon: '??', label: 'Settings', tab: 'settings' },
                        ].map(item => (
                          <button
                            key={item.tab}
                            onClick={() => { setIsProfileDropdownOpen(false); setActiveTab(item.tab); }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#EF4444] transition-colors flex items-center gap-3 rounded-lg"
                          >
                            <span className="text-base">{item.icon}</span>
                            <span className="font-semibold text-sm">{item.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Sign out */}
                      <div className="border-t border-gray-100 p-2">
                        <button
                          onClick={() => { setIsProfileDropdownOpen(false); navigate('/'); }}
                          className="w-full text-left px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-3 rounded-lg"
                        >
                          <span className="text-base">??</span> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}`;

lines.splice(startIdx, endIdx - startIdx, newDropdown);
fs.writeFileSync('src/pages/AdminDashboard.tsx', lines.join('\n'), 'utf8');
console.log("Redesigned profile dropdown");
