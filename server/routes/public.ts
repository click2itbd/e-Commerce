import { Router, Response } from 'express';

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

export default publicRouter;
