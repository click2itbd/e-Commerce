const fs = require('fs');
const path = require('path');

const adminPath = 'C:/Users/User/OneDrive/Desktop/e-Commerce/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(adminPath, 'utf8');

// Map of tab names to component paths and component names
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

// Check which props exist in AdminDashboard state/handlers
function findPropInAdminDashboard(propName) {
  // Check if it's a state variable
  if (content.includes(`const [${propName},`)) return propName;
  if (content.includes(`const [${propName} ,`)) return propName;
  
  // Check if it's a setter function (setXxx)
  if (propName.startsWith('set') && content.includes(`const ${propName} =`)) return propName;
  
  // Check if it's a handler function
  if (content.includes(`const ${propName} =`)) return propName;
  
  // Check if it's imported
  if (content.includes(`import { ${propName} }`)) return propName;
  
  return null;
}

// For each tab, get the inline JSX block and replace it
for (const [tabName, componentInfo] of Object.entries(tabComponents)) {
  const props = getPropsFromComponent(componentInfo.path);
  if (!props) {
    console.log(`Skipping ${tabName}: no props interface found`);
    continue;
  }
  
  console.log(`${tabName}: props = ${props.join(', ')}`);
  
  // Find the inline JSX block for this tab
  // Pattern: ) : activeTab === 'xxx' ? (\n          <div ...>
  const startPattern = `) : activeTab === '${tabName}' ? (\n          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">`;
  const startIdx = content.indexOf(startPattern);
  
  if (startIdx === -1) {
    console.log(`  Skipping ${tabName}: start pattern not found`);
    continue;
  }
  
  // Find the end of this block by looking for the next tab marker
  const afterStart = startIdx + startPattern.length;
  const nextTabMatch = content.slice(afterStart).match(/\) : activeTab === '[^']+' \? \(/);
  
  let endIdx;
  if (nextTabMatch) {
    endIdx = afterStart + nextTabMatch.index;
  } else {
    // Try with hasPermission variants
    const nextTabMatch2 = content.slice(afterStart).match(/\) : activeTab === '[^']+' && [^(]+ \? \(/);
    if (nextTabMatch2) {
      endIdx = afterStart + nextTabMatch2.index;
    } else {
      console.log(`  Skipping ${tabName}: could not find end`);
      continue;
    }
  }
  
  // Generate props for the component
  const propStrings = [];
  for (const prop of props) {
    const adminName = findPropInAdminDashboard(prop);
    if (adminName) {
      propStrings.push(`${prop}={${adminName}}`);
    } else {
      // Try common transformations
      const alternatives = [
        prop,
        prop === 'vendors' ? 'vendors' : null,
        prop === 'menus' ? 'menus' : null,
        prop === 'products' ? 'products' : null,
        prop === 'customers' ? 'customers' : null,
        prop === 'orders' ? 'orders' : null,
        prop === 'settings' ? 'settings' : null,
        prop === 'loading' ? 'loading' : null,
        prop === 'hasPermission' ? 'hasPermission' : null,
        prop === 'isAdmin' ? 'isAdmin' : null,
        prop === 'formatCurrency' ? 'formatCurrency' : null,
        prop === 'fetchData' ? 'fetchData' : null,
        prop === 'setActiveTab' ? 'setActiveTab' : null,
        prop === 'setConfirmModal' ? 'setConfirmModal' : null,
      ].filter(Boolean);
      
      const found = alternatives.find(a => content.includes(`const [${a},`) || content.includes(`const ${a} =`));
      if (found) {
        propStrings.push(`${prop}={${found}}`);
      } else {
        console.log(`  Warning: prop ${prop} not found in AdminDashboard`);
      }
    }
  }
  
  const replacement = `        ) : activeTab === '${tabName}' ? (\n          <${componentInfo.name}\n            ${propStrings.join('\n            ')}\n          />`;
  
  content = content.slice(0, startIdx) + replacement + content.slice(endIdx);
  console.log(`  Replaced ${tabName}`);
}

console.log('Final length:', content.length);
fs.writeFileSync(adminPath, content);
