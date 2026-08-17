const fs = require('fs');

const filePath = 'src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add imports after the QuotationManager import
const importBlock = `import { QuotationManager } from '../components/QuotationManager';
import InventoryTab from './admin/tabs/inventory/Inventory';
import OrdersTab from './admin/tabs/sales/Orders';
import SettingsTab from './admin/tabs/others/Settings';
import MenusTab from './admin/tabs/menus/Menus';
import EmployeesTab from './admin/tabs/hr/Employees';
import LeaveTab from './admin/tabs/hr/Leave';
import SalaryTab from './admin/tabs/hr/Salary';
import CampaignsTab from './admin/tabs/marketing/Campaigns';
import DiscountCodesTab from './admin/tabs/marketing/DiscountCodes';
import UsersTab from './admin/tabs/hr/Users';
import HostingServicesTab from './admin/tabs/hosting/HostingServices';
import SalesForm from './admin/tabs/sales/SalesForm';
import QuotationManager from '../components/QuotationManager';`;

const newImportBlock = `import { QuotationManager } from '../components/QuotationManager';
import InventoryTab from './admin/tabs/inventory/Inventory';
import OrdersTab from './admin/tabs/sales/Orders';
import SettingsTab from './admin/tabs/others/Settings';
import MenusTab from './admin/tabs/menus/Menus';
import EmployeesTab from './admin/tabs/hr/Employees';
import LeaveTab from './admin/tabs/hr/Leave';
import SalaryTab from './admin/tabs/hr/Salary';
import CampaignsTab from './admin/tabs/marketing/Campaigns';
import DiscountCodesTab from './admin/tabs/marketing/DiscountCodes';
import UsersTab from './admin/tabs/hr/Users';
import HostingServicesTab from './admin/tabs/hosting/HostingServices';
import SalesForm from './admin/tabs/sales/SalesForm';
import ServicesTab from './admin/tabs/services/Services';
import AllReportsTab from './admin/tabs/accounting/AllReports';
import PaymentAccountsTab from './admin/tabs/accounting/PaymentAccounts';
import LedgerTab from './admin/tabs/accounting/Ledger';
import ManualIncomeTab from './admin/tabs/accounting/ManualIncome';
import ManualExpenseTab from './admin/tabs/accounting/ManualExpense';
import TxCategoriesTab from './admin/tabs/accounting/TransactionCategories';
import SalesReportTab from './admin/tabs/finance/SalesReport';
import PurchaseReturnTab from './admin/tabs/sales/PurchaseReturn';
import CustomersTab from './admin/tabs/sales/Customers';
import VendorsTab from './admin/tabs/purchase/Vendors';`;

content = content.replace(importBlock, newImportBlock);

