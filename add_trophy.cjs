const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

if (!code.includes('Trophy,')) {
  code = code.replace(
    'import {',
    'import {\n  Trophy,'
  );
  fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
  console.log('Added Trophy import');
}
