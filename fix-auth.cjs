const fs = require('fs');
const file = 'src/context/AuthContext.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /'manage_inventory': \['inventory', 'menus', 'brands', 'purchases', 'purchase_return', 'vendors'\]/,
  "'manage_inventory': ['inventory', 'menus', 'brands', 'purchases', 'purchase_return', 'vendors', 'vendor_due_list']"
);

content = content.replace(
  /'manage_orders': \['sales', 'sale_return', 'orders', 'customers', 'quotations'\]/,
  "'manage_orders': ['sales', 'sale_return', 'orders', 'customers', 'quotations', 'customer_due_list']"
);

fs.writeFileSync(file, content);
console.log('Fixed AuthContext');
