const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');

const targetStr = `<td className="px-6 py-4">
                          <div className="flex flex-col">
                            <button
                              onClick={() => {
                                const customer = customers.find(c => c.name === order.customerName);
                                if (customer) {
                                  setSelectedLedgerEntity({ id: customer.id, name: customer.name, type: 'customer' });
                                } else {
                                  toast.error('Customer details not found');
                                }
                              }}
                              className="text-sm font-bold text-[#EF4444] hover:underline text-left"
                            >
                              {order.customerName || 'N/A'}
                            </button>
                            <span className="text-xs text-gray-500">{order.customerPhone || order.customerEmail || ''}</span>
                          </div>
                        </td>`;

const replaceStr = `<td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 group/copy">
                              <button
                                onClick={() => {
                                  const customer = customers.find(c => c.name === order.customerName);
                                  if (customer) {
                                    setSelectedLedgerEntity({ id: customer.id, name: customer.name, type: 'customer' });
                                  } else {
                                    toast.error('Customer details not found');
                                  }
                                }}
                                className="text-sm font-bold text-[#EF4444] hover:underline text-left"
                              >
                                {order.customerName || 'N/A'}
                              </button>
                              <button onClick={() => {
                                navigator.clipboard.writeText(order.customerName + ' - ' + (order.customerPhone || ''));
                                toast.success('Customer details copied');
                              }} className="opacity-0 group-hover/copy:opacity-100 p-1 hover:bg-red-50 text-red-400 hover:text-red-600 rounded transition-all">
                                <Copy size={12} />
                              </button>
                            </div>
                            <span className="text-xs text-gray-500">{order.customerPhone || order.customerEmail || ''}</span>
                          </div>
                        </td>`;

if (content.includes('const customer = customers.find')) {
    content = content.replace(targetStr, replaceStr);
    fs.writeFileSync('src/pages/admin/tabs/sales/Orders.tsx', content, 'utf8');
    console.log('Added Copy button to customer details');
} else {
    console.log('Failed to match customer cell');
}