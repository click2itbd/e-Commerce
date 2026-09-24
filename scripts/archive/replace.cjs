const fs = require('fs');
let content = fs.readFileSync('src/pages/hosting-dashboard/tabs/ServerAccountsTab.tsx', 'utf8');

const regex = /<span className=\{\`px-2 py-0\.5 rounded text-xs font-bold \$\{statusBadgeClass\(account\.status\)\}\`\}>\s*\{account\.status \|\| 'unknown'\}\s*<\/span>/;
content = content.replace(regex, "<StatusBadge status={account.status || 'unknown'} />");

fs.writeFileSync('src/pages/hosting-dashboard/tabs/ServerAccountsTab.tsx', content);
console.log('Done');
