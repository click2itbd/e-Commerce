import express, { Response } from 'express';
import { requireFirebaseAuth } from '../middleware/firebaseAuth.js';
import { isUserAdmin } from '../firebase/admin.js';
import { OpenproviderDomainProvider } from '../providers/domain/OpenproviderDomainProvider.js';

const dnsRouter = express.Router();

dnsRouter.get('/zones', requireFirebaseAuth, async (req: any, res: Response) => {
  try {
    const isAdmin = await isUserAdmin(req.user?.uid);
    if (!isAdmin) return res.status(403).json({ error: 'Admin access required' });
    
    const provider = new OpenproviderDomainProvider(
      process.env.OPENPROVIDER_USERNAME || '',
      process.env.OPENPROVIDER_PASSWORD || '',
      process.env.OPENPROVIDER_SANDBOX_MODE === "true"
    );
    
    const response = await provider.fetchApi('/dns/zones');
    const zones = response.data?.results || response.data?.zones || [];
    return res.json({ success: true, data: Array.isArray(zones) ? zones : [] });
  } catch (error: any) {
    console.error('DNS zones error:', error);
    return res.status(502).json({ success: false, error: error.message || 'Openprovider DNS request failed' });
  }
});

export default dnsRouter;
