const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

const newInputBlock = `                <div className="relative">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Customer Name *</label>
                  <input 
                    required 
                    autoComplete="off"
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                    value={formData.customerName}
                    onFocus={() => setShowCustomerDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                    onChange={e => {
                      const cName = e.target.value;
                      const c = customers.find(x => x.name === cName);
                      setFormData({
                        ...formData, 
                        customerName: cName,
                        customerPhone: c ? c.phone : formData.customerPhone,
                        customerEmail: c ? c.email : formData.customerEmail,
                        shippingAddress: c ? c.address : formData.shippingAddress
                      });
                    }}
                    placeholder="Type to search or add new..."
                  />
                  {showCustomerDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {customers.filter((c: any) => c.name.toLowerCase().includes(formData.customerName.toLowerCase())).length > 0 ? (
                        customers.filter((c: any) => c.name.toLowerCase().includes(formData.customerName.toLowerCase())).map((c: any) => (
                          <div 
                            key={c.id} 
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-50 last:border-0"
                            onClick={() => {
                              setFormData({
                                ...formData, 
                                customerName: c.name, 
                                customerPhone: c.phone || formData.customerPhone,
                                customerEmail: c.email || formData.customerEmail,
                                shippingAddress: c.address || formData.shippingAddress
                              });
                              setShowCustomerDropdown(false);
                            }}
                          >
                            <div className="font-bold text-sm text-gray-800">{c.name}</div>
                            {c.phone && <div className="text-xs text-gray-500">{c.phone}</div>}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-xs text-gray-500 italic">
                          No match found. Will be saved as new.
                        </div>
                      )}
                    </div>
                  )}
                </div>`;

const lines = code.split('\n');
const labelIndex = lines.findIndex(l => l.includes('<label className="block text-sm font-bold text-gray-700 mb-1">Customer Name *</label>'));

if (labelIndex !== -1) {
  // Replace from labelIndex - 1 (the wrapping <div>) to labelIndex + 17 (the closing </div>)
  lines.splice(labelIndex - 1, 18, newInputBlock);
  fs.writeFileSync('src/components/QuotationManager.tsx', lines.join('\n'));
  console.log('Successfully injected dropdown to QuotationManager.tsx');
} else {
  console.log('Could not find Customer Name label in QM');
}
