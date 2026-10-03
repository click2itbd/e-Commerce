const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');

const targetRegex = /<td className="px-6 py-4">\s*<div className="flex flex-col gap-1 items-start">\s*<span className="text-sm font-bold text-\[\#EF4444\]">\{formatCurrency\(order\.total, settings\)\}<\/span>\s*\{order\.paymentMethod && \(\s*<div className="flex flex-col gap-0\.5">\s*<span className="px-1\.5 py-0\.5 rounded-\[4px\] text-\[9px\] font-bold uppercase bg-gray-100 text-gray-600 inline-block w-fit">\s*\{order\.paymentMethod === 'cod' \? 'Cash on Delivery' :\s*order\.paymentMethod === 'bkash' \? 'bKash' :\s*order\.paymentMethod === 'nagad' \? 'Nagad' :\s*order\.paymentMethod === 'rocket' \? 'Rocket' :\s*order\.paymentMethod === 'bank' \? 'Bank Transfer' :\s*order\.paymentMethod === 'pos' \? 'POS' : 'Other Gateway'\}\s*<\/span>\s*<\/div>\s*\)\}\s*\{order\.discountAmount && order\.discountAmount > 0 && order\.items\?\.length \? \(\s*<div className="text-\[10px\] text-gray-400 line-through">\s*\{formatCurrency\(order\.items\.reduce\(\(acc: number, item: any\) => acc \+ \(item\.price \|\| 0\) \* \(item\.quantity \|\| 1\), 0\), settings\)\}\s*<\/div>\s*\) : null\}\s*<\/div>\s*<\/td>/;

const replacement = `<td className="px-6 py-4">
                            <div className="flex flex-col gap-1 items-start">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-gray-900">{formatCurrency(order.total, settings)}</span>
                                {order.paymentStatus === 'paid' && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase tracking-wider border border-green-200">Paid</span>}
                                {order.paymentStatus === 'partial' && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase tracking-wider border border-amber-200">Partial</span>}
                                {(order.paymentStatus === 'unpaid' || !order.paymentStatus) && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase tracking-wider border border-red-200">Due</span>}
                              </div>
                              <div className="text-[10.5px] text-gray-500 font-bold -mt-0.5">
                                Paid: <span className="text-gray-700">{formatCurrency(order.paidAmount || 0, settings)}</span>
                              </div>
                              {order.paymentMethod && (
                                <span className="px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase bg-gray-100 text-gray-600 inline-block w-fit mt-0.5">
                                  {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                                   order.paymentMethod === 'bkash' ? 'bKash' : 
                                   order.paymentMethod === 'nagad' ? 'Nagad' : 
                                   order.paymentMethod === 'rocket' ? 'Rocket' : 
                                   order.paymentMethod === 'bank' ? 'Bank Transfer' : 
                                   order.paymentMethod === 'pos' ? 'POS' : 'Other Gateway'}
                                </span>
                              )}
                              {order.discountAmount && order.discountAmount > 0 && order.items?.length ? (
                                <div className="text-[10px] text-gray-400 line-through">
                                  {formatCurrency(order.items.reduce((acc: number, item: any) => acc + (item.price || 0) * (item.quantity || 1), 0), settings)}
                                </div>
                              ) : null}
                            </div>
                          </td>`;

if (code.match(targetRegex)) {
    code = code.replace(targetRegex, replacement);
    fs.writeFileSync('src/pages/admin/tabs/sales/Orders.tsx', code, 'utf8');
    console.log("Updated Orders table payment status successfully");
} else {
    console.log("Regex did not match!");
}
