const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

code = code.replace(/await deleteDoc\(doc\(db, "orders", order.id\)\);\s*toast.success\(`Order deleted and reverted successfully`\);/, "await deleteDoc(doc(db, 'orders', order.id));\n          await logAudit('DELETE', 'Order', `Deleted order #${order.documentNumber || order.id}`, profile?.displayName || profile?.email || 'Unknown Admin');\n          toast.success(`Order deleted and reverted successfully`);");

fs.writeFileSync('src/pages/AdminDashboard.tsx', code, 'utf8');
console.log("Updated AdminDashboard.tsx with regex");
