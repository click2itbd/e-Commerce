const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

code = code.replace(
`const TaskManagerTab = lazy(() =>
  import("./admin/tabs/hr/TaskManager").then((m) => ({ default: m.default }))
);`, ''
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log('Cleaned up lazy import');
