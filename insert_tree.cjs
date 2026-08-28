const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/admin/tabs/hr/Users.tsx');
let content = fs.readFileSync(file, 'utf8');

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

`;

if (!content.includes('const permissionsTree =')) {
  content = content.replace(`const UsersTab: React.FC = () => {`, `${permTree}\nconst UsersTab: React.FC = () => {`);
}

// Add toggleExpand, handleParentCheck, handleChildCheck inside UsersTab
const helperFns = `
  const toggleExpand = (id: string) => {
    setExpandedPerms(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleParentCheck = (parentItem: any, currentPerms: string[], onChange: (newPerms: string[]) => void) => {
    const allChildIds = parentItem.sub.map((s: any) => s.id);
    const isFullyChecked = currentPerms.includes(parentItem.id) || allChildIds.every((id: string) => currentPerms.includes(id));
    
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
      newPerms = newPerms.filter(p => p !== parentId); // Uncheck parent if any child is unchecked
    } else {
      newPerms.push(childId);
    }
    onChange(newPerms);
  };
`;

if (!content.includes('const handleParentCheck')) {
  content = content.replace(`const fetchData = async () => {`, `${helperFns}\n  const fetchData = async () => {`);
}


fs.writeFileSync(file, content, 'utf8');
console.log('Successfully inserted permissionsTree and helper functions');
