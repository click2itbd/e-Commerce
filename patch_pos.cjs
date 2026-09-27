const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/POS/index.tsx', 'utf8');

content = content.replace(
    "userId: user?.uid || 'admin',",
    "userId: user?.uid || 'admin',\n        createdBy: user?.displayName || user?.email || 'Admin',"
);

fs.writeFileSync('src/pages/admin/POS/index.tsx', content, 'utf8');