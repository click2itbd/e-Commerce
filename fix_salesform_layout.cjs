const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', 'utf8');

const target = `<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Date</label>
                <input
                  type="date"
                  value={saleData.date || ''}
                  onChange={e => setSaleData({ ...saleData, date: e.target.value })}
                  className="w-full h-[42px] border border-gray-200 rounded-lg px-3 font-bold text-gray-800 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Prepared By</label>
                <input
                  type="text"
                  placeholder="e.g. Fahad, Atik..."
                  value={saleData.createdBy || ''}
                  onChange={e => setSaleData({ ...saleData, createdBy: e.target.value })}
                  className="w-full h-[42px] border border-gray-200 rounded-lg px-3 font-bold text-gray-800 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Document Type</label>
                <select
                  value={saleData.type}
                  onChange={e => setSaleData({ ...saleData, type: e.target.value as any })}
                  className="w-full h-[42px] border border-gray-200 rounded-lg px-3 font-bold text-gray-800"
                >
                  <option value="invoice">Invoice</option>
                  <option value="challan">Challan</option>
                  <option value="quotation">Quotation</option>
                </select>
              </div>
              <div>
                {(() => {
                    let due = 0;
                    if (saleData.customerId && transactions) {
                        transactions.forEach(t => {
                            if (t.entityId === saleData.customerId) {
                                if (t.type === 'sale') due += Number(t.amount);
                                else if (t.type === 'payment_received' || t.type === 'return') due -= Number(t.amount);
                            }
                        });
                    }
                    return (
                      <label className="block font-bold text-gray-700 uppercase mb-1 flex justify-between">
                        <span>Customer <span className="text-red-500">*</span> (Must Select)</span>
                        {saleData.customerId && due > 0 && (
                          <span className="text-red-600 font-black text-[10px]">
                            Previous Due: {formatCurrency(due, settings)}
                          </span>
                        )}
                      </label>
                    );
                })()}
                <div className="flex gap-2">
                  <select
                    required
                    value={saleData.customerId}
                    onChange={e => handleCustomerChange(e.target.value)}
                    className="w-full h-[42px] border border-gray-200 rounded-lg px-3 font-bold text-gray-900 bg-white"
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCustomer(true)}
                    className="bg-[#081621] hover:bg-[#EF4444] text-white px-3 h-[42px] rounded-lg font-bold flex items-center gap-1 transition-all shrink-0"
                    title="Add New Customer"
                  >
                    <Plus size={16} /> New
                  </button>
                </div>
              </div>
            </div>`;

const replacement = `<div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    value={saleData.date || ''}
                    onChange={e => setSaleData({ ...saleData, date: e.target.value })}
                    className="w-full h-[42px] border border-gray-200 rounded-lg px-3 font-bold text-gray-800 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Prepared By</label>
                  <input
                    type="text"
                    placeholder="e.g. Fahad, Atik..."
                    value={saleData.createdBy || ''}
                    onChange={e => setSaleData({ ...saleData, createdBy: e.target.value })}
                    className="w-full h-[42px] border border-gray-200 rounded-lg px-3 font-bold text-gray-800 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Document Type</label>
                  <select
                    value={saleData.type}
                    onChange={e => setSaleData({ ...saleData, type: e.target.value as any })}
                    className="w-full h-[42px] border border-gray-200 rounded-lg px-3 font-bold text-gray-800"
                  >
                    <option value="invoice">Invoice</option>
                    <option value="challan">Challan</option>
                    <option value="quotation">Quotation</option>
                  </select>
                </div>
              </div>
              <div>
                {(() => {
                    let due = 0;
                    if (saleData.customerId && transactions) {
                        transactions.forEach(t => {
                            if (t.entityId === saleData.customerId) {
                                if (t.type === 'sale') due += Number(t.amount);
                                else if (t.type === 'payment_received' || t.type === 'return') due -= Number(t.amount);
                            }
                        });
                    }
                    return (
                      <label className="block font-bold text-gray-700 uppercase mb-1 flex justify-between">
                        <span>Customer <span className="text-red-500">*</span></span>
                        {saleData.customerId && due > 0 && (
                          <span className="text-red-600 font-black text-xs px-2 py-0.5 bg-red-50 border border-red-200 rounded-full">
                            Previous Due: {formatCurrency(due, settings)}
                          </span>
                        )}
                      </label>
                    );
                })()}
                <div className="flex gap-2">
                  <select
                    required
                    value={saleData.customerId}
                    onChange={e => handleCustomerChange(e.target.value)}
                    className="w-full h-[42px] border border-gray-200 rounded-lg px-3 font-bold text-gray-900 bg-white"
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCustomer(true)}
                    className="bg-[#081621] hover:bg-[#EF4444] text-white px-4 h-[42px] rounded-lg font-bold flex items-center gap-1.5 transition-all shrink-0"
                    title="Add New Customer"
                  >
                    <Plus size={16} /> New Customer
                  </button>
                </div>
              </div>
            </div>`;

if (code.includes('className="grid grid-cols-1 md:grid-cols-4 gap-4"')) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', code, 'utf8');
    console.log("Updated SalesForm layout");
} else {
    console.log("Could not find SalesForm target");
}
