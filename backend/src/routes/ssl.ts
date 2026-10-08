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
      true // We hardcode true to use sandbox as requested by user initially
    );
    
    try {
      const response = await provider.fetchApi('/ssl/products');
      const products = response.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.prices?.[0]?.price || 0,
        type: p.category || 'DV',
        brand: p.brand || 'Unknown',
        validationType: p.validation_method || 'email'
      }));
      return res.json({ success: true, data: products });
    } catch (e: any) {
      console.warn("Real API failed, falling back to dummy SSL data:", e.message);
      // Fallback for demo if API fails
      const dummyProducts = [
        { id: 1, name: 'Sectigo EssentialSSL', price: 9.99, type: 'DV', brand: 'Sectigo', validationType: 'email' },
        { id: 2, name: 'Sectigo PositiveSSL', price: 8.50, type: 'DV', brand: 'Sectigo', validationType: 'email' },
        { id: 3, name: 'Sectigo EssentialSSL Wildcard', price: 79.99, type: 'DV Wildcard', brand: 'Sectigo', validationType: 'email' },
        { id: 4, name: 'Sectigo EV SSL', price: 120.00, type: 'EV', brand: 'Sectigo', validationType: 'document' }
      ];
      return res.json({ success: true, data: dummyProducts, fallback: true });
    }
    
  } catch (error: any) {
    console.error('SSL products error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default sslRouter;
