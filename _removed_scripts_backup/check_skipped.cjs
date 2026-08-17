const fs = require('fs');
const content = fs.readFileSync('C:/Users/User/OneDrive/Desktop/e-Commerce/src/pages/AdminDashboard.tsx', 'utf8');

const skippedTabs = ['users', 'campaigns', 'discountCodes', 'hostingPlans', 'hostingServices', 'menus', 'ledger', 'reports', 'customer_receive_report', 'transactions', 'tx_categories', 'manual_income', 'manual_expense', 'payment_accounts', 'all_reports'];

for (const tab of skippedTabs) {
  const marker = `) : activeTab === '${tab}'`;
  const idx = content.indexOf(marker);
  if (idx !== -1) {
    console.log(`Tab: ${tab}`);
    console.log(content.slice(idx, idx + 150));
    console.log('---');
  } else {
    console.log(`Tab: ${tab} - NOT FOUND`);
  }
}
