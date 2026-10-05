import express, { Response } from 'express';
import { requireFirebaseAuth } from '../middleware/firebaseAuth.js';
import { isUserAdmin } from '../firebase/admin.js';

const sslRouter = express.Router();

sslRouter.get('/products', requireFirebaseAuth, async (req: any, res: Response) => {
  try {
    const isAdmin = await isUserAdmin(req.user?.uid);
    if (!isAdmin) return res.status(403).json({ error: 'Admin access required' });
    
    // In actual implementation, we will fetch from Openprovider API GET /v1/ssl/products
    // For now, return a placeholder list to show in UI
    const dummyProducts = [
      { id: 1, name: 'Sectigo EssentialSSL', price: 9.99, type: 'DV' },
      { id: 2, name: 'Sectigo PositiveSSL', price: 8.50, type: 'DV' },
      { id: 3, name: 'Sectigo EssentialSSL Wildcard', price: 79.99, type: 'DV Wildcard' },
      { id: 4, name: 'Sectigo EV SSL', price: 120.00, type: 'EV' }
    ];
    
    return res.json({ success: true, data: dummyProducts });
  } catch (error: any) {
    console.error('SSL products error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default sslRouter;
