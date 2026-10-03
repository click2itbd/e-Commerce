const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');

// Add import
const importStatement = "import EditOrderModal from '../../modals/EditOrderModal';\nimport { Edit2 } from 'lucide-react';\n";
if (!code.includes('EditOrderModal')) {
    code = code.replace(/import { Pagination } from '[^']+';/, match => importStatement + match);
}

// Add state
const statePattern = /const \[shippingModalOrder, setShippingModalOrder\] = useState<any \| null>\(null\);/;
if (code.match(statePattern)) {
    code = code.replace(statePattern, match => match + "\n  const [editingOrder, setEditingOrder] = useState<any | null>(null);");
}

// Add Edit button in actions
const actionsPattern = /<button\s+onClick=\{\(e\) => \{ e\.stopPropagation\(\); setViewingOrder\(order\); \}\}/;
if (code.match(actionsPattern)) {
    const editButton = `
                              <button
                                 onClick={(e) => { e.stopPropagation(); setEditingOrder(order); }}
                                 className="p-1.5 px-3 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-all flex items-center gap-1 text-xs font-bold border border-gray-200 bg-white shadow-sm"
                                 title="Edit Order"
                               >
                                 <Edit2 size={14} /> Edit
                               </button>
`;
    code = code.replace(actionsPattern, match => editButton + '                              ' + match);
}

// Add Modal render at the end
const modalPattern = /\{shippingModalOrder && \(/;
if (code.match(modalPattern)) {
    const editModalRender = `
      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSuccess={() => {
            setEditingOrder(null);
            fetchData();
          }}
        />
      )}
`;
    code = code.replace(modalPattern, match => editModalRender + '      ' + match);
}

fs.writeFileSync('src/pages/admin/tabs/sales/Orders.tsx', code, 'utf8');
console.log('Updated Orders.tsx');
