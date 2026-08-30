const fs = require('fs');
let file = 'src/pages/admin/tabs/inventory/Inventory.tsx';
let content = fs.readFileSync(file, 'utf8');

// The exact string is:
//                 ))}
//               </div>
//   
//             {isAddingProduct || editingProduct ? (

content = content.replace(
  "              </div>\n  \n            {isAddingProduct",
  "              </div>\n            </div>\n  \n            {isAddingProduct"
);

fs.writeFileSync(file, content, 'utf8');
