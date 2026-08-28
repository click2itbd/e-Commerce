const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/admin/tabs/hr/Users.tsx');
let content = fs.readFileSync(file, 'utf8');

const target = `{['view_dashboard', 'manage_users', 'manage_settings', 'manage_inventory', 'manage_orders', 'manage_finances', 'manage_reports', 'manage_hr', 'manage_services', 'manage_marketing'].map(perm => {
                   const hasPermission = (editingUserPermissions.permissions || []).includes(perm);
                   return (
                    <label key={perm} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={hasPermission} onChange={() => {
                        const newPermissions = hasPermission
                          ? (editingUserPermissions.permissions || []).filter((p: string) => p !== perm)
                          : [...(editingUserPermissions.permissions || []), perm];
                        setEditingUserPermissions({...editingUserPermissions, permissions: newPermissions});
                      }} className="rounded border-gray-300 text-[#EF4444] focus:ring-[#EF4444]" />
                      {perm.replace('manage_', '').replace('view_', '')}
                    </label>
                  );
                })}`;

const replacement = `{[
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
                    <label key={perm.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
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
                })}`;

content = content.replace(target, replacement);

// Make grid 1 col or 2 cols
content = content.replace(`<div className="grid grid-cols-2 gap-2 mb-6">`, `<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">`);

fs.writeFileSync(file, content, 'utf8');
console.log('Updated Users permissions modal UI');
