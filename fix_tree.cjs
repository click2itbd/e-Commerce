const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/admin/tabs/hr/Users.tsx');
let content = fs.readFileSync(file, 'utf8');

const permTreeReplacement = `const permissionsTree = [
  { id: 'view_dashboard', label: 'Overview', sub: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'analytics', label: 'Analytics' }
  ]},
  { id: 'manage_inventory', label: 'Stock', sub: [
    { id: 'inventory', label: 'Inventory' },
    { id: 'menus', label: 'Products Category' },
    { id: 'brands', label: 'Brands' }
  ]},
  { id: 'manage_orders', label: 'Sale & Customer', sub: [
    { id: 'sales', label: 'Sale (POS)' },
    { id: 'sale_return', label: 'Sale Return' },
    { id: 'orders', label: 'Orders & Docs' },
    { id: 'customers', label: 'Customer' },
    { id: 'quotations', label: 'Quotation System' }
  ]},
  { id: 'manage_purchases', label: 'Purchase & Supplier', sub: [
    { id: 'purchases', label: 'Purchase' },
    { id: 'purchase_return', label: 'Purchase Return' },
    { id: 'vendors', label: 'Supplier' }
  ]},
  { id: 'manage_services', label: 'Domain & Web Hosting', sub: [
    { id: 'hostingOrders', label: 'Hosting Orders' },
    { id: 'activeHostingAccounts', label: 'Active Accounts' },
    { id: 'domainPricing', label: 'Domain Pricing & TLD Rates' },
    { id: 'hostingPlans', label: 'Hosting Packages' },
    { id: 'domainOffers', label: 'Domain Offer Request' },
    { id: 'domainRenewals', label: 'Domain Renewals' },
    { id: 'supportTickets', label: 'Support Tickets' },
    { id: 'hosting_api_settings', label: 'Hosting API Settings' },
    { id: 'hostingBilling', label: 'Web Host Billing' }
  ]},
  { id: 'manage_marketing', label: 'Marketing & Feedback', sub: [
    { id: 'campaigns', label: 'Marketing' },
    { id: 'discountCodes', label: 'Discounts' },
    { id: 'reviews', label: 'Reviews' }
  ]},
  { id: 'manage_hr', label: 'Human Resource', sub: [
    { id: 'users', label: 'App Access' },
    { id: 'employees', label: 'Employees' },
    { id: 'leave', label: 'Leave' },
    { id: 'salary', label: 'Salary Overview' }
  ]},
  { id: 'manage_finances', label: 'Accounting', sub: [
    { id: 'internal_notes', label: 'Staff Notes' },
    { id: 'payment_accounts', label: 'Payment Account' },
    { id: 'ledger', label: 'Ledger' },
    { id: 'manual_income', label: 'Income' },
    { id: 'manual_expense', label: 'Expense' },
    { id: 'tx_categories', label: 'Categories' },
    { id: 'reports', label: 'Sales Accounting' },
    { id: 'stock_accounting', label: 'Stock Accounting' },
    { id: 'customer_receive_report', label: 'Receive Report' },
    { id: 'deposits_withdrawals', label: 'Deposit/Withdraw' },
    { id: 'account_balance', label: 'Account Balance' },
    { id: 'account_statement', label: 'Account Statement' },
    { id: 'balance_sheet', label: 'Balance Sheet' },
    { id: 'trial_balance', label: 'Trial Balance' },
    { id: 'transaction_history', label: 'Transaction History' },
    { id: 'all_reports', label: 'All Reports' }
  ]},
  { id: 'manage_settings', label: 'System & Settings', sub: [
    { id: 'crm', label: 'CRM System' },
    { id: 'tasks', label: 'To-Do List' },
    { id: 'audit_logs', label: 'Audit Logs' },
    { id: 'settings', label: 'Settings' }
  ]}
];`;

const treeRegex = /const permissionsTree = \[\s*\{[\s\S]*?\}\s*\];/;
if (treeRegex.test(content)) {
  content = content.replace(treeRegex, permTreeReplacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Replaced tree');
} else {
  console.log('Could not find tree to replace');
}
