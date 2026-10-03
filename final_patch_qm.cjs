const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

// Also do baseline patch for QM
code = code.replace(
  "        discount: Number(customItemForm.discount),\n        isCustomService: true,\n        category: 'Custom'",
  "        discount: Number(customItemForm.discount),\n        brand: customItemForm.brand || '',\n        warranty: customItemForm.warranty || '',\n        isCustomService: true,\n        category: 'Custom'"
);

code = code.replace(
  "    (newItems[idx] as any)[field] = value;\n    setFormData({ ...formData, items: newItems });\n  };",
  "    if (field === 'warranty') {\n      (newItems[idx] as any).warranty = value;\n      delete (newItems[idx] as any).warrantyMonths;\n      if (!(newItems[idx] as any).specs) (newItems[idx] as any).specs = {};\n      (newItems[idx] as any).specs.Warranty = value;\n    } else {\n      (newItems[idx] as any)[field] = value;\n    }\n    setFormData({ ...formData, items: newItems });\n  };"
);

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
code = code.replace(oldTd, newTd);

code = code.replace(
  "const [customers, setCustomers] = useState<Customer[]>([]);",
  "const [customers, setCustomers] = useState<Customer[]>([]);\n  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);"
);

code = code.replace(
  "        let docRefId = editingId;",
  "        const existingCustomer = customers.find(c => c.name.toLowerCase() === formData.customerName.toLowerCase());\n        if (!existingCustomer && formData.customerName.trim() !== '') {\n           await addDoc(collection(db, 'customers'), {\n             name: formData.customerName,\n             phone: formData.customerPhone || '',\n             email: formData.customerEmail || '',\n             address: formData.shippingAddress || '',\n             type: 'retail',\n             createdAt: new Date().toISOString()\n           });\n        }\n        let docRefId = editingId;"
);

const exactOldBlock = `                <div>
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

const exactNewBlock = `                <div className="relative">
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

if (code.includes(exactOldBlock)) {
  code = code.replace(exactOldBlock, exactNewBlock);
  fs.writeFileSync('src/components/QuotationManager.tsx', code);
  console.log('REPLACED EXACT BLOCK');
} else {
  console.log('DID NOT FIND EXACT BLOCK');
}
