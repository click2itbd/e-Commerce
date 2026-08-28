const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/admin/tabs/sales/Orders.tsx');
let content = fs.readFileSync(file, 'utf8');

const target = `<td className="px-6 py-4 text-xs font-mono text-gray-500">#{order.documentNumber || order.id.slice(0, 8)}</td>`;
const replacement = `<td className="px-6 py-4 text-xs font-mono text-gray-500">
                            #{order.documentNumber || order.id.slice(0, 8)}
                            {order.saleSource === 'online' && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                                ONLINE
                              </span>
                            )}
                          </td>`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log('Added badge to Orders.tsx');
