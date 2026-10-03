const fs = require('fs');
let lines = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8').split('\n');

const renderBlock = `              ) : activeTab === "profit_loss" ? (
                <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
                  <ProfitLossTab />
                </Suspense>`;
lines.splice(5713, 0, renderBlock); // insert at line 5714 (index 5713)

const buttonBlock = `                {hasPermission("manage_finances") && (
                  <button
                    onClick={() => setActiveTab("profit_loss")}
                    className={cn(
                      "w-full flex items-center rounded-md text-[13px] transition-colors",
                      isSidebarCollapsed ? "justify-center py-2" : "gap-3 px-3 py-2",
                      activeTab === "profit_loss" ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <PieChart size={16} className={activeTab === "profit_loss" ? "text-blue-600" : "text-gray-400"} />
                    {!isSidebarCollapsed && <span className="truncate">Profit & Loss</span>}
                  </button>
                )}`;
lines.splice(4970, 0, buttonBlock); // insert at line 4971 (index 4970)

fs.writeFileSync('src/pages/AdminDashboard.tsx', lines.join('\n'));
console.log('Inserted Profit & Loss routing');
