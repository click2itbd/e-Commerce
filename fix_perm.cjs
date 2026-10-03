const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// The Day Book button block starts with: {hasPermission("manage_finances") && ( ... activeTab === "day_book"
// We want to replace it. Let's do a precise string replacement.

const oldBlock = `{hasPermission("manage_finances") && (
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
                      )}`;

const newBlock = `{(hasPermission("manage_finances") || hasPermission("manage_orders")) && (
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
                      )}`;

code = code.replace(oldBlock, newBlock);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log('Fixed Day Book permission');
