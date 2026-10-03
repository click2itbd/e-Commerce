const fs = require('fs');

// 1. QUOTATION MANAGER
let qm = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

// fix addCustomItem
qm = qm.replace(
  "        discount: Number(customItemForm.discount),\n        isCustomService: true,\n        category: 'Custom'",
  "        discount: Number(customItemForm.discount),\n        brand: customItemForm.brand || '',\n        warranty: customItemForm.warranty || '',\n        isCustomService: true,\n        category: 'Custom'"
);

// fix updateItem
qm = qm.replace(
  "    (newItems[idx] as any)[field] = value;\n    setFormData({ ...formData, items: newItems });\n  };",
  "    if (field === 'warranty') {\n      (newItems[idx] as any).warranty = value;\n      delete (newItems[idx] as any).warrantyMonths;\n      if (!(newItems[idx] as any).specs) (newItems[idx] as any).specs = {};\n      (newItems[idx] as any).specs.Warranty = value;\n    } else {\n      (newItems[idx] as any)[field] = value;\n    }\n    setFormData({ ...formData, items: newItems });\n  };"
);

// fix line item inputs
const oldTd = `                              <input 
                                type="text"
                                className="w-full border border-gray-200 p-1.5 rounded mt-1 text-xs text-gray-600 bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Description (Optional)"
                                value={item.description || ''}
                                onChange={e => updateItem(idx, 'description', e.target.value)}
                              />
                              {!(item as any).isCustomService && item.sku && (
                                 <div className="text-[10px] text-gray-400 font-normal mt-1">SKU: {item.sku}</div>
                              )}`;

const newTd = `                              <input 
                                type="text"
                                className="w-full border border-gray-200 p-1.5 rounded mt-1 text-xs text-gray-600 bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Description (Optional)"
                                value={item.description || ''}
                                onChange={e => updateItem(idx, 'description', e.target.value)}
                              />
                              <div className="grid grid-cols-2 gap-2 mt-1">
                                <input 
                                  type="text"
                                  className="w-full border border-gray-200 p-1.5 rounded text-xs text-gray-600 bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-1 focus:ring-indigo-500"
                                  placeholder="Brand (Optional)"
                                  value={item.brand || ''}
                                  onChange={e => updateItem(idx, 'brand', e.target.value)}
                                />
                                <input 
                                  type="text"
                                  className="w-full border border-gray-200 p-1.5 rounded text-xs text-gray-600 bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-1 focus:ring-indigo-500"
                                  placeholder="Warranty (Optional)"
                                  value={(item as any).warranty || (item as any).specs?.Warranty || ((item as any).warrantyMonths ? ((item as any).warrantyMonths > 12 ? \`\${(item as any).warrantyMonths / 12} Yrs\` : \`\${(item as any).warrantyMonths} Mos\`) : '') || ''}
                                  onChange={e => updateItem(idx, 'warranty', e.target.value)}
                                />
                              </div>
                              {!(item as any).isCustomService && item.sku && (
                                 <div className="text-[10px] text-gray-400 font-normal mt-1">SKU: {item.sku}</div>
                              )}`;
qm = qm.replace(oldTd, newTd);

// add showCustomerDropdown state
qm = qm.replace(
  "const [customers, setCustomers] = useState<Customer[]>([]);",
  "const [customers, setCustomers] = useState<Customer[]>([]);\n  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);"
);

// fix auto-save customer in handleSaveQuotation
qm = qm.replace(
  "        let docRefId = editingId;",
  "        const existingCustomer = customers.find(c => c.name.toLowerCase() === formData.customerName.toLowerCase());\n        if (!existingCustomer && formData.customerName.trim() !== '') {\n           await addDoc(collection(db, 'customers'), {\n             name: formData.customerName,\n             phone: formData.customerPhone || '',\n             email: formData.customerEmail || '',\n             address: formData.shippingAddress || '',\n             type: 'retail',\n             createdAt: new Date().toISOString()\n           });\n        }\n        let docRefId = editingId;"
);

// replace Customer Name input in QM with dropdown
const oldCustomerInputQM = `                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Customer Name *</label>
                  <input 
                    required 
                    list="customer-list"
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                    value={formData.customerName}
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
                    placeholder="Select or enter customer"
                  />
                  <datalist id="customer-list">
                    {customers.map(c => <option key={c.id} value={c.name} />)}
                  </datalist>
                </div>`;

const newCustomerInputQM = `                <div className="relative">
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
qm = qm.replace(oldCustomerInputQM, newCustomerInputQM);
fs.writeFileSync('src/components/QuotationManager.tsx', qm);

// 2. SERVICES
let srv = fs.readFileSync('src/pages/admin/tabs/services/Services.tsx', 'utf8');

srv = srv.replace(
  "const [vendors, setVendors] = useState<{id: string; name: string}[]>([]);",
  "const [vendors, setVendors] = useState<{id: string; name: string}[]>([]);\n  const [customers, setCustomers] = useState<any[]>([]);\n  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);"
);

srv = srv.replace(
  "setVendors(vendorsSnap.docs.map(v => ({ id: v.id, name: v.data().name })));",
  "setVendors(vendorsSnap.docs.map(v => ({ id: v.id, name: v.data().name })));\n        const custSnap = await getDocs(query(collection(db, 'customers')));\n        setCustomers(custSnap.docs.map(d => ({ id: d.id, ...d.data() })));"
);

srv = srv.replace(
  "      const serviceData = {\n        ...serviceFormData,\n        receivedAt: new Date().toISOString(),\n      };",
  "      const existingCustomer = customers.find(c => c.name.toLowerCase() === serviceFormData.customerName.toLowerCase());\n      if (!existingCustomer && serviceFormData.customerName.trim() !== '') {\n         await addDoc(collection(db, 'customers'), {\n           name: serviceFormData.customerName,\n           phone: serviceFormData.customerPhone || '',\n           email: '',\n           address: '',\n           type: 'retail',\n           createdAt: new Date().toISOString()\n         });\n      }\n      const serviceData = {\n        ...serviceFormData,\n        receivedAt: new Date().toISOString(),\n      };"
);

const oldCustomerInputSrv = `                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Customer Name</label>
                    <input
                      type="text"
                      required
                      value={serviceFormData.customerName}
                      onChange={e => setServiceFormData({ ...serviceFormData, customerName: e.target.value })}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    />
                  </div>`;

const newCustomerInputSrv = `                  <div className="relative">
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

srv = srv.replace(oldCustomerInputSrv, newCustomerInputSrv);
fs.writeFileSync('src/pages/admin/tabs/services/Services.tsx', srv);

console.log('Restored all patches securely!');
