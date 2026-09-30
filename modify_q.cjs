const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

// Add to state
code = code.replace(/documentNumber: '',\s+customerName: '',/, "documentNumber: '',\n      workOrderNumber: '',\n      customerName: '',");

// Add to updateData
code = code.replace(/customerName: formData.customerName,\s+customerPhone: formData.customerPhone,/, "customerName: formData.customerName,\n            workOrderNumber: formData.workOrderNumber,\n            customerPhone: formData.customerPhone,");

// Add to newQuotation
code = code.replace(/documentNumber: docNumber,\s+customerName: formData.customerName,/, "documentNumber: docNumber,\n            workOrderNumber: formData.workOrderNumber,\n            customerName: formData.customerName,");

// Add to openEdit
code = code.replace(/documentNumber: q.documentNumber \|\| '',\s+customerName: q.customerName \|\| '',/g, "documentNumber: q.documentNumber || '',\n        workOrderNumber: q.workOrderNumber || '',\n        customerName: q.customerName || '',");

// Add JSX input
let inputReplacement = `placeholder="Customer phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Work Order No</label>
                  <input 
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                    value={formData.workOrderNumber || ''}
                    onChange={e => setFormData({ ...formData, workOrderNumber: e.target.value })}
                    placeholder="Optional Work Order/PO Number"
                  />
                </div>`;
code = code.replace(/placeholder="Customer phone number"[\s\S]*?\/>\s+<\/div>/, inputReplacement);

fs.writeFileSync('src/components/QuotationManager.tsx', code, 'utf8');
