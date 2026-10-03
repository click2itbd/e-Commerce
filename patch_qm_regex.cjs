const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

const replacement = `<input 
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
                  )}`;

code = code.replace(/<input[\s\S]*?placeholder="Select or enter customer"\s*\/>\s*<datalist id="customer-list">\s*\{customers\.map[\s\S]*?<\/datalist>/, replacement);

// And we need to add relative class to the parent div
code = code.replace(/<div>\s*<label className="block text-sm font-bold text-gray-700 mb-1">Customer Name \*/, '<div className="relative">\n                  <label className="block text-sm font-bold text-gray-700 mb-1">Customer Name *');

fs.writeFileSync('src/components/QuotationManager.tsx', code);
console.log('Successfully applied regex replace to QM');
