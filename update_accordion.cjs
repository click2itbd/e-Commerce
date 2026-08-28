const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/admin/tabs/hr/Users.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add lucide icons import for Chevron
if (!content.includes('ChevronDown')) {
  content = content.replace(`import { Plus, Search, CheckCircle, XCircle, Settings, Mail, Phone, MapPin, ArrowRight, Activity, Calendar, ShieldAlert, Check, X, Shield, Clock, Search as SearchIcon, Upload, Download, Copy, ExternalLink, RefreshCw, Eye, Edit2, Trash2 } from 'lucide-react';`, 
                            `import { Plus, Search, CheckCircle, XCircle, Settings, Mail, Phone, MapPin, ArrowRight, Activity, Calendar, ShieldAlert, Check, X, Shield, Clock, Search as SearchIcon, Upload, Download, Copy, ExternalLink, RefreshCw, Eye, Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';`);
}

// Add state for accordion
if (!content.includes('expandedPerms')) {
  content = content.replace(`const [userFormData, setUserFormData] =`, `const [expandedPerms, setExpandedPerms] = useState<Record<string, boolean>>({});\n  const [userFormData, setUserFormData] =`);
}

// Define the permissions tree
const permTree = `const permissionsTree = [
  { id: 'view_dashboard', label: 'Dashboard', sub: [
    { id: 'dashboard', label: 'Main Dashboard' },
    { id: 'analytics', label: 'Analytics' }
  ]},
  { id: 'manage_orders', label: 'Orders & Sales', sub: [
    { id: 'sales', label: 'Sale' },
    { id: 'sale_return', label: 'Sale Return' },
    { id: 'orders', label: 'Orders & Docs' },
    { id: 'customers', label: 'Customers' },
    { id: 'quotations', label: 'Quotation System' }
  ]},
  { id: 'manage_inventory', label: 'Inventory & Purchases', sub: [
    { id: 'inventory', label: 'Inventory' },
    { id: 'purchases', label: 'Purchase' },
    { id: 'purchase_return', label: 'Purchase Return' },
    { id: 'vendors', label: 'Vendors / Suppliers' },
    { id: 'brands', label: 'Brands' }
  ]},
  { id: 'manage_finances', label: 'Accounting', sub: [
    { id: 'menus', label: 'Products Category' },
    { id: 'payment_accounts', label: 'Payment Account' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'tx_categories', label: 'Tx Categories' },
    { id: 'manual_income', label: 'Manual Income' },
    { id: 'manual_expense', label: 'Manual Expense' },
    { id: 'ledger', label: 'Ledger' },
    { id: 'account_balance', label: 'Account Balance' },
    { id: 'account_statement', label: 'Account Statement' },
    { id: 'balance_sheet', label: 'Balance Sheet' },
    { id: 'trial_balance', label: 'Trial Balance' },
    { id: 'deposits_withdrawals', label: 'Deposits/Withdrawals' },
    { id: 'stock_accounting', label: 'Stock Accounting' }
  ]},
  { id: 'manage_reports', label: 'Reports', sub: [
    { id: 'reports', label: 'Sales Accounting' },
    { id: 'customer_receive_report', label: 'Customer Due/Receive' },
    { id: 'all_reports', label: 'All Reports' },
    { id: 'audit_logs', label: 'Audit Logs' }
  ]},
  { id: 'manage_services', label: 'Services & Hosting', sub: [
    { id: 'activeHostingAccounts', label: 'Active Accounts' },
    { id: 'supportTickets', label: 'Support Tickets' },
    { id: 'hostingBilling', label: 'Web Host Billing' }
  ]},
  { id: 'manage_marketing', label: 'Marketing', sub: [
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'discountCodes', label: 'Discounts' },
    { id: 'reviews', label: 'Reviews' }
  ]},
  { id: 'manage_hr', label: 'Human Resource', sub: [
    { id: 'users', label: 'App Access (Users)' },
    { id: 'employees', label: 'Employees' },
    { id: 'leave', label: 'Leave' },
    { id: 'salary', label: 'Salary Overview' }
  ]},
  { id: 'manage_settings', label: 'System & Settings', sub: [
    { id: 'internal_notes', label: 'Staff Notes' },
    { id: 'conveyance', label: 'Conveyance' },
    { id: 'settings', label: 'Settings' },
    { id: 'domainPricing', label: 'Domain Pricing' },
    { id: 'hosting_api_settings', label: 'Hosting API Settings' }
  ]}
];

const toggleExpand = (id: string) => {
  setExpandedPerms(prev => ({ ...prev, [id]: !prev[id] }));
};

const handleParentCheck = (parentItem: any, currentPerms: string[], onChange: (newPerms: string[]) => void) => {
  // If parent is already fully checked, uncheck all (parent + children)
  // Else check all (parent + children)
  const allChildIds = parentItem.sub.map((s: any) => s.id);
  const isFullyChecked = currentPerms.includes(parentItem.id) && allChildIds.every((id: string) => currentPerms.includes(id));
  
  let newPerms = [...currentPerms];
  
  if (isFullyChecked) {
    newPerms = newPerms.filter(p => p !== parentItem.id && !allChildIds.includes(p));
  } else {
    if (!newPerms.includes(parentItem.id)) newPerms.push(parentItem.id);
    allChildIds.forEach((id: string) => {
      if (!newPerms.includes(id)) newPerms.push(id);
    });
  }
  onChange(newPerms);
};

const handleChildCheck = (parentId: string, childId: string, currentPerms: string[], onChange: (newPerms: string[]) => void) => {
  let newPerms = [...currentPerms];
  if (newPerms.includes(childId)) {
    newPerms = newPerms.filter(p => p !== childId);
  } else {
    newPerms.push(childId);
    if (!newPerms.includes(parentId)) newPerms.push(parentId);
  }
  onChange(newPerms);
};
`;

