const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// 1. Add Lazy Imports
const lazyImportBlock = `const TaskManagerTab = lazy(() =>
  import("./admin/tabs/hr/TaskManager").then((m) => ({ default: m.default }))
);
const ProfitLossTab = lazy(() =>
  import("./admin/tabs/finance/ProfitLoss").then((m) => ({ default: m.default }))
);
const SalesReportTab`;

code = code.replace('const SalesReportTab', lazyImportBlock);

// 2. Add Sidebar Buttons
// Add Task Manager under HR (near users)
const usersButtonRegex = /<span className="truncate">App Access<\/span>\s*\}\)\s*<\/button>\s*\)\}/;
const taskManagerButton = `
                <button
                  onClick={() => setActiveTab("task_manager")}
                  className={cn(
                    "w-full flex items-center rounded-md text-[13px] transition-colors",
                    isSidebarCollapsed ? "justify-center py-2" : "gap-3 px-3 py-2",
                    activeTab === "task_manager" ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <List size={16} className={activeTab === "task_manager" ? "text-blue-600" : "text-gray-400"} />
                  {!isSidebarCollapsed && <span className="truncate">Task Manager</span>}
                </button>`;

code = code.replace(usersButtonRegex, match => match + taskManagerButton);

// Add Profit & Loss under Finance (near day_book or transaction_history)
const financeButtonRegex = /<span className="truncate">Day Book<\/span>\s*\}\)\s*<\/button>\s*\)\}/;
const pnlButton = `
                  {hasPermission("manage_finances") && (
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

code = code.replace(financeButtonRegex, match => match + pnlButton);

// 3. Add to Render Block
const renderRegex = /<DayBookTab \/>\s*<\/Suspense>\s*\)\s*:\s*activeTab === "transaction_history"/;
const renderAdditions = `<DayBookTab />
                  </Suspense>
                ) : activeTab === "profit_loss" ? (
                  <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
                    <ProfitLossTab />
                  </Suspense>
                ) : activeTab === "task_manager" ? (
                  <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
                    <TaskManagerTab />
                  </Suspense>
                ) : activeTab === "transaction_history"`;

code = code.replace(renderRegex, renderAdditions);

// Add PieChart import if missing
if (!code.includes('PieChart,')) {
    code = code.replace('List,', 'List, PieChart,');
}

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log('AdminDashboard updated');
