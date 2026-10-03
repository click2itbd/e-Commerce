const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');

const target = `<td className="px-6 py-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="text-sm font-bold text-[#EF4444]">{formatCurrency(order.total, settings)}</span>
                              {order.paymentMethod && (
                                <div className="flex flex-col gap-0.5">
                                  <span className="px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase bg-gray-100 text-gray-600 inline-block w-fit">
                                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                                     order.paymentMethod === 'bkash' ? 'bKash' : 
                                     order.paymentMethod === 'nagad' ? 'Nagad' : 
                                     order.paymentMethod === 'rocket' ? 'Rocket' : 
                                     order.paymentMethod === 'bank' ? 'Bank Transfer' : 
                                     order.paymentMethod === 'pos' ? 'POS' : 'Other Gateway'}
                                  </span>
                                </div>
                              )}
                              {order.discountAmount && order.discountAmount > 0 && order.items?.length ? (
                                <div className="text-[10px] text-gray-400 line-through">
                                  {formatCurrency(order.items.reduce((acc: number, item: any) => acc + (item.price || 0) * (item.quantity || 1), 0), settings)}
                                </div>
                              ) : null}
                            </div>
                          </td>`;

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

if (code.includes('<span className="text-sm font-bold text-[#EF4444]">{formatCurrency(order.total, settings)}</span>')) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/pages/admin/tabs/sales/Orders.tsx', code, 'utf8');
    console.log("Updated Orders table payment status");
} else {
    console.log("Could not find target block");
}
