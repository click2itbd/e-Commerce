import express, { Response } from 'express';
import { requireFirebaseAuth } from '../middleware/firebaseAuth.js';
import { isUserAdmin } from '../firebase/admin.js';
import { OpenproviderDomainProvider } from '../providers/domain/OpenproviderDomainProvider.js';

const sslRouter = express.Router();

sslRouter.get('/products', requireFirebaseAuth, async (req: any, res: Response) => {
  try {
    const isAdmin = await isUserAdmin(req.user?.uid);
    if (!isAdmin) return res.status(403).json({ error: 'Admin access required' });
    
        
    // We instantiate OpenproviderDomainProvider just to reuse its fetchApi authentication mechanism
    const provider = new OpenproviderDomainProvider(
      process.env.OPENPROVIDER_USERNAME || '',
      process.env.OPENPROVIDER_PASSWORD || '',
      process.env.OPENPROVIDER_SANDBOX_MODE === "true"
    );
    
    const response = await provider.fetchApi('/ssl/products');
    const resultsArray = Array.isArray(response.data) ? response.data : (response.data?.results || []);
    const products = resultsArray.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.prices?.[0]?.price || p.prices?.reseller?.price?.reseller || 0,
      type: p.category || 'DV',
      brand: p.brand || 'Unknown',
      validationType: p.validation_method || 'email'
    }));
    return res.json({ success: true, data: products });
  } catch (error: any) {
    console.error('SSL products error:', error);
    return res.status(502).json({ success: false, error: error.message || 'Openprovider SSL request failed' });
  }
});

export default sslRouter;
