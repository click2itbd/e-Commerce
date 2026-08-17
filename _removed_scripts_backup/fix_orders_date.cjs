const fs = require('fs');
const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Date th
const thTarget = '<th className="px-6 py-4">Order ID</th>';
const thReplacement = '<th className="px-6 py-4">Order ID</th>\n                    <th className="px-6 py-4">Date</th>';
content = content.replace(thTarget, thReplacement);

// 2. Add Date td
const tdTarget = '<td className="px-6 py-4 text-xs font-mono text-gray-500">#{order.id.slice(0, 8)}</td>';
const tdReplacement = '<td className="px-6 py-4 text-xs font-mono text-gray-500">#{order.id.slice(0, 8)}</td>\n                        <td className="px-6 py-4 text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>';
content = content.replace(tdTarget, tdReplacement);

fs.writeFileSync(path, content, 'utf8');
console.log("Added Date to Orders Table");
