const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

code = code.replace(/await deleteDoc\(doc\(db, "orders", id\)\);/g, "await deleteDoc(doc(db, 'orders', id));\n                await logAudit('DELETE', 'Order', `Deleted order #${order.documentNumber || id} (Bulk)`, profile?.displayName || profile?.email || 'Unknown Admin');");

fs.writeFileSync('src/pages/AdminDashboard.tsx', code, 'utf8');
console.log("Updated Bulk delete");
