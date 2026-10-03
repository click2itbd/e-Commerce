const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// Find the corrupted block and replace it
const corruptedBlock = `            <button
              onClick={() =>
                setConfirmModal({ ...confirmModal, isOpen: false })
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
                )}
              }
              disabled={isConfirming}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-all font-medium disabled:opacity-50"
            >
              Cancel
            </button>`;

const fixedBlock = `            <button
              onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
              disabled={isConfirming}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-all font-medium disabled:opacity-50"
            >
              Cancel
            </button>`;

code = code.replace(corruptedBlock, fixedBlock);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log('Fixed syntax error in AdminDashboard.tsx');
