const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const regexes = [
    // Tabs in sidebar
    { re: /\{\(isAdmin \|\| isManager\) && \(\s*<button onClick=\{\(\) => setActiveTab\('sales'\)\}/, repl: `{hasPermission('manage_orders') && (\n              <button onClick={() => setActiveTab('sales')}` },
    { re: /\{\(isAdmin \|\| isManager\) && \(\s*<button onClick=\{\(\) => setActiveTab\('sale_return'\)\}/, repl: `{hasPermission('manage_orders') && (\n              <button onClick={() => setActiveTab('sale_return')}` },
    { re: /\{\(isAdmin \|\| isManager\) && \(\s*<button onClick=\{\(\) => setActiveTab\('purchases'\)\}/, repl: `{hasPermission('manage_inventory') && (\n               <button onClick={() => setActiveTab('purchases')}` },
    { re: /\{\(isAdmin \|\| isManager\) && \(\s*<button onClick=\{\(\) => setActiveTab\('purchase_return'\)\}/, repl: `{hasPermission('manage_inventory') && (\n               <button onClick={() => setActiveTab('purchase_return')}` },
    { re: /\{\(isAdmin \|\| isManager\) && \(\s*<button onClick=\{\(\) => setActiveTab\('services'\)\}/, repl: `{hasPermission('manage_services') && (\n               <button onClick={() => setActiveTab('services')}` },
    { re: /\{\(isAdmin \|\| isManager\) && \(\s*<button onClick=\{\(\) => setActiveTab\('payment_accounts'\)\}/, repl: `{hasPermission('manage_finances') && (\n               <button onClick={() => setActiveTab('payment_accounts')}` },
    { re: /\{\(isAdmin \|\| isManager\) && \(\s*<button onClick=\{\(\) => setActiveTab\('ledger'\)\}/, repl: `{hasPermission('manage_finances') && (\n               <button onClick={() => setActiveTab('ledger')}` },
    { re: /\{\(isAdmin \|\| isManager\) && \(\s*<button onClick=\{\(\) => setActiveTab\('manual_income'\)\}/, repl: `{hasPermission('manage_finances') && (\n               <button onClick={() => setActiveTab('manual_income')}` },
    { re: /\{\(isAdmin \|\| isManager\) && \(\s*<button onClick=\{\(\) => setActiveTab\('manual_expense'\)\}/, repl: `{hasPermission('manage_finances') && (\n               <button onClick={() => setActiveTab('manual_expense')}` },
    { re: /\{\(isAdmin \|\| isManager\) && \(\s*<button onClick=\{\(\) => setActiveTab\('tx_categories'\)\}/, repl: `{hasPermission('manage_finances') && (\n               <button onClick={() => setActiveTab('tx_categories')}` },
    { re: /\{\(isAdmin \|\| isManager\) && \(\s*<button onClick=\{\(\) => setActiveTab\('reports'\)\}/, repl: `{hasPermission('manage_reports') && (\n               <button onClick={() => setActiveTab('reports')}` },
    { re: /\{\(isAdmin \|\| isManager\) && \(\s*<button onClick=\{\(\) => setActiveTab\('deposits_withdrawals'\)\}/, repl: `{hasPermission('manage_finances') && (\n               <button onClick={() => setActiveTab('deposits_withdrawals')}` },
    { re: /\{\(isAdmin \|\| isManager\) && \(\s*<button onClick=\{\(\) => setActiveTab\('account_balance'\)\}/, repl: `{hasPermission('manage_finances') && (\n               <button onClick={() => setActiveTab('account_balance')}` },
    { re: /\{\(isAdmin \|\| isManager\) && \(\s*<button onClick=\{\(\) => setActiveTab\('account_statement'\)\}/, repl: `{hasPermission('manage_finances') && (\n               <button onClick={() => setActiveTab('account_statement')}` },
    { re: /\{\(isAdmin \|\| isManager\) && \(\s*<button onClick=\{\(\) => setActiveTab\('balance_sheet'\)\}/, repl: `{hasPermission('manage_finances') && (\n               <button onClick={() => setActiveTab('balance_sheet')}` },
    { re: /\{\(isAdmin \|\| isManager\) && \(\s*<button onClick=\{\(\) => setActiveTab\('trial_balance'\)\}/, repl: `{hasPermission('manage_finances') && (\n               <button onClick={() => setActiveTab('trial_balance')}` },
    { re: /\{\(isAdmin \|\| isManager\) && \(\s*<button onClick=\{\(\) => setActiveTab\('transaction_history'\)\}/, repl: `{hasPermission('manage_finances') && (\n               <button onClick={() => setActiveTab('transaction_history')}` },
    { re: /\{\(isAdmin \|\| isManager\) && \(\s*<button onClick=\{\(\) => setActiveTab\('all_reports'\)\}/, repl: `{hasPermission('manage_reports') && (\n               <button onClick={() => setActiveTab('all_reports')}` },
    { re: /\{\(isAdmin \|\| isManager\) && \(\s*<button onClick=\{\(\) => setActiveTab\('campaigns'\)\}/, repl: `{hasPermission('manage_marketing') && (\n               <button onClick={() => setActiveTab('campaigns')}` },
    { re: /\{\(isAdmin \|\| isManager\) && \(\s*<button onClick=\{\(\) => setActiveTab\('discountCodes'\)\}/, repl: `{hasPermission('manage_marketing') && (\n               <button onClick={() => setActiveTab('discountCodes')}` },

    // Top action buttons that create new items
    { re: /\{\(isAdmin \|\| isManager\) && \(\s*<>\s*<button\s*onClick=\{\(\) => \{\s*setSaleFormData\(\{\s*type:/, repl: `{hasPermission('manage_orders') && (\n                  <>\n                    <button\n                      onClick={() => {\n                        setSaleFormData({\n                          type:` },
    { re: /\{\(isAdmin \|\| isManager\) && \(\s*<button\s*onClick=\{\(\) => \{\s*setSaleFormData/, repl: `{hasPermission('manage_orders') && (\n                  <button\n                    onClick={() => {\n                      setSaleFormData` },
    
    // Manage Finance actions
    { re: /\{\(isAdmin \|\| isManager\) && \(\s*<button\s*onClick=\{\(\) => \{\s*setTxFormData/, repl: `{hasPermission('manage_finances') && (\n                            <button\n                              onClick={() => {\n                                setTxFormData` },

    // Manage Settings actions
    { re: /\{\(isAdmin \|\| isManager\) && \(\s*<button\s*onClick=\{\(\) => \{\s*setSettingsFormData/, repl: `{hasPermission('manage_settings') && (\n                <button\n                  onClick={() => {\n                    setSettingsFormData` }
];

let changedCount = 0;
for (const r of regexes) {
    if (r.re.test(code)) {
        code = code.replace(r.re, r.repl);
        changedCount++;
    } else {
        console.log("No match for:", r.re);
    }
}
fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log('Total replacements:', changedCount);
