const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');

const expandedRowStr = `
                      {expandedOrderIds.has(order.id) && (
                        <tr className="bg-gray-50/30 border-b-2 border-gray-100">
                          <td colSpan={8} className="p-0">
                            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-inner bg-white/60 m-2 rounded-xl border border-gray-200">
                              <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><ShoppingBag size={14}/> Ordered Items</h4>
                                <ul className="space-y-2">
                                  {order.items?.map((item: any, i: number) => (
                                    <li key={i} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                                      <span className="font-medium text-gray-700">{item.name} <span className="text-gray-400">x{item.quantity}</span></span>
                                      <span className="font-bold text-gray-900">{formatCurrency((item.price || 0) * (item.quantity || 1), settings)}</span>
                                    </li>
                                  ))}
                                  {order.discountAmount > 0 && (
                                    <li className="flex justify-between items-center text-sm pt-1">
                                      <span className="font-medium text-[#EF4444]">Discount</span>
                                      <span className="font-bold text-[#EF4444]">- {formatCurrency(order.discountAmount, settings)}</span>
                                    </li>
                                  )}
                                  <li className="flex justify-between items-center text-sm pt-2 font-black text-lg">
                                    <span className="text-gray-900">Total</span>
                                    <span className="text-gray-900">{formatCurrency(order.total, settings)}</span>
                                  </li>
                                </ul>
                              </div>
                              <div className="space-y-4">
                                <div>
                                   <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><Truck size={14}/> Shipping & Tracking</h4>
                                   {order.shippingAddress ? <p className="text-sm text-gray-600 bg-gray-100 p-3 rounded-md mb-3 border border-gray-200">{order.shippingAddress}</p> : <p className="text-sm text-gray-400 italic mb-2">No shipping address provided</p>}
                                   
                                   <form className="flex flex-col sm:flex-row gap-2" onSubmit={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const form = e.target as HTMLFormElement;
                                      const courierName = (form.elements.namedItem('courierName') as HTMLInputElement).value;
                                      const trackingNumber = (form.elements.namedItem('trackingNumber') as HTMLInputElement).value;
                                      try {
                                        await updateDoc(doc(db, 'orders', order.id), { courierName, trackingNumber });
                                        toast.success('Tracking details updated!');
                                      } catch (err) {
                                        toast.error('Failed to update tracking details');
                                      }
                                   }}>
                                     <input type="text" name="courierName" defaultValue={order.courierName || ''} placeholder="Courier (e.g. Pathao)" onClick={(e)=>e.stopPropagation()} className="flex-1 text-sm font-semibold px-3 py-2 border border-gray-200 rounded focus:border-[#EF4444] focus:ring-[#EF4444]" />
                                     <input type="text" name="trackingNumber" defaultValue={order.trackingNumber || ''} placeholder="Tracking Number" onClick={(e)=>e.stopPropagation()} className="flex-1 text-sm font-semibold px-3 py-2 border border-gray-200 rounded focus:border-[#EF4444] focus:ring-[#EF4444]" />
                                     <button type="submit" onClick={(e)=>e.stopPropagation()} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors shadow-sm">Save</button>
                                   </form>
                                   {order.courierName && (
                                     <div className="mt-2 text-xs font-medium text-gray-500">
                                       Currently shipped via <span className="font-bold text-gray-900">{order.courierName}</span> {order.trackingNumber && <span>(Tracking: {order.trackingNumber})</span>}
                                     </div>
                                   )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
`;

content = content.replace(/<\/tr>\s*\n\s*\);\s*\}\)/, "</tr>\n" + expandedRowStr + "\n                    );\n                  })");

fs.writeFileSync('src/pages/admin/tabs/sales/Orders.tsx', content, 'utf8');
console.log('Fixed React.Fragment tag mismatch');