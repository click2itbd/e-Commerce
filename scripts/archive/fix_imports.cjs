const fs = require('fs');

const files = [
  { path: 'src/pages/hosting-dashboard/tabs/AllOrdersTab.tsx', imp: "import { Spinner, Pagination } from '../components/SharedUI';\n" },
  { path: 'src/pages/hosting-dashboard/tabs/DomainSearchListTab.tsx', imp: "import { Spinner, Pagination } from '../components/SharedUI';\n" },
  { path: 'src/pages/hosting-dashboard/tabs/ServerAccountsTab.tsx', imp: "import { Spinner, StatusBadge, Modal } from '../components/SharedUI';\n" },
  { path: 'src/pages/hosting-dashboard/tabs/UsersTab.tsx', imp: "import { Spinner } from '../components/SharedUI';\n" }
];

for (const f of files) {
  let c = fs.readFileSync(f.path, 'utf8');
  if (!c.includes("import { Spinner")) {
    const lines = c.split('\n');
    let idx = lines.findIndex(l => l.includes('export function'));
    if (idx !== -1) {
      lines.splice(idx, 0, f.imp);
      fs.writeFileSync(f.path, lines.join('\n'));
      console.log('Fixed ' + f.path);
    }
  }
}
