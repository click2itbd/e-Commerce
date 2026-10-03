const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/modals/EditOrderModal.tsx', 'utf8');

if (!code.includes('logAudit')) {
  code = code.replace(/import \{ toast \} from 'react-hot-toast';/, "import { toast } from 'react-hot-toast';\nimport { logAudit } from '../../../../lib/audit';\nimport { useAuth } from '../../../../context/AuthContext';");
  
  code = code.replace(/const \[saving, setSaving\] = useState\(false\);/, "const [saving, setSaving] = useState(false);\n  const { profile } = useAuth();");
  
  const oldUpdate = `await updateDoc(doc(db, 'orders', order.id), {
        ...formData,
        items: items
      });`;
  
  const newUpdate = `await updateDoc(doc(db, 'orders', order.id), {
        ...formData,
        items: items
      });
      await logAudit('EDIT', 'Order', \`Edited order #\${order.documentNumber || order.id}\`, profile?.displayName || profile?.email || 'Unknown');`;
      
  code = code.replace(oldUpdate, newUpdate);
  
  fs.writeFileSync('src/pages/admin/modals/EditOrderModal.tsx', code, 'utf8');
  console.log("Updated EditOrderModal.tsx with audit logging");
}
