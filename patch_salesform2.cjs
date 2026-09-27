const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', 'utf8');

if (!content.includes('auth } from')) {
    content = content.replace(
        "import { db } from '../../../../firebase';",
        "import { db, auth } from '../../../../firebase';"
    );
}

content = content.replace(
    "userId: 'admin',\n        notes: saleData.notes || '',\n        createdAt,",
    "userId: 'admin',\n        notes: saleData.notes || '',\n        createdAt,\n        createdBy: auth.currentUser?.displayName || auth.currentUser?.email || 'Admin',"
);

fs.writeFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', content, 'utf8');
console.log('Patched SalesForm.tsx');