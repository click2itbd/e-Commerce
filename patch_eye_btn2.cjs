const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');

const target = `<div className="flex items-center justify-end gap-2">`;
const replace = `<div className="flex items-center justify-end gap-2">
                            <button
                               onClick={(e) => { e.stopPropagation(); setViewingOrder(order); }}
                               className="p-1.5 px-3 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all flex items-center gap-1 text-xs font-bold border border-gray-200 bg-white shadow-sm"
                               title="View Order"
                             >
                               <Eye size={14} /> View
                             </button>`;

if (content.includes(target)) {
    content = content.replace(target, replace);
    fs.writeFileSync('src/pages/admin/tabs/sales/Orders.tsx', content, 'utf8');
    console.log('Injected Eye button successfully');
} else {
    console.log('Failed to find target');
}