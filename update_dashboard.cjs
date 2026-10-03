const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// 1. Add lazy import
const importEmployeesTab = `const EmployeesTab = lazy(() =>
  import("./admin/tabs/hr/Employees").then((m) => ({ default: m.default })),
);`;
const importStaffPerformance = `const StaffPerformanceTab = lazy(() =>
  import("./admin/tabs/hr/StaffPerformance").then((m) => ({ default: m.StaffPerformanceTab })),
);`;
code = code.replace(importEmployeesTab, importEmployeesTab + '\n' + importStaffPerformance);

// 2. Add to activeTab render logic
const renderEmployeesTab = `              ) : activeTab === "employees" ? (
                <EmployeesTab />`;
const renderStaffPerformance = `              ) : activeTab === "employees" ? (
                <EmployeesTab />
              ) : activeTab === "staff_performance" && isAdmin ? (
                <StaffPerformanceTab orders={orders} />`;
code = code.replace(renderEmployeesTab, renderStaffPerformance);

// 3. Add sidebar link next to Employees
const sidebarEmployees = `<button
                        onClick={() => setActiveTab("employees")}
                        className={cn(
                          "w-full flex items-center rounded-md text-[13px] transition-colors",
                          isSidebarCollapsed
                            ? "justify-center py-2"
                            : "gap-3 px-3 py-2",
                          activeTab === "employees"
                            ? "text-blue-600 font-bold bg-blue-50"
                            : "text-gray-600 hover:bg-gray-50",
                        )}
                        title={isSidebarCollapsed ? "Employees" : undefined}
                      >
                        <Users
                          size={16}
                          className={
                            activeTab === "employees"
                              ? "text-blue-600"
                              : "text-gray-400"
                          }
                        />{" "}
                        {!isSidebarCollapsed && (
                          <span className="truncate">Employees</span>
                        )}
                      </button>`;

const sidebarStaffPerformance = `
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
                          title={isSidebarCollapsed ? "Staff Performance" : undefined}
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
                      )}
`;

code = code.replace(sidebarEmployees, sidebarEmployees + sidebarStaffPerformance);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log('Updated AdminDashboard.tsx');
