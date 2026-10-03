const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', 'utf8');

if (!code.includes("transactions?: any[];")) {
  code = code.replace(/customers: Customer\[\];/, "customers: Customer[];\n  transactions?: any[];");
  code = code.replace(/customers,\n  discountCodes,/, "customers,\n  transactions = [],\n  discountCodes,");
  
  const targetDueCalc = `<label className="block font-bold text-gray-700 uppercase mb-1 flex justify-between">
                  <span>Customer <span className="text-red-500">*</span> (Must Select)</span>
                  {saleData.customerId && (
                    <span className="text-red-600 font-black text-[10px]">
                      Previous Due: {formatCurrency(customers.find(c => c.id === saleData.customerId)?.due || 0, settings)}
                    </span>
                  )}
                </label>`;
                
  const replacementDueCalc = `{(() => {
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
                })()}`;
                
  code = code.replace(targetDueCalc, replacementDueCalc);
  fs.writeFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', code, 'utf8');
  console.log("Updated SalesForm for transactions");
}
