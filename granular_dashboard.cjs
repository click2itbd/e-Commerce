const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/AdminDashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace top-level permissions with specific sub-permissions on the buttons
content = content.replace(/hasPermission\('manage_orders'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('sales'\)\}/g, "hasPermission('sales') && (\n              <button onClick={() => setActiveTab('sales')}");
content = content.replace(/hasPermission\('manage_orders'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('sale_return'\)\}/g, "hasPermission('sale_return') && (\n              <button onClick={() => setActiveTab('sale_return')}");
content = content.replace(/hasPermission\('manage_orders'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('orders'\)\}/g, "hasPermission('orders') && (\n              <button onClick={() => setActiveTab('orders')}");
content = content.replace(/hasPermission\('manage_orders'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('customers'\)\}/g, "hasPermission('customers') && (\n              <button onClick={() => setActiveTab('customers')}");
content = content.replace(/hasPermission\('manage_orders'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('quotations'\)\}/g, "hasPermission('quotations') && (\n              <button onClick={() => setActiveTab('quotations')}");

content = content.replace(/hasPermission\('manage_inventory'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('inventory'\)\}/g, "hasPermission('inventory') && (\n              <button onClick={() => setActiveTab('inventory')}");
content = content.replace(/hasPermission\('manage_inventory'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('brands'\)\}/g, "hasPermission('brands') && (\n              <button onClick={() => setActiveTab('brands')}");
content = content.replace(/hasPermission\('manage_inventory'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('purchases'\)\}/g, "hasPermission('purchases') && (\n              <button onClick={() => setActiveTab('purchases')}");
content = content.replace(/hasPermission\('manage_inventory'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('purchase_return'\)\}/g, "hasPermission('purchase_return') && (\n              <button onClick={() => setActiveTab('purchase_return')}");
content = content.replace(/hasPermission\('manage_inventory'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('vendors'\)\}/g, "hasPermission('vendors') && (\n              <button onClick={() => setActiveTab('vendors')}");

content = content.replace(/hasPermission\('manage_finances'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('menus'\)\}/g, "hasPermission('menus') && (\n              <button onClick={() => setActiveTab('menus')}");
content = content.replace(/hasPermission\('manage_finances'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('payment_accounts'\)\}/g, "hasPermission('payment_accounts') && (\n              <button onClick={() => setActiveTab('payment_accounts')}");
content = content.replace(/hasPermission\('manage_finances'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('transactions'\)\}/g, "hasPermission('transactions') && (\n              <button onClick={() => setActiveTab('transactions')}");
content = content.replace(/hasPermission\('manage_finances'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('tx_categories'\)\}/g, "hasPermission('tx_categories') && (\n              <button onClick={() => setActiveTab('tx_categories')}");
content = content.replace(/hasPermission\('manage_finances'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('manual_income'\)\}/g, "hasPermission('manual_income') && (\n              <button onClick={() => setActiveTab('manual_income')}");
content = content.replace(/hasPermission\('manage_finances'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('manual_expense'\)\}/g, "hasPermission('manual_expense') && (\n              <button onClick={() => setActiveTab('manual_expense')}");
content = content.replace(/hasPermission\('manage_finances'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('ledger'\)\}/g, "hasPermission('ledger') && (\n              <button onClick={() => setActiveTab('ledger')}");
content = content.replace(/hasPermission\('manage_finances'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('account_balance'\)\}/g, "hasPermission('account_balance') && (\n              <button onClick={() => setActiveTab('account_balance')}");
content = content.replace(/hasPermission\('manage_finances'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('account_statement'\)\}/g, "hasPermission('account_statement') && (\n              <button onClick={() => setActiveTab('account_statement')}");
content = content.replace(/hasPermission\('manage_finances'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('balance_sheet'\)\}/g, "hasPermission('balance_sheet') && (\n              <button onClick={() => setActiveTab('balance_sheet')}");
content = content.replace(/hasPermission\('manage_finances'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('trial_balance'\)\}/g, "hasPermission('trial_balance') && (\n              <button onClick={() => setActiveTab('trial_balance')}");
content = content.replace(/hasPermission\('manage_finances'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('deposits_withdrawals'\)\}/g, "hasPermission('deposits_withdrawals') && (\n              <button onClick={() => setActiveTab('deposits_withdrawals')}");
content = content.replace(/hasPermission\('manage_finances'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('stock_accounting'\)\}/g, "hasPermission('stock_accounting') && (\n              <button onClick={() => setActiveTab('stock_accounting')}");

