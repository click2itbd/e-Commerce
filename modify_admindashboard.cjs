const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

if (!code.includes('logAudit')) {
  code = code.replace(/import \{ db \} from '\.\.\/firebase';/, "import { db } from '../firebase';\nimport { logAudit } from '../lib/audit';");
  
  const oldDelete = `await deleteDoc(doc(db, "orders", order.id));
          toast.success(\`Order deleted and reverted successfully\`);`;
          
  const newDelete = `await deleteDoc(doc(db, "orders", order.id));
          await logAudit('DELETE', 'Order', \`Deleted order #\${order.documentNumber || order.id}\`, profile?.displayName || profile?.email || 'Unknown Admin');
          toast.success(\`Order deleted and reverted successfully\`);`;
          
  code = code.replace(oldDelete, newDelete);
  
  const oldBulkDelete = `await Promise.all(
            selectedOrderIds.map(async (id) => {
              const order = orders.find((o) => o.id === id);
              if (order) {
                const txSnap = await getDocs(
                  query(
                    collection(db, "transactions"),
                    where("referenceId", "==", id),
                  ),
                );
                await Promise.all(
                  txSnap.docs.map((d) => deleteDoc(doc(db, "transactions", d.id))),
                );
                await deleteDoc(doc(db, "orders", id));
              }
            }),
          );`;
          
  const newBulkDelete = `await Promise.all(
            selectedOrderIds.map(async (id) => {
              const order = orders.find((o) => o.id === id);
              if (order) {
                const txSnap = await getDocs(
                  query(
                    collection(db, "transactions"),
                    where("referenceId", "==", id),
                  ),
                );
                await Promise.all(
                  txSnap.docs.map((d) => deleteDoc(doc(db, "transactions", d.id))),
                );
                await deleteDoc(doc(db, "orders", id));
                await logAudit('DELETE', 'Order', \`Deleted order #\${order.documentNumber || order.id} (Bulk)\`, profile?.displayName || profile?.email || 'Unknown Admin');
              }
            }),
          );`;
          
  code = code.replace(oldBulkDelete, newBulkDelete);
  
  fs.writeFileSync('src/pages/AdminDashboard.tsx', code, 'utf8');
  console.log("Updated AdminDashboard.tsx with audit logging");
}
