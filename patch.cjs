const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const lazy_import = 'import ConveyanceTab from "./admin/tabs/finance/Conveyance";\nconst DayBookTab = lazy(() => import("./admin/tabs/finance/DayBook").then(m => ({ default: m.default })));';
content = content.replace('import ConveyanceTab from "./admin/tabs/finance/Conveyance";', lazy_import);

if (!content.includes('Wallet,')) {
    content = content.replace('Book,', 'Book,\n  Wallet,');
}

const sidebar_btn = '{hasPermission("manage_finances") && (\n' +
'                  <button\n' +
'                    onClick={() => setActiveTab("day_book")}\n' +
'                    className={cn(\n' +
'                      "w-full flex items-center rounded-md text-[13px] transition-colors",\n' +
'                      isSidebarCollapsed\n' +
'                        ? "justify-center py-2"\n' +
'                        : "gap-3 px-3 py-2",\n' +
'                      activeTab === "day_book"\n' +
'                        ? "text-blue-600 font-bold bg-blue-50"\n' +
'                        : "text-gray-600 hover:bg-gray-50",\n' +
'                    )}\n' +
'                  >\n' +
'                    <Wallet\n' +
'                      size={16}\n' +
'                      className={\n' +
'                        activeTab === "day_book"\n' +
'                          ? "text-blue-600"\n' +
'                          : "text-gray-400"\n' +
'                      }\n' +
'                    />{" "}\n' +
'                    {!isSidebarCollapsed && (\n' +
'                      <span className="truncate">Day Book</span>\n' +
'                    )}\n' +
'                  </button>\n' +
'                )}';

content = content.replace(/Accounting[\s\S]*?<\/div>[\s\S]*?}\)/, (match) => match + '\n                ' + sidebar_btn);

const render_logic = ') : activeTab === "day_book" ? (\n' +
'                <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>\n' +
'                  <DayBookTab />\n' +
'                </Suspense>';
content = content.replace(') : activeTab === "stock_accounting"', render_logic + '\n              ) : activeTab === "stock_accounting"');

fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
