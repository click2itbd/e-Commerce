const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/modals/EditOrderModal.tsx', 'utf8');

// Add to formData
code = code.replace(/customerEmail: order\.customerEmail \|\| '',/, "customerEmail: order.customerEmail || '',\n      createdBy: order.createdBy || 'Admin',");

// Add to updateDoc payload
code = code.replace(/customerEmail: formData\.customerEmail,/, "customerEmail: formData.customerEmail,\n        createdBy: formData.createdBy,");

// Add UI field
const uiTarget = `<div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name</label>`;
              
const uiReplacement = `<div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Prepared By (Staff Name)</label>
              <input type="text" value={formData.createdBy} onChange={e => setFormData({...formData, createdBy: e.target.value})} className="w-full border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Fahad, Atik, Muntasir..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name</label>`;

code = code.replace(uiTarget, uiReplacement);

fs.writeFileSync('src/pages/admin/modals/EditOrderModal.tsx', code, 'utf8');
console.log("Updated EditOrderModal");
