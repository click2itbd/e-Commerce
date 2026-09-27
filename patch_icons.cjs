const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');
if(!content.includes('Copy,')) {
    content = content.replace("import { Receipt, Search", "import { Copy, Receipt, Search");
    fs.writeFileSync('src/pages/admin/tabs/sales/Orders.tsx', content, 'utf8');
}