if (!content.includes('const permissionsTree =')) {
  content = content.replace(`export const UsersTab = () => {`, `${permTree}\n\nexport const UsersTab = () => {`);
}

const renderTree = `permissionsTree.map((parent) => {
                    const isParentChecked = (currentPerms).includes(parent.id);
                    const allChildIds = parent.sub.map(s => s.id);
                    const isPartiallyChecked = !allChildIds.every(id => currentPerms.includes(id)) && allChildIds.some(id => currentPerms.includes(id)) || (isParentChecked && !allChildIds.every(id => currentPerms.includes(id)));
                    
                    return (
                      <div key={parent.id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                        <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                          <label className="flex items-center gap-3 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={isParentChecked || isPartiallyChecked}
                              ref={(el) => { if (el) el.indeterminate = isPartiallyChecked && !isParentChecked; }}
                              onChange={() => handleParentCheck(parent, currentPerms, onChangePerms)}
                              className="rounded text-[#EF4444] focus:ring-[#EF4444]"
                            />
                            <span className="font-bold text-sm text-gray-800">{parent.label}</span>
                          </label>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); toggleExpand(parent.id); }}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            {expandedPerms[parent.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </div>
                        
                        {expandedPerms[parent.id] && (
                          <div className="p-3 border-t border-gray-100 bg-white grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {parent.sub.map(child => (
                              <label key={child.id} className="flex items-center gap-2 cursor-pointer text-sm p-1.5 hover:bg-gray-50 rounded">
                                <input
                                  type="checkbox"
                                  checked={currentPerms.includes(child.id) || currentPerms.includes(parent.id)}
                                  onChange={() => handleChildCheck(parent.id, child.id, currentPerms, onChangePerms)}
                                  className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-600">{child.label}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}`;

// Update edit modal
const editModalRegex = /\{\[\s*\{\s*id: 'view_dashboard'[\s\S]*?\}\s*\)\s*;\s*\}\)\}/m;
content = content.replace(editModalRegex, `
                  {(() => {
                    const currentPerms = editingUserPermissions.permissions || [];
                    const onChangePerms = (newPerms: string[]) => {
                      setEditingUserPermissions({...editingUserPermissions, permissions: newPerms});
                    };
                    return ${renderTree};
                  })()}
`);

// Update add user modal
const addUserRegex = /\{\[\s*\{\s*id: 'view_dashboard'[\s\S]*?\}\s*\)\s*\)\}/m;
content = content.replace(addUserRegex, `
                  {(() => {
                    const currentPerms = userFormData.permissions || [];
                    const onChangePerms = (newPerms: string[]) => {
                      setUserFormData({...userFormData, permissions: newPerms});
                    };
                    return ${renderTree.replace(/text-\[\#EF4444\] focus:ring-\[\#EF4444\]/g, 'text-blue-600 focus:ring-blue-500')};
                  })()}
`);

// Remove grid containers
content = content.replace(/<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">/g, '<div className="flex flex-col gap-3 mb-6 max-h-[60vh] overflow-y-auto pr-2">');
content = content.replace(/<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-2 border border-gray-200 rounded-md">/g, '<div className="flex flex-col gap-3 max-h-80 overflow-y-auto p-2 border border-gray-200 rounded-md">');
content = content.replace(/<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2 border border-gray-200 rounded-md">/g, '<div className="flex flex-col gap-3 max-h-80 overflow-y-auto p-2 border border-gray-200 rounded-md">');


fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated Users.tsx with Accordion UI');
