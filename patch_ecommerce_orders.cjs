const fs = require('fs');
let content = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceOrders.tsx', 'utf8');

content = content.replace(
    "<h3 className=\"font-bold text-gray-900\">Order #{viewingOrder.documentNumber || viewingOrder.id.substring(0,8)}</h3>",
    "<div>\n                <h3 className=\"font-bold text-gray-900\">Order #{viewingOrder.documentNumber || viewingOrder.id.substring(0,8)}</h3>\n                {viewingOrder.createdBy && <p className=\"text-[10px] text-gray-500 uppercase font-semibold\">Handled By: {viewingOrder.createdBy}</p>}\n              </div>"
);

fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceOrders.tsx', content, 'utf8');
console.log('Patched EcommerceOrders.tsx view');