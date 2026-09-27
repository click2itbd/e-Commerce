const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');

if (!content.includes('import { Eye')) {
    content = content.replace("import { ChevronDown", "import { Eye, ChevronDown");
}

const target = `
                            {(order.status === 'shipped' || order.status === 'delivered' || order.courierName) && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setShippingModalOrder(order); }}
                                className="p-1.5 px-3 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-all flex items-center gap-1 text-xs font-bold shadow-sm"
                                title="Shipping Details"
                              >
                                <Truck size={14} /> Shipping
                              </button>
                            )}
`;
const replace = `
                            <button
                               onClick={(e) => { e.stopPropagation(); setViewingOrder(order); }}
                               className="p-1.5 px-3 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all flex items-center gap-1 text-xs font-bold border border-gray-200 bg-white shadow-sm"
                               title="View Order"
                             >
                               <Eye size={14} /> View
                             </button>
                            {(order.status === 'shipped' || order.status === 'delivered' || order.courierName) && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setShippingModalOrder(order); }}
                                className="p-1.5 px-3 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-all flex items-center gap-1 text-xs font-bold shadow-sm"
                                title="Shipping Details"
                              >
                                <Truck size={14} /> Shipping
                              </button>
                            )}
`;

content = content.replace(target, replace);
fs.writeFileSync('src/pages/admin/tabs/sales/Orders.tsx', content, 'utf8');
console.log('Added Eye button');