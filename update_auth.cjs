const fs = require('fs');
let content = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

const legacyMap = `const legacyMap: Record<string, string[]> = {
      'manage_inventory': ['inventory', 'menus', 'brands', 'purchases', 'purchase_return', 'vendors'],
      'manage_orders': ['sales', 'sale_return', 'orders', 'customers', 'quotations'],
      'manage_finances': ['internal_notes', 'payment_accounts', 'ledger', 'manual_income', 'manual_expense', 'tx_categories', 'stock_accounting', 'deposits_withdrawals', 'account_balance', 'account_statement', 'balance_sheet', 'trial_balance', 'transaction_history'],
      'manage_hr': ['users', 'employees', 'leave', 'salary'],
      'manage_services': ['hostingOrders', 'activeHostingAccounts', 'domainPricing', 'hostingPlans', 'domainOffers', 'domainRenewals', 'supportTickets', 'hosting_api_settings', 'hostingBilling', 'services'],
      'manage_marketing': ['campaigns', 'discountCodes', 'reviews'],
      'manage_reports': ['reports', 'all_reports', 'customer_receive_report'],
      'manage_settings': ['crm', 'tasks', 'audit_logs', 'settings']
    };

    if (isAdmin) return true;
    if (!profile?.permissions) return false;
    
    // Exact match
    if (profile.permissions.includes(permission)) return true;
    
    // Check legacy mappings
    for (const [legacyKey, granularPerms] of Object.entries(legacyMap)) {
      if (profile.permissions.includes(legacyKey as UserPermission) && granularPerms.includes(permission)) {
        return true;
      }
    }`;

// Replace the old hasPermission implementation
content = content.replace(
  /if \(isAdmin\) return true;\s*if \(\!profile\?\.permissions\) return false;\s*return profile\.permissions\.includes\(permission\);/,
  legacyMap
);

fs.writeFileSync('src/context/AuthContext.tsx', content, 'utf8');
console.log("Updated AuthContext.tsx with legacy mapping");
