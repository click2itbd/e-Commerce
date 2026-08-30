const fs = require('fs');
let file = 'src/pages/admin/tabs/inventory/Inventory.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /\n\s*\}\)\)\}\n\s*<\/div>\n\s*\{isAddingProduct/g,
  "\n                ))}\n              </div>\n            </div>\n\n            {isAddingProduct"
);

fs.writeFileSync(file, content, 'utf8');
