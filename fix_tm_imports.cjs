const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/hr/TaskManager.tsx', 'utf8');

code = code.replace(/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\//g, '../../../../');

fs.writeFileSync('src/pages/admin/tabs/hr/TaskManager.tsx', code);
console.log('Fixed imports in TaskManager.tsx');
