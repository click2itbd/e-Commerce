const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/services/Services.tsx', 'utf8');

const exactNewBlock = `                  <div className="relative">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Customer Name</label>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      value={serviceFormData.customerName}
                      onFocus={() => setShowCustomerDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                      onChange={e => {
                        const cName = e.target.value;
                        const c = customers.find((x: any) => x.name === cName);
                        setServiceFormData({ 
                          ...serviceFormData, 
                          customerName: cName,
                          customerPhone: c ? c.phone : serviceFormData.customerPhone
                        });
                      }}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                      placeholder="Type to search or add new..."
                    />
                    {showCustomerDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {customers.filter((c: any) => c.name.toLowerCase().includes(serviceFormData.customerName.toLowerCase())).length > 0 ? (
                          customers.filter((c: any) => c.name.toLowerCase().includes(serviceFormData.customerName.toLowerCase())).map((c: any) => (
                            <div 
                              key={c.id} 
                              className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-50 last:border-0"
                              onClick={() => {
                                setServiceFormData({
                                  ...serviceFormData, 
                                  customerName: c.name, 
                                  customerPhone: c.phone || serviceFormData.customerPhone
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
const labelIdx = lines.findIndex(l => l.includes('<label className="block text-xs font-bold text-gray-500 uppercase mb-1">Customer Name</label>'));

if (labelIdx !== -1) {
  lines.splice(labelIdx - 1, 10, exactNewBlock);
  fs.writeFileSync('src/pages/admin/tabs/services/Services.tsx', lines.join('\n'));
  console.log('Spliced Services successfully');
}
