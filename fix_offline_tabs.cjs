const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/AdminDashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `'crm', 'tasks', 'conveyance', 'salary', 'employees', 'leave'`,
  `'crm', 'tasks', 'conveyance', 'salary', 'employees', 'leave', 'internal_notes'`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Added internal_notes to OFFLINE_SHOP_TABS');
