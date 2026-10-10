const fs = require('fs');
let routeCode = fs.readFileSync('backend/src/routes/hosting.ts', 'utf8');

if (!routeCode.includes('createHostingLoginSession')) {
  routeCode = routeCode.replace(
    /classifyHostingError,\s*\} from '\.\.\/services\/hosting';/,
    "classifyHostingError,\n  createHostingLoginSession,\n} from '../services/hosting';"
  );
  
  const ssoRoute = `
hostingRouter.post('/sso', requireFirebaseAuth, async (req: any, res: Response) => {
  try {
    const { providerAccountId } = req.body;
    if (!providerAccountId) {
      return res.status(400).json({ success: false, error: 'providerAccountId is required' });
    }

    const db = require('../firebase').getAdminDb();
    const snap = await db.collection('hostingAccounts').where('providerAccountId', '==', providerAccountId).where('userId', '==', req.user.uid).get();
    if (snap.empty) {
      return res.status(403).json({ success: false, error: 'Hosting account not found or unauthorized' });
    }

    const url = await createHostingLoginSession(providerAccountId);
    return res.json({ success: true, url });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message || 'Failed to generate SSO URL' });
  }
});
`;
  
  routeCode = routeCode.replace("export default hostingRouter;", ssoRoute + "\nexport default hostingRouter;");
  fs.writeFileSync('backend/src/routes/hosting.ts', routeCode);
}
