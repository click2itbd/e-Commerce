const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');

const modalStr = `
      {viewingOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => { if(e.target === e.currentTarget) setViewingOrder(null); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-900">Order #{viewingOrder.documentNumber || viewingOrder.id.substring(0,8)}</h3>
                {viewingOrder.createdBy && <p className="text-[10px] text-gray-500 uppercase font-semibold">Handled By: {viewingOrder.createdBy}</p>}
              </div>
              <button onClick={() => setViewingOrder(null)} className="p-1 hover:bg-gray-200 rounded text-gray-500"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Customer Details</p>
                  <p className="font-medium text-gray-900">{viewingOrder.customerName}</p>
                  <p className="text-sm text-gray-600">{viewingOrder.customerPhone}</p>
                  <p className="text-sm text-gray-600">{viewingOrder.customerEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Shipping Address</p>
                  <p className="text-sm text-gray-700">{viewingOrder.shippingAddress || 'No address provided'}</p>
                </div>
              </div>
              <div className="border border-gray-100 rounded-xl overflow-hidden mb-6">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-gray-600">Item</th>
                      <th className="px-4 py-2 text-right text-gray-600">Qty</th>
                      <th className="px-4 py-2 text-right text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {viewingOrder.items?.map((item: any, i: number) => (
                      <tr key={i}>
                        <td className="px-4 py-3 text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency((item.price || item.sellingPrice || 0) * (item.quantity || 1), settings)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-right text-gray-900">Total:</td>
                      <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(viewingOrder.total || 0, settings)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Tracking Info Form */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 font-bold uppercase mb-3">Courier Tracking Info</p>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  try {
                    await updateDoc(doc(db, 'orders', viewingOrder.id), { trackingNumber: formData.get('trackingNumber') as string, courierName: formData.get('courier') as string });
                    toast.success('Tracking info updated');
                  } catch (err) {
                    toast.error('Failed to update tracking');
                  }
                }} className="flex flex-col sm:flex-row gap-3">
                  <input type="text" name="courier" defaultValue={viewingOrder.courierName || ''} placeholder="Courier Name (e.g. Steadfast)" className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500" required />
                  <input type="text" name="trackingNumber" defaultValue={viewingOrder.trackingNumber || ''} placeholder="Tracking Number" className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500" required />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">Update</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace("</>\n  );\n};", modalStr + "\n    </>\n  );\n};");
fs.writeFileSync('src/pages/admin/tabs/sales/Orders.tsx', content, 'utf8');
console.log('Added modal');