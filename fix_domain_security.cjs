const fs = require('fs');
let code = fs.readFileSync('backend/src/routes/domain.ts', 'utf8');

const securityCheck = `
    const allowedCommands = ['set_ns', 'renew', 'get_details', 'set_lock'];
    if (!allowedCommands.includes(command)) {
      return res.status(400).json({ success: false, error: 'Invalid command' });
    }

    // SECURITY CHECK: Verify Ownership
    const db = require('../firebase').getAdminDb();
    const snap = await db.collection('domainOrders').where('domain', '==', domain).where('status', '==', 'active').get();
    if (snap.empty) {
      return res.status(404).json({ success: false, error: 'Domain not found or not active in your account' });
    }
    const domainDoc = snap.docs[0].data();
    if (domainDoc.userId !== req.user.uid) {
      const { isUserAdmin } = require('../firebase/admin');
      const isAdmin = await isUserAdmin(req.user.uid);
      if (!isAdmin) {
        return res.status(403).json({ success: false, error: 'Unauthorized. You do not own this domain.' });
      }
    }
`;

if (!code.includes('SECURITY CHECK: Verify Ownership')) {
  code = code.replace(
    /const allowedCommands = \['set_ns', 'renew', 'get_details', 'set_lock'\];[\s\S]*?return res\.status\(400\)\.json\(\{ success: false, error: 'Invalid command' \}\);\s*\}/,
    securityCheck
  );
  fs.writeFileSync('backend/src/routes/domain.ts', code);
}
