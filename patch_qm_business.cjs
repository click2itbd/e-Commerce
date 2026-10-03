const fs = require('fs');
let qm = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

// 1. Restore addCustomItem payload
qm = qm.replace(
  "        discount: Number(customItemForm.discount),\n        isCustomService: true,\n        category: 'Custom'",
  "        discount: Number(customItemForm.discount),\n        brand: customItemForm.brand || '',\n        warranty: customItemForm.warranty || '',\n        isCustomService: true,\n        category: 'Custom'"
);

// 2. Restore updateItem logic for warranty
qm = qm.replace(
  "    (newItems[idx] as any)[field] = value;\n    setFormData({ ...formData, items: newItems });\n  };",
  "    if (field === 'warranty') {\n      (newItems[idx] as any).warranty = value;\n      delete (newItems[idx] as any).warrantyMonths;\n      if (!(newItems[idx] as any).specs) (newItems[idx] as any).specs = {};\n      (newItems[idx] as any).specs.Warranty = value;\n    } else {\n      (newItems[idx] as any)[field] = value;\n    }\n    setFormData({ ...formData, items: newItems });\n  };"
);

// 3. Restore the inline brand and warranty inputs in the table
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
if (qm.includes(oldTd)) {
  qm = qm.replace(oldTd, newTd);
}

// 4. Restore the auto-save customer in handleSaveQuotation
qm = qm.replace(
  "        let docRefId = editingId;",
  "        const existingCustomer = customers.find(c => c.name.toLowerCase() === formData.customerName.toLowerCase());\n        if (!existingCustomer && formData.customerName.trim() !== '') {\n           await addDoc(collection(db, 'customers'), {\n             name: formData.customerName,\n             phone: formData.customerPhone || '',\n             email: formData.customerEmail || '',\n             address: formData.shippingAddress || '',\n             type: 'retail',\n             createdAt: new Date().toISOString()\n           });\n        }\n        let docRefId = editingId;"
);

fs.writeFileSync('src/components/QuotationManager.tsx', qm);
console.log('Successfully restored QM business logic');
