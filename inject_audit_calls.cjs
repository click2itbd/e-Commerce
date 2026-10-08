const fs = require('fs');
let c = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

c = c.replace(/await deleteDoc\(doc\(db, "products", id\)\);/g, "const prod = products.find(p => p.id === id);\n            await deleteDoc(doc(db, \"products\", id));\n            await logAuditAction('DELETE', 'Product', `Deleted product: ${prod?.name || id}`);");

c = c.replace(/await updateDoc\(\s*doc\(db, "products", editingProduct\.id\),\s*productData\s*\);/g, "await updateDoc(\n                doc(db, \"products\", editingProduct.id),\n                productData\n              );\n              await logAuditAction('EDIT', 'Product', `Updated product: ${formData.name}`);");

c = c.replace(/await addDoc\(collection\(db, "products"\), productData\);/g, "await addDoc(collection(db, \"products\"), productData);\n              await logAuditAction('CREATE', 'Product', `Created new product: ${formData.name}`);");

c = c.replace(/await deleteDoc\(doc\(db, "orders", id\)\);/g, "const ord = orders.find(o => o.id === id);\n            await deleteDoc(doc(db, \"orders\", id));\n            await logAuditAction('DELETE', 'Order', `Deleted order: ${ord?.documentNumber || id}`);");

fs.writeFileSync('src/pages/AdminDashboard.tsx', c);
console.log('Injected audit logs to CRUD functions');