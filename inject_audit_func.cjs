const fs = require('fs');
let c = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const auditLogFunc = `
  const logAuditAction = async (action: 'CREATE' | 'EDIT' | 'DELETE', entityType: string, details: string) => {
    try {
      await addDoc(collection(db, 'audit_logs'), {
        action,
        entityType,
        details,
        performedBy: auth.currentUser?.email || 'Admin',
        timestamp: new Date().toISOString()
      });
    } catch(e) {
      console.error('Audit log failed', e);
    }
  };
`;

if (!c.includes('logAuditAction')) {
  c = c.replace(/(const handleDeleteProduct = async \(id: string\) => \{)/, auditLogFunc + "\n  $1");
  fs.writeFileSync('src/pages/AdminDashboard.tsx', c);
  console.log('Injected logAuditAction');
}