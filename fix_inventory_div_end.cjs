const fs = require('fs');
let file = 'src/pages/admin/tabs/inventory/Inventory.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '          </div>\n  );\n};',
  '          </div>\n        </div>\n  );\n};'
);

fs.writeFileSync(file, content, 'utf8');
