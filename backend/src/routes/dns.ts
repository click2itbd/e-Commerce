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
      true 
    );
    
    try {
      const response = await provider.fetchApi('/dns/zones');
      return res.json({ success: true, data: response.data || [] });
    } catch (e: any) {
      console.warn("Real DNS API failed, falling back to dummy DNS data:", e.message);
      const dummyZones = [
        { id: 1, name: 'example-shop.bd', records: 5, status: 'ACT' },
        { id: 2, name: 'my-business.com', records: 12, status: 'ACT' }
      ];
      return res.json({ success: true, data: dummyZones, fallback: true });
    }
    
  } catch (error: any) {
    console.error('DNS zones error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default dnsRouter;
