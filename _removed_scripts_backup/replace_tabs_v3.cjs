const fs = require('fs');
const path = 'C:/Users/User/OneDrive/Desktop/e-Commerce/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Map of tab names to component paths and names
const tabComponents = {
  'inventory': { path: 'src/pages/admin/tabs/inventory/Inventory.tsx', name: 'InventoryTab' },
  'orders': { path: 'src/pages/admin/tabs/sales/Orders.tsx', name: 'OrdersTab' },
  'purchase_return': { path: 'src/pages/admin/tabs/purchase/PurchaseReturn.tsx', name: 'PurchaseReturnTab' },
  'sale_return': { path: 'src/pages/admin/tabs/sales/SaleReturn.tsx', name: 'SaleReturnTab' },
  'purchases': { path: 'src/pages/admin/tabs/purchase/Purchases.tsx', name: 'PurchasesTab' },
  'customers': { path: 'src/pages/admin/tabs/finance/Customers.tsx', name: 'CustomersTab' },
  'vendors': { path: 'src/pages/admin/tabs/finance/Vendors.tsx', name: 'VendorsTab' },
  'services': { path: 'src/pages/admin/tabs/service/Services.tsx', name: 'ServicesTab' },
  'employees': { path: 'src/pages/admin/tabs/hr/Employees.tsx', name: 'EmployeesTab' },
  'leave': { path: 'src/pages/admin/tabs/hr/Leave.tsx', name: 'LeaveTab' },
  'salary': { path: 'src/pages/admin/tabs/hr/Salary.tsx', name: 'SalaryTab' },
  'settings': { path: 'src/pages/admin/tabs/others/Settings.tsx', name: 'SettingsTab' },
  'users': { path: 'src/pages/admin/tabs/hr/Users.tsx', name: 'UsersTab' },
  'campaigns': { path: 'src/pages/admin/tabs/marketing/Campaigns.tsx', name: 'CampaignsTab' },
  'discountCodes': { path: 'src/pages/admin/tabs/marketing/DiscountCodes.tsx', name: 'DiscountCodesTab' },
  'hostingPlans': { path: 'src/pages/admin/tabs/hosting/HostingPlans.tsx', name: 'HostingPlansTab' },
  'hostingServices': { path: 'src/pages/admin/tabs/hosting/HostingServices.tsx', name: 'HostingServicesTab' },
  'menus': { path: 'src/pages/admin/tabs/others/Menus.tsx', name: 'MenusTab' },
  'ledger': { path: 'src/pages/admin/tabs/accounting/Ledger.tsx', name: 'LedgerTab' },
  'reports': { path: 'src/pages/admin/tabs/accounting/Reports.tsx', name: 'ReportsTab' },
  'customer_receive_report': { path: 'src/pages/admin/tabs/accounting/CustomerReceiveReport.tsx', name: 'CustomerReceiveReportTab' },
  'transactions': { path: 'src/pages/admin/tabs/finance/Transactions.tsx', name: 'TransactionsTab' },
  'tx_categories': { path: 'src/pages/admin/tabs/accounting/TransactionCategories.tsx', name: 'TransactionCategoriesTab' },
  'manual_income': { path: 'src/pages/admin/tabs/accounting/ManualIncome.tsx', name: 'ManualIncomeTab' },
  'manual_expense': { path: 'src/pages/admin/tabs/accounting/ManualExpense.tsx', name: 'ManualExpenseTab' },
  'payment_accounts': { path: 'src/pages/admin/tabs/accounting/PaymentAccounts.tsx', name: 'PaymentAccountsTab' },
  'conveyance': { path: 'src/pages/admin/tabs/accounting/Conveyance.tsx', name: 'ConveyanceTab' },
  'all_reports': { path: 'src/pages/admin/tabs/finance/AllReports.tsx', name: 'AllReportsTab' },
};

// Extract props from component files
function getPropsFromComponent(componentPath) {
  const fullPath = 'C:/Users/User/OneDrive/Desktop/e-Commerce/' + componentPath;
  if (!fs.existsSync(fullPath)) return null;
  const compContent = fs.readFileSync(fullPath, 'utf8');
  const match = compContent.match(/interface\s+\w+Props\s*\{([^}]+)\}/);
  if (!match) return null;
  
  const propsBlock = match[1];
  const props = [];
  const propRegex = /(\w+)\s*[?:]?\s*(\([^)]*\)\s*=>\s*)?([^;]+);/g;
  let m;
  while ((m = propRegex.exec(propsBlock)) !== null) {
    props.push(m[1].trim());
  }
  return props;
}

// Check if a variable exists in AdminDashboard
function findPropSource(propName) {
  // Exact state match
  if (content.includes(`const [${propName},`)) return propName;
  if (content.includes(`const [${propName} ,`)) return propName;
  
  // Function/handler match
  if (content.includes(`const ${propName} =`)) return propName;
  
  // Import match
  if (content.includes(`import { ${propName} }`)) return propName;
  
  // Common props that exist
  const common = ['products', 'orders', 'customers', 'vendors', 'transactions', 'settings', 'loading', 'hasPermission', 'isAdmin', 'formatCurrency', 'cn', 'toast', 'fetchData', 'setActiveTab', 'setConfirmModal', 'fileInputRef', 'menus', 'discountCodes', 'soldSerials', 'serviceRecords', 'hostingPlans', 'hostingServices', 'employees', 'employeeLeaves', 'employeeSalaries', 'paymentAccounts', 'transactionCategories', 'campaigns', 'serialSelectionModal'];
  if (common.includes(propName)) return propName;
  
  return null;
}

// For each tab, replace inline JSX with component reference
for (const [tabName, componentInfo] of Object.entries(tabComponents)) {
  const props = getPropsFromComponent(componentInfo.path);
  if (!props) {
    console.log(`Skipping ${tabName}: no props interface found`);
    continue;
  }
  
  // Find the start of this tab's content
  const startMarker = `) : activeTab === '${tabName}' ? (`;
  const startIdx = content.indexOf(startMarker);
  
  if (startIdx === -1) {
    console.log(`Skipping ${tabName}: start marker not found`);
    continue;
  }
  
  // Find the end of this block - look for the next tab marker
  const afterStart = startIdx + startMarker.length;
  
  // Look for the next ) : activeTab === 'xxx' pattern
  const nextTabRegex = /\) : activeTab === '[^']+' \? \(/g;
  nextTabRegex.lastIndex = afterStart;
  const nextMatch = nextTabRegex.exec(content);
  
  if (!nextMatch) {
    console.log(`Skipping ${tabName}: could not find end marker`);
    continue;
  }
  
  const endIdx = nextMatch.index;
  
  // Generate props for the component
  const propStrings = [];
  for (const prop of props) {
    const adminName = findPropSource(prop);
    if (adminName) {
      propStrings.push(`${prop}={${adminName}}`);
    } else {
      console.log(`  Warning: prop ${prop} not found for ${tabName}`);
    }
  }
  
  const replacement = `${startMarker}\n          <${componentInfo.name}\n            ${propStrings.join('\n            ')}\n          />`;
  
  content = content.slice(0, startIdx) + replacement + content.slice(endIdx);
  console.log(`Replaced ${tabName}`);
}

console.log('Final length:', content.length);
fs.writeFileSync(path, content);
