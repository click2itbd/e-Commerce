import { Router } from 'express';
import { getAdminAuth, getAdminDb, getAdminDocument, isUserAdmin } from '../firebase/admin.js';
const publicRouter = Router();
publicRouter.post('/validate-coupon', async (req, res) => {
    try {
        const rawCode = req.body?.code;
        if (!rawCode || typeof rawCode !== 'string' || !rawCode.trim()) {
            return res.status(400).json({ success: false, error: 'Coupon code is required' });
        }
        const cleanCode = rawCode.trim().toUpperCase();
        const db = getAdminDb();
        const snap = await db
            .collection('couponCodes')
            .where('code', '==', cleanCode)
            .where('isActive', '==', true)
            .limit(1)
            .get();
        if (snap.empty) {
            return res.status(404).json({ success: false, error: 'Invalid or inactive discount code' });
        }
        const docSnap = snap.docs[0];
        const data = docSnap.data() || {};
        if (data.expiryDate && new Date(data.expiryDate) < new Date()) {
            return res.status(400).json({ success: false, error: 'This discount code has expired' });
        }
        if (Number(data.usageLimit) > 0 && Number(data.usedCount || 0) >= Number(data.usageLimit)) {
            return res.status(400).json({ success: false, error: 'This discount code has reached its usage limit' });
        }
        return res.json({
            success: true,
            data: {
                id: docSnap.id,
                code: data.code,
                type: data.type || 'percentage',
                discountPercentage: Number(data.discountPercentage) || 0,
                fixedAmount: Number(data.fixedAmount) || 0,
                minOrderAmount: Number(data.minOrderAmount) || 0,
                expiryDate: data.expiryDate || '',
                isActive: true,
            },
        });
    }
    catch (error) {
        console.error('Validate coupon error:', error);
        return res.status(500).json({ success: false, error: 'Failed to validate discount code' });
    }
});
publicRouter.get('/config', async (req, res) => {
    try {
        const apiKeysDoc = await getAdminDocument('settings', 'api_keys');
        const apiKeysData = apiKeysDoc.data || {};
        const config = {
            manualBkashNumber: apiKeysData.manualBkashNumber || process.env.MANUAL_BIKASH_NUMBER || '01700000000',
        };
        return res.json({
            success: true,
            data: config,
        });
    }
    catch (error) {
        console.error('Public config error:', error);
        return res.status(500).json({ success: false, error: 'Failed to load public configuration' });
    }
});
publicRouter.get('/hosting-config', async (req, res) => {
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
    }
    catch (error) {
        console.error('Public hosting config error:', error);
        return res.status(500).json({ success: false, error: 'Failed to load hosting configuration' });
    }
});
// Fast public product metadata lookup for OpenGraph / WhatsApp / Facebook social link preview generator
publicRouter.get('/product-meta/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ success: false, error: 'Product ID is required' });
        const docResult = await getAdminDocument('products', id);
        if (!docResult.exists || !docResult.data) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        const data = docResult.data;
        const img = data.imageUrl || (Array.isArray(data.images) && data.images[0]) || '';
        const cleanDesc = (data.shortDescription || data.description || '')
            .replace(/<[^>]*>?/gm, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 200);
        return res.json({
            success: true,
            data: {
                id,
                name: data.name || '',
                price: Number(data.discountPrice || data.price || 0),
                regularPrice: Number(data.price || 0),
                image: img,
                description: cleanDesc || `Buy ${data.name || 'product'} at the best price from CLICK2IT.`,
            },
        });
    }
    catch (error) {
        console.error('Public product-meta error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch product metadata' });
    }
});
// Secure Guest & Customer Order Tracking endpoint (requires both Order/Invoice ID and matching Phone for guests)
publicRouter.post('/track-order', async (req, res) => {
    try {
        const rawOrderId = String(req.body?.orderId || '').trim();
        const rawPhone = String(req.body?.phone || '').trim();
        if (!rawOrderId || rawOrderId.length > 100) {
            return res.status(400).json({ success: false, error: 'Order ID or Invoice Number is required.' });
        }
        // Check if caller has an authenticated session
        let callerUid = null;
        let callerEmail = undefined;
        const authHeader = req.headers?.authorization;
        if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
            const token = authHeader.slice(7).trim();
            if (token) {
                try {
                    const decoded = await getAdminAuth().verifyIdToken(token);
                    callerUid = decoded.uid;
                    callerEmail = decoded.email;
                }
                catch {
                    // Ignore invalid/expired token and treat as guest
                }
            }
        }
        const db = getAdminDb();
        let orderDoc = null;
        // 1. Try direct document lookup by ID
        const directSnap = await db.collection('orders').doc(rawOrderId).get();
        if (directSnap.exists) {
            orderDoc = { id: directSnap.id, ...directSnap.data() };
        }
        else {
            // 2. Try query by 'id' field
            let qSnap = await db.collection('orders').where('id', '==', rawOrderId).limit(1).get();
            if (qSnap.empty) {
                // 3. Try query by 'invoiceNumber'
                qSnap = await db.collection('orders').where('invoiceNumber', '==', rawOrderId).limit(1).get();
            }
            if (!qSnap.empty) {
                orderDoc = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() };
            }
        }
        if (!orderDoc) {
            return res.status(404).json({
                success: false,
                error: 'Order not found or phone number does not match.',
            });
        }
        const isOwner = Boolean(callerUid && orderDoc.userId && orderDoc.userId === callerUid);
        const isAdmin = callerUid ? await isUserAdmin(callerUid, callerEmail) : false;
        if (!isOwner && !isAdmin) {
            const normInput = rawPhone.replace(/\D/g, '').replace(/^(?:880|88)?0?/, '');
            const orderPhoneRaw = String(orderDoc.customerPhone || orderDoc.shippingInfo?.phone || '');
            const normOrder = orderPhoneRaw.replace(/\D/g, '').replace(/^(?:880|88)?0?/, '');
            if (!normInput || normInput.length < 8 || !normOrder || normInput !== normOrder) {
                return res.status(403).json({
                    success: false,
                    error: !rawPhone
                        ? 'Please enter the phone number used when placing this order.'
                        : 'Order not found or phone number does not match.',
                });
            }
        }
        return res.json({
            success: true,
            data: orderDoc,
        });
    }
    catch (error) {
        console.error('Public track-order error:', error);
        return res.status(500).json({ success: false, error: 'Failed to track order. Please try again.' });
    }
});
export default publicRouter;
