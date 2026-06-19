const fs = require('fs');
const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\)\s*:\s*activeTab === 'orders'\s*\?\s*\(/;
if (regex.test(content)) {
  const quotationUI = `
        ) : activeTab === 'quotations' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="text-[#EF4444]" /> Quotation System
                <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full ml-2">
                  {orders.filter(o => o.type === 'quotation' || String(o.id).startsWith('QUO-') || String(o.documentNumber).startsWith('QUO')).length} total
                </span>
              </h2>
              <div className="flex gap-2 w-full md:w-auto">
                 <button className="bg-[#081621] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#EF4444] transition-all font-bold text-sm" onClick={() => { setActiveTab('sales'); setSaleData({ ...saleData, type: 'quotation' as any }); }}>
                   <Plus size={18} /> Add Quotation
                 </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 rounded-tl-lg">Date</th>
                    <th className="px-6 py-3">Quote No</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {orders.filter(o => o.type === 'quotation' || String(o.id).startsWith('QUO-') || String(o.documentNumber).startsWith('QUO')).map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono font-bold text-[#EF4444]">
                        {order.documentNumber || order.id.substring(0,8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{order.customerName}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{order.customerPhone}</td>
                      <td className="px-6 py-4 font-mono font-bold">{formatCurrency(order.total)}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                           <button
                             onClick={() => generatePDF(order, 'quotation')}
                             className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all flex items-center gap-1 text-xs font-bold"
                             title="Download PDF"
                           >
                              <Download size={16} /> Download
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orders.filter(o => o.type === 'quotation' || String(o.id).startsWith('QUO-') || String(o.documentNumber).startsWith('QUO')).length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No quotations found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'orders' ? (
`;
  content = content.replace(regex, quotationUI);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully inserted Quotation UI');
} else {
  console.log('Could not find anchor point!');
}
