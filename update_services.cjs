const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/services/Services.tsx', 'utf8');

// 1. Add fields to defaultFormData
code = code.replace(
  "      newSerialNumber: '',\n    };",
  "      newSerialNumber: '',\n      preparedBy: '',\n      receivedAt: new Date().toISOString().split('T')[0],\n    };"
);

// 2. Fix handleSaveService date handling
// First, find the place where it sets receivedAt: new Date().toISOString(),
code = code.replace(
  "        const serviceData = {\n          ...serviceFormData,\n          receivedAt: new Date().toISOString(),\n        };",
  "        const serviceData = {\n          ...serviceFormData,\n          receivedAt: serviceFormData.receivedAt ? (serviceFormData.receivedAt.includes('T') ? serviceFormData.receivedAt : new Date(serviceFormData.receivedAt).toISOString()) : new Date().toISOString(),\n        };"
);

// 3. Add Inputs to the form
// The right column starts around "Customer Phone" and "Service Charge"
const oldRightCol = `                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Customer Phone</label>
                      <input
                        type="text"
                        required
                        value={serviceFormData.customerPhone}
                        onChange={e => setServiceFormData({ ...serviceFormData, customerPhone: e.target.value })}
                        className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Service Charge</label>
                      <input
                        type="number"
                        required
                        value={serviceFormData.serviceCharge}
                        onChange={e => setServiceFormData({ ...serviceFormData, serviceCharge: Number(e.target.value) })}
                        className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                      />
                    </div>`;

const newRightCol = `                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Customer Phone</label>
                      <input
                        type="text"
                        required
                        value={serviceFormData.customerPhone}
                        onChange={e => setServiceFormData({ ...serviceFormData, customerPhone: e.target.value })}
                        className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Service Charge</label>
                      <input
                        type="number"
                        required
                        value={serviceFormData.serviceCharge}
                        onChange={e => setServiceFormData({ ...serviceFormData, serviceCharge: Number(e.target.value) })}
                        className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prepared By</label>
                      <input
                        type="text"
                        value={serviceFormData.preparedBy || ''}
                        onChange={e => setServiceFormData({ ...serviceFormData, preparedBy: e.target.value })}
                        className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                        placeholder="Staff name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                      <input
                        type="date"
                        value={serviceFormData.receivedAt?.split('T')[0] || ''}
                        onChange={e => setServiceFormData({ ...serviceFormData, receivedAt: e.target.value })}
                        className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                      />
                    </div>`;

code = code.replace(oldRightCol, newRightCol);

// 4. Add Delete button logic
const deleteLogic = `
    const handleDeleteService = async (id: string) => {
      if (window.confirm('Are you sure you want to delete this service record?')) {
        try {
          await deleteDoc(doc(db, 'services', id));
          toast.success('Service record deleted successfully');
        } catch (error) {
          console.error('Error deleting service:', error);
          toast.error('Failed to delete service record');
        }
      }
    };
`;
// Insert before "const printServiceReceipt"
code = code.replace("    const printServiceReceipt = async", deleteLogic + "\n    const printServiceReceipt = async");

// Add Trash2 icon import
if (!code.includes('Trash2')) {
  code = code.replace(/import \{([^}]+)\} from 'lucide-react';/, "import { $1, Trash2 } from 'lucide-react';");
}

// Add the delete button next to edit button
const oldActions = `                               <button onClick={() => {
                                 setEditingService(record);
                                 setServiceFormData({
                                   ...defaultFormData,
                                   ...record,
                                 });
                                 setIsAddingService(true);
                               }} className="text-gray-400 hover:text-blue-500 mx-1 p-1.5 transition-colors" title="Edit Service">
                                 <Edit size={16} />
                               </button>`;

const newActions = `                               <button onClick={() => {
                                 setEditingService(record);
                                 setServiceFormData({
                                   ...defaultFormData,
                                   ...record,
                                   receivedAt: record.receivedAt ? record.receivedAt.split('T')[0] : new Date().toISOString().split('T')[0],
                                 });
                                 setIsAddingService(true);
                               }} className="text-gray-400 hover:text-blue-500 mx-1 p-1.5 transition-colors" title="Edit Service">
                                 <Edit size={16} />
                               </button>
                               <button onClick={() => handleDeleteService(record.id)} className="text-gray-400 hover:text-red-500 mx-1 p-1.5 transition-colors" title="Delete Service">
                                 <Trash2 size={16} />
                               </button>`;
code = code.replace(oldActions, newActions);

fs.writeFileSync('src/pages/admin/tabs/services/Services.tsx', code);
console.log('Done modifying Services.tsx');