// Tab replacements
const replacements = [
  // inventory - fix broken block
  {
    pattern: /\) : activeTab === 'inventory' \? \(\s*<InventoryTab \/>\s*<QuotationManager \/>\s*\) : activeTab === 'orders' \? \(/,
    replacement: ") : activeTab === 'inventory' ? (\n          <InventoryTab />\n        ) : activeTab === 'orders' ? ("
  },
  // orders
  {
    pattern: /\) : activeTab === 'orders' \? \(\s*<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">[\s\S]*?<\/div>\s*\) : activeTab === 'purchase_return' \? \(/,
    replacement: ") : activeTab === 'orders' ? (\n          <OrdersTab />\n        ) : activeTab === 'purchase_return' ? ("
  },
  // settings
  {
    pattern: /\) : activeTab === 'settings' && hasPermission\('manage_settings'\) \? \(\s*<div className="flex flex-col md:flex-row gap-6">[\s\S]*?<\/div>\s*\) : activeTab === 'services' \? \(/,
    replacement: ") : activeTab === 'settings' && hasPermission('manage_settings') ? (\n          <SettingsTab />\n        ) : activeTab === 'services' ? ("
  },
  // menus
  {
    pattern: /\) : activeTab === 'menus' && isAdmin \? \(\s*<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">[\s\S]*?<\/div>\s*\) : activeTab === 'hostingServices' && isAdmin \? \(/,
    replacement: ") : activeTab === 'menus' && isAdmin ? (\n          <MenusTab />\n        ) : activeTab === 'hostingServices' && isAdmin ? ("
  },
  // all_reports
  {
    pattern: /\) : activeTab === 'all_reports' && hasPermission\('manage_reports'\) \? \(\s*<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">[\s\S]*?<\/div>\s*\) : activeTab === 'menus' && isAdmin \? \(/,
    replacement: ") : activeTab === 'all_reports' && hasPermission('manage_reports') ? (\n          <AllReportsTab />\n        ) : activeTab === 'menus' && isAdmin ? ("
  },
  // employees
  {
    pattern: /\) : activeTab === 'employees' \? \(\s*<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">[\s\S]*?<\/div>\s*\) : activeTab === 'leave' \? \(/,
    replacement: ") : activeTab === 'employees' ? (\n          <EmployeesTab />\n        ) : activeTab === 'leave' ? ("
  },
  // leave
  {
    pattern: /\) : activeTab === 'leave' \? \(\s*<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">[\s\S]*?<\/div>\s*\) : activeTab === 'salary' \? \(/,
    replacement: ") : activeTab === 'leave' ? (\n          <LeaveTab />\n        ) : activeTab === 'salary' ? ("
  },
  // salary
  {
    pattern: /\) : activeTab === 'salary' \? \(\s*<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">[\s\S]*?<\/div>\s*\) : \(/,
    replacement: ") : activeTab === 'salary' ? (\n          <SalaryTab />\n        ) : ("
  },
  // campaigns
  {
    pattern: /\) : activeTab === 'campaigns' && hasPermission\('manage_marketing'\) \? \(\s*<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">[\s\S]*?<\/div>\s*\) : activeTab === 'discountCodes' && hasPermission\('manage_marketing'\) \? \(/,
    replacement: ") : activeTab === 'campaigns' && hasPermission('manage_marketing') ? (\n          <CampaignsTab />\n        ) : activeTab === 'discountCodes' && hasPermission('manage_marketing') ? ("
  },
  // discountCodes
  {
    pattern: /\) : activeTab === 'discountCodes' && hasPermission\('manage_marketing'\) \? \(\s*<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">[\s\S]*?<\/div>\s*\) : activeTab === 'hostingPlans' && isAdmin \? \(/,
    replacement: ") : activeTab === 'discountCodes' && hasPermission('manage_marketing') ? (\n          <DiscountCodesTab />\n        ) : activeTab === 'hostingPlans' && isAdmin ? ("
  },
  // users
  {
    pattern: /\) : activeTab === 'users' && isAdmin \? \(\s*<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">[\s\S]*?<\/div>\s*\) : activeTab === 'settings' && hasPermission\('manage_settings'\) \? \(/,
    replacement: ") : activeTab === 'users' && isAdmin ? (\n          <UsersTab />\n        ) : activeTab === 'settings' && hasPermission('manage_settings') ? ("
  },
  // hostingServices
  {
    pattern: /\) : activeTab === 'hostingServices' && isAdmin \? \(\s*<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">[\s\S]*?<\/div>\s*\) : activeTab === 'settings' && hasPermission\('manage_settings'\) \? \(/,
    replacement: ") : activeTab === 'hostingServices' && isAdmin ? (\n          <HostingServicesTab />\n        ) : activeTab === 'settings' && hasPermission('manage_settings') ? ("
  },
  // services
  {
    pattern: /\) : activeTab === 'services' \? \(\s*<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">[\s\S]*?<\/div>\s*\) : activeTab === 'payment_accounts' && hasPermission\('manage_finances'\) \? \(/,
    replacement: ") : activeTab === 'services' ? (\n          <ServicesTab />\n        ) : activeTab === 'payment_accounts' && hasPermission('manage_finances') ? ("
  },
];

for (const r of replacements) {
  content = content.replace(r.pattern, r.replacement);
}

fs.writeFileSync(filePath, content);
console.log('Replacements done!');
