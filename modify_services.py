import re

with open('src/pages/admin/tabs/services/Services.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update form defaults
default_form_data = """      status: 'received',
      equipmentType: 'Laptop',
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      serviceType: 'in_house' as 'in_house' | 'rma',
      vendorId: '',
      rmaStatus: 'Pending Vendor' as any,
      newSerialNumber: '',"""
new_default_form_data = default_form_data + """
      supplierName: '',
      supplierRmaStatus: 'not_sent',
      supplierRmaDate: '',
      supplierReturnDate: '',"""
content = content.replace(default_form_data, new_default_form_data)

# 2. Add RMA / Supplier Tracking section to the form
form_section = """                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Method</label>"""

rma_section = """                {/* RMA / Supplier Tracking Section */}
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 space-y-4">
                  <h4 className="font-bold text-indigo-900 border-b border-indigo-200 pb-2">RMA / Supplier Tracking</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-indigo-800 uppercase mb-1">Supplier Name</label>
                      <input
                        type="text"
                        value={serviceFormData.supplierName || ''}
                        onChange={e => setServiceFormData({ ...serviceFormData, supplierName: e.target.value })}
                        className="w-full border-indigo-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter supplier name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-indigo-800 uppercase mb-1">RMA Status</label>
                      <select
                        value={serviceFormData.supplierRmaStatus || 'not_sent'}
                        onChange={e => setServiceFormData({ ...serviceFormData, supplierRmaStatus: e.target.value as any })}
                        className="w-full border-indigo-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="not_sent">Not Sent</option>
                        <option value="sent_to_supplier">Sent to Supplier</option>
                        <option value="received_from_supplier">Received from Supplier</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-indigo-800 uppercase mb-1">Date Sent to Supplier</label>
                      <input
                        type="date"
                        value={serviceFormData.supplierRmaDate || ''}
                        onChange={e => setServiceFormData({ ...serviceFormData, supplierRmaDate: e.target.value })}
                        className="w-full border-indigo-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-indigo-800 uppercase mb-1">Date Received from Supplier</label>
                      <input
                        type="date"
                        value={serviceFormData.supplierReturnDate || ''}
                        onChange={e => setServiceFormData({ ...serviceFormData, supplierReturnDate: e.target.value })}
                        className="w-full border-indigo-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
"""
content = content.replace(form_section, rma_section + '\n' + form_section)

# 3. Add Quick Actions
actions_block = """                           {record.status === 'received' && (
                             <button onClick={() => updateServiceStatus(record, 'in_progress')} className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded transition-colors" title="Mark In Progress">
                               <Wrench size={12} /> Start Repair
                             </button>
                           )}"""

new_actions_block = """                           { (record.status === 'received' || record.status === 'in_progress') && (
                             <button onClick={() => {
                               const supplier = prompt('Enter Supplier Name:');
                               if (supplier !== null) {
                                 const docRef = doc(db, 'services', record.id);
                                 updateDoc(docRef, {
                                   status: 'sent_to_rma',
                                   supplierName: supplier,
                                   supplierRmaStatus: 'sent_to_supplier',
                                   supplierRmaDate: new Date().toISOString()
                                 }).then(() => { toast.success('Sent to RMA'); fetchServices(); });
                               }
                             }} className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded transition-colors" title="Send to RMA">
                               <Truck size={12} /> Send to RMA
                             </button>
                           )}
                           { record.status === 'sent_to_rma' && (
                             <button onClick={() => {
                                 const docRef = doc(db, 'services', record.id);
                                 updateDoc(docRef, {
                                   status: 'ready',
                                   supplierRmaStatus: 'received_from_supplier',
                                   supplierReturnDate: new Date().toISOString()
                                 }).then(() => { toast.success('Received from RMA'); fetchServices(); });
                             }} className="flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-2 py-1 rounded transition-colors" title="Receive from RMA">
                               <RefreshCw size={12} /> Receive from RMA
                             </button>
                           )}
""" + actions_block

content = content.replace(actions_block, new_actions_block)


# Write back
with open('src/pages/admin/tabs/services/Services.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
