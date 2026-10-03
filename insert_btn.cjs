const fs = require('fs');
const lines = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8').split('\n');

const insertIdx = 5119; // After </button>

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

lines.splice(insertIdx, 0, performanceBtn);
fs.writeFileSync('src/pages/AdminDashboard.tsx', lines.join('\n'));
console.log('Inserted performance button at line', insertIdx);
