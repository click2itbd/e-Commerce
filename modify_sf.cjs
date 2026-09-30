const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', 'utf8');

// Add to state
code = code.replace(/customerName: '',\s+customerPhone: '',/, "customerName: '',\n    workOrderNumber: '',\n    customerPhone: '',");

// Add to newOrder
code = code.replace(/customerName: saleData.customerName,\s+customerPhone: saleData.customerPhone \|\| '',/, "customerName: saleData.customerName,\n        workOrderNumber: saleData.workOrderNumber,\n        customerPhone: saleData.customerPhone || '',");

// Reset form
code = code.replace(/customerName: '',\s+customerPhone: '',/g, "customerName: '',\n        workOrderNumber: '',\n        customerPhone: '',");

// Add JSX input (in SalesForm there's a big Customer Information section, let's look for "Phone")
let inputReplacement = `placeholder="Phone"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">Work Order / PO No</label>
                <input
                  type="text"
                  value={saleData.workOrderNumber || ''}
                  onChange={(e) => setSaleData(prev => ({ ...prev, workOrderNumber: e.target.value }))}
                  placeholder="Optional Work Order/PO Number"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
                />
              </div>`;
code = code.replace(/placeholder="Phone"[\s\S]*?\/>\s+<\/div>/, inputReplacement);

fs.writeFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', code, 'utf8');
