import { Router, Response } from 'express';
import { getAdminDocument } from '../firebase/admin';

const publicRouter = Router();

publicRouter.get('/config', async (req: any, res: Response) => {
  try {
    const config = {
      manualBkashNumber: process.env.MANUAL_BIKASH_NUMBER || '',
    };

    return res.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    console.error('Public config error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load public configuration' });
  }
});

publicRouter.get('/hosting-config', async (req: any, res: Response) => {
  try {
    const result = await getAdminDocument('settings', 'hostingApiConfig');
    const data = result.data || {};

    const safeConfig = {
      bundleDiscountPercent: data.bundleDiscountPercent || 0,
      updatedAt: data.updatedAt,
    };

    return res.json({
      success: true,
      data: safeConfig,
    });
  } catch (error: any) {
    console.error('Public hosting config error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load hosting configuration' });
  }
});

export default publicRouter;