content = content.replace(/hasPermission\('manage_reports'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('reports'\)\}/g, "hasPermission('reports') && (\n              <button onClick={() => setActiveTab('reports')}");
content = content.replace(/hasPermission\('manage_reports'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('customer_receive_report'\)\}/g, "hasPermission('customer_receive_report') && (\n              <button onClick={() => setActiveTab('customer_receive_report')}");
content = content.replace(/hasPermission\('manage_reports'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('all_reports'\)\}/g, "hasPermission('all_reports') && (\n              <button onClick={() => setActiveTab('all_reports')}");
content = content.replace(/hasPermission\('manage_reports'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('auditLogs'\)\}/g, "hasPermission('audit_logs') && (\n              <button onClick={() => setActiveTab('auditLogs')}");

content = content.replace(/hasPermission\('manage_services'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('activeHostingAccounts'\)\}/g, "hasPermission('activeHostingAccounts') && (\n              <button onClick={() => setActiveTab('activeHostingAccounts')}");
content = content.replace(/hasPermission\('manage_services'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('supportTickets'\)\}/g, "hasPermission('supportTickets') && (\n              <button onClick={() => setActiveTab('supportTickets')}");
content = content.replace(/hasPermission\('manage_services'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('hostingBilling'\)\}/g, "hasPermission('hostingBilling') && (\n              <button onClick={() => setActiveTab('hostingBilling')}");

content = content.replace(/hasPermission\('manage_marketing'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('campaigns'\)\}/g, "hasPermission('campaigns') && (\n              <button onClick={() => setActiveTab('campaigns')}");
content = content.replace(/hasPermission\('manage_marketing'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('discountCodes'\)\}/g, "hasPermission('discountCodes') && (\n              <button onClick={() => setActiveTab('discountCodes')}");
content = content.replace(/hasPermission\('manage_marketing'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('reviews'\)\}/g, "hasPermission('reviews') && (\n              <button onClick={() => setActiveTab('reviews')}");

content = content.replace(/hasPermission\('manage_users'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('users'\)\}/g, "hasPermission('users') && (\n              <button onClick={() => setActiveTab('users')}");

content = content.replace(/hasPermission\('manage_hr'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('employees'\)\}/g, "hasPermission('employees') && (\n              <button onClick={() => setActiveTab('employees')}");
content = content.replace(/hasPermission\('manage_hr'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('leave'\)\}/g, "hasPermission('leave') && (\n              <button onClick={() => setActiveTab('leave')}");
content = content.replace(/hasPermission\('manage_hr'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('salary'\)\}/g, "hasPermission('salary') && (\n              <button onClick={() => setActiveTab('salary')}");

