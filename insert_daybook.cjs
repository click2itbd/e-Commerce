const fs = require('fs');
const lines = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8').split('\n');

const insertIdx = 4913; // After the closing </button> and )} of Trial balance... actually let's insert it right after Trial Balance button

const dayBookBtn = `
                  {hasPermission("manage_finances") && (
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
                  )}`;

lines.splice(insertIdx, 0, dayBookBtn);
fs.writeFileSync('src/pages/AdminDashboard.tsx', lines.join('\n'));
console.log('Inserted Day Book button');
