const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', 'utf8');

code = code.replace(/<div className="grid grid-cols-1 md:grid-cols-4 gap-4">([\s\S]*?)<div className="flex gap-2">([\s\S]*?)<\/button>\s*<\/div>\s*<\/div>\s*<\/div>/, `<div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">$1</div>
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
                <div className="flex gap-2">$2</button>
                </div>
              </div>
            </div>`);

fs.writeFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', code, 'utf8');
console.log("Updated SalesForm layout with regex");
