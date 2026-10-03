const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// 1. Add lazy import for StaffPerformanceTab
if (!code.includes('StaffPerformanceTab')) {
  code = code.replace(
    /const EmployeesTab = lazy\(\(\) =>\s+import\("\.\/admin\/tabs\/hr\/Employees"\)\.then\(\(m\) => \(\{ default: m\.default \}\)\),\s+\);/,
    `const EmployeesTab = lazy(() => import("./admin/tabs/hr/Employees").then((m) => ({ default: m.default })));
const StaffPerformanceTab = lazy(() => import("./admin/tabs/hr/StaffPerformance").then((m) => ({ default: m.StaffPerformanceTab })));`
  );
}

// 2. Add render logic
if (!code.includes('activeTab === "staff_performance"')) {
  code = code.replace(
    /\) : activeTab === "employees" \? \(\s+<EmployeesTab \/>/,
    `) : activeTab === "employees" ? (
                <EmployeesTab />
              ) : activeTab === "staff_performance" && isAdmin ? (
                <StaffPerformanceTab orders={orders} />`
  );
}

// 3. Add Sidebar button
if (!code.includes('setActiveTab("staff_performance")')) {
  // Find the closing button tag for Employees
  const employeesBtnEnd = `{!isSidebarCollapsed && (
                          <span className="truncate">Employees</span>
                        )}
                      </button>`;
  
  const performanceBtn = `
                      {isAdmin && (
                        <button
                          onClick={() => setActiveTab("staff_performance")}
                          className={cn(
                            "w-full flex items-center rounded-md text-[13px] transition-colors",
                            isSidebarCollapsed
                              ? "justify-center py-2"
                              : "gap-3 px-3 py-2",
                            activeTab === "staff_performance"
                              ? "text-blue-600 font-bold bg-blue-50"
                              : "text-gray-600 hover:bg-gray-50",
                          )}
                          title={isSidebarCollapsed ? "Performance" : undefined}
                        >
                          <Trophy
                            size={16}
                            className={
                              activeTab === "staff_performance"
                                ? "text-blue-600"
                                : "text-gray-400"
                            }
                          />{" "}
                          {!isSidebarCollapsed && (
                            <span className="truncate">Performance</span>
                          )}
                        </button>
                      )}`;

  code = code.replace(employeesBtnEnd, employeesBtnEnd + performanceBtn);
}

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log('Fixed AdminDashboard inserts');
