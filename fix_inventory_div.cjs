const fs = require('fs');
let file = 'src/pages/admin/tabs/inventory/Inventory.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '              </div>\n\n              {isAddingProduct || editingProduct ? (',
  '              </div>\n              </div>\n\n              {isAddingProduct || editingProduct ? ('
);

fs.writeFileSync(file, content, 'utf8');
