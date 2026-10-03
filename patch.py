import re

with open('src/pages/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lazy_import = 'import ConveyanceTab from "./admin/tabs/finance/Conveyance";\\nconst DayBookTab = lazy(() => import("./admin/tabs/finance/DayBook").then(m => ({ default: m.default })));'
content = content.replace('import ConveyanceTab from "./admin/tabs/finance/Conveyance";', lazy_import)

if 'Wallet' not in content:
    content = content.replace('Book,', 'Book,\\n  Wallet,')

sidebar_btn = '''{hasPermission("manage_finances") && (
                  <button
                    onClick={() => setActiveTab("day_book")}
                    className={cn(
                      "w-full flex items-center rounded-md text-[13px] transition-colors",
                      isSidebarCollapsed
                        ? "justify-center py-2"
                        : "gap-3 px-3 py-2",
                      activeTab === "day_book"
                        ? "text-blue-600 font-bold bg-blue-50"
                        : "text-gray-600 hover:bg-gray-50",
                    )}
                  >
                    <Wallet
                      size={16}
                      className={
                        activeTab === "day_book"
                          ? "text-blue-600"
                          : "text-gray-400"
                      }
                    />{" "}
                    {!isSidebarCollapsed && (
                      <span className="truncate">Day Book</span>
                    )}
                  </button>
                )}'''

content = content.replace('Accounting\\n                  </div>\\n                )}', 'Accounting\\n                  </div>\\n                )}\\n                ' + sidebar_btn)

render_logic = ''') : activeTab === "day_book" ? (
                <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
                  <DayBookTab />
                </Suspense>'''
content = content.replace(') : activeTab === "stock_accounting"', render_logic + '\\n              ) : activeTab === "stock_accounting"')

with open('src/pages/AdminDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