content = content.replace(/hasPermission\('manage_settings'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('settings'\)\}/g, "hasPermission('settings') && (\n              <button onClick={() => setActiveTab('settings')}");
content = content.replace(/hasPermission\('manage_settings'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('domainPricing'\)\}/g, "hasPermission('domainPricing') && (\n              <button onClick={() => setActiveTab('domainPricing')}");
content = content.replace(/hasPermission\('manage_settings'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('hosting_api_settings'\)\}/g, "hasPermission('hosting_api_settings') && (\n              <button onClick={() => setActiveTab('hosting_api_settings')}");
content = content.replace(/<button onClick=\{\(\) => setActiveTab\('internal_notes'\)\}/g, "{hasPermission('internal_notes') && (\n              <button onClick={() => setActiveTab('internal_notes')}");
content = content.replace(/Staff Notes\n                <\/button>/g, "Staff Notes\n                </button>\n              )}");
content = content.replace(/hasPermission\('manage_settings'\) && \(\s*<button onClick=\{\(\) => setActiveTab\('conveyance'\)\}/g, "hasPermission('conveyance') && (\n              <button onClick={() => setActiveTab('conveyance')}");

// Also some components conditionally render on activeTab and hasPermission
content = content.replace(/activeTab === 'account_statement' && hasPermission\('manage_finances'\)/g, "activeTab === 'account_statement' && hasPermission('account_statement')");
content = content.replace(/activeTab === 'transaction_history' && hasPermission\('manage_finances'\)/g, "activeTab === 'transaction_history' && hasPermission('transactions')");
content = content.replace(/activeTab === 'balance_sheet' && hasPermission\('manage_finances'\)/g, "activeTab === 'balance_sheet' && hasPermission('balance_sheet')");
content = content.replace(/activeTab === 'deposits_withdrawals' && hasPermission\('manage_finances'\)/g, "activeTab === 'deposits_withdrawals' && hasPermission('deposits_withdrawals')");
content = content.replace(/activeTab === 'stock_accounting' && hasPermission\('manage_finances'\)/g, "activeTab === 'stock_accounting' && hasPermission('stock_accounting')");
content = content.replace(/activeTab === 'account_balance' && hasPermission\('manage_finances'\)/g, "activeTab === 'account_balance' && hasPermission('account_balance')");
content = content.replace(/activeTab === 'trial_balance' && hasPermission\('manage_finances'\)/g, "activeTab === 'trial_balance' && hasPermission('trial_balance')");
content = content.replace(/activeTab === 'all_reports' && hasPermission\('manage_reports'\)/g, "activeTab === 'all_reports' && hasPermission('all_reports')");
content = content.replace(/activeTab === 'menus' && hasPermission\('manage_finances'\)/g, "activeTab === 'menus' && hasPermission('menus')");
content = content.replace(/activeTab === 'payment_accounts' && hasPermission\('manage_finances'\)/g, "activeTab === 'payment_accounts' && hasPermission('payment_accounts')");
content = content.replace(/activeTab === 'ledger' && hasPermission\('manage_finances'\)/g, "activeTab === 'ledger' && hasPermission('ledger')");
content = content.replace(/activeTab === 'manual_income' && hasPermission\('manage_finances'\)/g, "activeTab === 'manual_income' && hasPermission('manual_income')");
content = content.replace(/activeTab === 'manual_expense' && hasPermission\('manage_finances'\)/g, "activeTab === 'manual_expense' && hasPermission('manual_expense')");
content = content.replace(/activeTab === 'tx_categories' && hasPermission\('manage_finances'\)/g, "activeTab === 'tx_categories' && hasPermission('tx_categories')");
content = content.replace(/activeTab === 'reports' && hasPermission\('manage_reports'\)/g, "activeTab === 'reports' && hasPermission('reports')");
content = content.replace(/activeTab === 'customer_receive_report' && hasPermission\('manage_reports'\)/g, "activeTab === 'customer_receive_report' && hasPermission('customer_receive_report')");
content = content.replace(/activeTab === 'campaigns' && hasPermission\('manage_marketing'\)/g, "activeTab === 'campaigns' && hasPermission('campaigns')");
content = content.replace(/activeTab === 'discountCodes' && hasPermission\('manage_marketing'\)/g, "activeTab === 'discountCodes' && hasPermission('discountCodes')");
content = content.replace(/activeTab === 'reviews' && hasPermission\('manage_marketing'\)/g, "activeTab === 'reviews' && hasPermission('reviews')");
content = content.replace(/activeTab === 'settings' && hasPermission\('manage_settings'\)/g, "activeTab === 'settings' && hasPermission('settings')");

fs.writeFileSync(file, content, 'utf8');
console.log('AdminDashboard granular checks added');
