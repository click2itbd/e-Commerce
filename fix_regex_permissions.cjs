const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/admin/tabs/hr/Users.tsx');
let content = fs.readFileSync(file, 'utf8');

// For Edit Permissions modal
const editModalRegex = /\{\['view_dashboard'[\s\S]*?\}\)\}\s*<\/div>\s*<div className="flex justify-end gap-2">/m;
const editModalReplacement = `{[
                  { id: 'view_dashboard', label: 'Dashboard', sub: 'Main Dashboard, Analytics' },
                  { id: 'manage_orders', label: 'Orders & Sales', sub: 'Sale, Sale Return, Orders & Docs, Customer, Quotation' },
                  { id: 'manage_inventory', label: 'Inventory', sub: 'Products, Purchases, Vendors, Brands' },
                  { id: 'manage_finances', label: 'Accounting', sub: 'Categories, Payment Accounts, Ledger, Income/Expense, Statements' },
                  { id: 'manage_reports', label: 'Reports', sub: 'Sales Report, Customer Due/Receive, All Reports' },
                  { id: 'manage_services', label: 'Services (Hosting)', sub: 'Active Accounts, Tickets, Web Host Billing' },
                  { id: 'manage_marketing', label: 'Marketing', sub: 'Campaigns, Discounts, Reviews' },
                  { id: 'manage_hr', label: 'Human Resource', sub: 'Salary, Employees, Leave' },
                  { id: 'manage_users', label: 'App Access', sub: 'User Role & Permissions' },
                  { id: 'manage_settings', label: 'Settings', sub: 'General Settings, Domain Pricing' }
                ].map(perm => {
                   const hasPermission = (editingUserPermissions.permissions || []).includes(perm.id);
                   return (
                    <label key={perm.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input type="checkbox" checked={hasPermission} onChange={() => {
                        const newPermissions = hasPermission
                          ? (editingUserPermissions.permissions || []).filter((p: string) => p !== perm.id)
                          : [...(editingUserPermissions.permissions || []), perm.id];
                        setEditingUserPermissions({...editingUserPermissions, permissions: newPermissions});
                      }} className="mt-1 rounded border-gray-300 text-[#EF4444] focus:ring-[#EF4444]" />
                      <div>
                        <div className="font-bold text-sm text-gray-800 capitalize">{perm.label}</div>
                        <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{perm.sub}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2">`;

content = content.replace(editModalRegex, editModalReplacement);

// For Add New User modal
const addUserRegex = /\{\['view_dashboard'[\s\S]*?\}\)\}\s*<\/div>\s*<\/div>\s*\)\}\s*<div className="flex justify-end gap-2 pt-4">/m;
const addUserReplacement = `{[
                      { id: 'view_dashboard', label: 'Dashboard', sub: 'Main Dashboard, Analytics' },
                      { id: 'manage_orders', label: 'Orders & Sales', sub: 'Sale, Sale Return, Orders & Docs, Customer, Quotation' },
                      { id: 'manage_inventory', label: 'Inventory', sub: 'Products, Purchases, Vendors, Brands' },
                      { id: 'manage_finances', label: 'Accounting', sub: 'Categories, Payment Accounts, Ledger, Income/Expense, Statements' },
                      { id: 'manage_reports', label: 'Reports', sub: 'Sales Report, Customer Due/Receive, All Reports' },
                      { id: 'manage_services', label: 'Services (Hosting)', sub: 'Active Accounts, Tickets, Web Host Billing' },
                      { id: 'manage_marketing', label: 'Marketing', sub: 'Campaigns, Discounts, Reviews' },
                      { id: 'manage_hr', label: 'Human Resource', sub: 'Salary, Employees, Leave' },
                      { id: 'manage_users', label: 'App Access', sub: 'User Role & Permissions' },
                      { id: 'manage_settings', label: 'Settings', sub: 'General Settings, Domain Pricing' }
                    ].map((perm) => (
                        <label key={perm.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={userFormData.permissions.includes(perm.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setUserFormData({ ...userFormData, permissions: [...userFormData.permissions, perm.id] });
                              } else {
                                setUserFormData({ ...userFormData, permissions: userFormData.permissions.filter(p => p !== perm.id) });
                              }
                            }}
                            className="mt-1 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-bold text-sm text-gray-800 capitalize">{perm.label}</div>
                            <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{perm.sub}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4">`;

content = content.replace(addUserRegex, addUserReplacement);

// Make grids larger
content = content.replace(/<div className="grid grid-cols-[1-2] sm:grid-cols-2 gap-3 mb-6">/g, '<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">');
content = content.replace(/<div className="grid grid-cols-[1-2] sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-md">/g, '<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2 border border-gray-200 rounded-md">');
content = content.replace(/<div className="grid grid-cols-[1-2] gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-md">/g, '<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2 border border-gray-200 rounded-md">');
// Handle raw exact strings for grid replacements just in case
content = content.replace('<div className="grid grid-cols-2 gap-2 mb-6">', '<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">');
content = content.replace('<div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-md">', '<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-2 border border-gray-200 rounded-md">');


fs.writeFileSync(file, content, 'utf8');
console.log('Successfully replaced permissions rendering');
