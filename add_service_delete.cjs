const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/services/Services.tsx', 'utf8');

// 1. Add Trash2 to imports
code = code.replace(
  "import { ShieldCheck, Search, Filter, Wrench, Printer, RefreshCw, X, Plus, Settings, FileText, Download, Edit2, Truck, CheckCircle, Clock, AlertCircle, Package, MessageCircle, ShoppingCart } from 'lucide-react';",
  "import { ShieldCheck, Search, Filter, Wrench, Printer, RefreshCw, X, Plus, Settings, FileText, Download, Edit2, Trash2, Truck, CheckCircle, Clock, AlertCircle, Package, MessageCircle, ShoppingCart } from 'lucide-react';"
);

// 2. Add handleDeleteService function before the return statement
const deleteFunc = `
  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this service record?')) return;
    try {
      await deleteDoc(doc(db, 'services', id));
      toast.success('Service record deleted');
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service record');
    }
  };
`;
code = code.replace(/const handleDeliverToPOS/, deleteFunc + "\n  const handleDeliverToPOS");

// 3. Add delete button after edit button
const editButtonStr = `<Edit2 size={14} />
                           </button>
                         </div>
                      </td>`;
const withDeleteStr = `<Edit2 size={14} />
                           </button>
                           <button onClick={() => handleDeleteService(record.id)} className="text-gray-500 hover:text-red-700 bg-gray-50 hover:bg-red-50 p-1.5 rounded shadow-sm transition-all" title="Delete Service">
                             <Trash2 size={14} />
                           </button>
                         </div>
                      </td>`;
code = code.replace(editButtonStr, withDeleteStr);

fs.writeFileSync('src/pages/admin/tabs/services/Services.tsx', code, 'utf8');
console.log("Added delete button to Services.tsx");
