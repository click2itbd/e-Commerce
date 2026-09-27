const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', 'utf8');

if (!content.includes('auth } from')) {
    content = content.replace(
        "import { db } from '../../../../firebase';",
        "import { db, auth } from '../../../../firebase';"
    );
}

const searchTarget = "createdAt: new Date().toISOString(),\n      };";
const targetIndex = content.indexOf(searchTarget);
if (targetIndex !== -1) {
    const replacement = "createdAt: new Date().toISOString(),\n        createdBy: auth.currentUser?.displayName || auth.currentUser?.email || 'Admin',\n      };";
    content = content.replace(searchTarget, replacement);
    fs.writeFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', content, 'utf8');
    console.log('Patched SalesForm.tsx');
} else {
    console.log('Target not found in SalesForm.tsx');
}