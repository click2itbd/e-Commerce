import { Router } from 'express';
import { getAdminDb, isUserAdmin } from '../firebase/admin.js';
import { requireFirebaseAuth } from '../middleware/firebaseAuth.js';
import { sendEmail } from '../services/email.js';
import { fulfillOrder } from '../services/fulfillment.js';
import { getDomainProviderConfig } from '../services/domainProviderConfig.js';
import { getDomainProvider } from '../providers/providerFactory.js';
import { getDomainPricingSettings, calculateCustomerPriceBdt } from '../services/domainPricing.js';
const customersRouter = Router();
// ==========================================
// 1. CLIENT WALLET ENDPOINTS
// ==========================================
/**
 * GET /api/customers/me/wallet
 * Returns current user's account balance and recent wallet transactions
 */
customersRouter.get('/me/wallet', requireFirebaseAuth, async (req, res) => {
    const userId = req.user.uid;
    try {
        const db = getAdminDb();
        const userDoc = await db.collection('users').doc(userId).get();
        let balance = 0;
        let userData = {};
        if (userDoc.exists) {
            userData = userDoc.data() || {};
            balance = typeof userData.balance === 'number' ? userData.balance : 0;
        }
        // Fetch transactions
        const txSnap = await db.collection('wallet_transactions')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        const transactions = txSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));
        // Fetch pending deposit requests
        const depSnap = await db.collection('deposit_requests')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();
        const deposits = depSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));
        return res.json({
            success: true,
            balance,
            user: {
                id: userId,
                email: req.user.email,
                name: userData.displayName || userData.name || userData.email || 'Customer',
                phone: userData.phone || userData.phoneNumber || '',
                status: userData.status || 'active'
            },
            transactions,
            deposits
        });
    }
    catch (error) {
        console.error('Failed to fetch wallet info:', error);
        return res.status(500).json({ error: error.message || 'Failed to fetch wallet' });
    }
});
/**
 * POST /api/customers/deposit-request
 * Submit a deposit request to add balance
 */
customersRouter.post('/deposit-request', requireFirebaseAuth, async (req, res) => {
    const userId = req.user.uid;
    const { amount, paymentMethod, transactionId, notes } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
        return res.status(400).json({ error: 'Please enter a valid deposit amount.' });
    }
    if (!transactionId || typeof transactionId !== 'string' || transactionId.trim().length < 3) {
        return res.status(400).json({ error: 'A valid payment transaction ID is required.' });
    }
    try {
        const db = getAdminDb();
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        const now = new Date().toISOString();
        const depositRef = db.collection('deposit_requests').doc();
        const depositData = {
            id: depositRef.id,
            userId,
            customerEmail: req.user.email || userData?.email || '',
            customerName: userData?.displayName || userData?.name || 'Customer',
            amount: numAmount,
            paymentMethod: paymentMethod || 'eps',
            transactionId: transactionId.trim(),
            notes: notes || '',
            status: 'pending', // pending, approved, rejected
            createdAt: now,
            updatedAt: now
        };
        await depositRef.set(depositData);
        // Send email notification to customer
        if (depositData.customerEmail) {
            await sendEmail({
                to: depositData.customerEmail,
                subject: `Deposit Request Received - ৳${numAmount}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
            <h2 style="color: #2563eb;">Funds Deposit Request Submitted</h2>
            <p>Dear ${depositData.customerName},</p>
            <p>We have received your wallet deposit request of <strong>৳${numAmount}</strong> via <strong>${(paymentMethod || 'EPS').toUpperCase()}</strong>.</p>
            <p><strong>Transaction ID:</strong> ${depositData.transactionId}</p>
            <p>Our billing team will verify the payment and credit your account balance shortly.</p>
            <p style="margin-top: 20px; color: #64748b; text-align: center;">Thank you for choosing Click2IT!</p>
          </div>
        `,
                customerEmail: depositData.customerEmail,
                category: 'payment'
            }).catch(e => console.warn('Deposit email failed:', e));
        }
        return res.json({
            success: true,
            message: 'Deposit request submitted successfully. It will be credited upon verification.',
            deposit: depositData
        });
    }
    catch (error) {
        console.error('Failed to submit deposit request:', error);
        return res.status(500).json({ error: error.message || 'Failed to submit deposit request' });
    }
});
/**
 * POST /api/customers/pay-order
 * Pay for an order (Domain registration / renewal / hosting) using Account Balance
 * Uses Firestore runTransaction() to prevent concurrent double-spend race conditions.
 */
customersRouter.post('/pay-order', requireFirebaseAuth, async (req, res) => {
    const userId = req.user.uid;
    const { orderId } = req.body;
    if (!orderId || typeof orderId !== 'string') {
        return res.status(400).json({ error: 'Order ID is required.' });
    }
    try {
        const db = getAdminDb();
        const orderRef = db.collection('orders').doc(orderId);
        const userRef = db.collection('users').doc(userId);
        const txRef = db.collection('wallet_transactions').doc();
        const txResult = await db.runTransaction(async (t) => {
            const [orderSnap, userSnap] = await Promise.all([t.get(orderRef), t.get(userRef)]);
            if (!orderSnap.exists) {
                const err = new Error('Order not found.');
                err.statusCode = 404;
                throw err;
            }
            const orderData = orderSnap.data() || {};
            if (orderData.userId && orderData.userId !== userId) {
                const err = new Error('You do not have permission for this order.');
                err.statusCode = 403;
                throw err;
            }
            if (orderData.paymentStatus === 'verified' || orderData.status === 'completed') {
                const err = new Error('This order has already been paid and completed.');
                err.statusCode = 400;
                throw err;
            }
            const totalAmount = Number(orderData.total || orderData.totalBdt || 0);
            if (totalAmount <= 0) {
                const err = new Error('Invalid order amount.');
                err.statusCode = 400;
                throw err;
            }
            const userData = userSnap.exists ? userSnap.data() : {};
            const currentBalance = typeof userData.balance === 'number' ? userData.balance : 0;
            if (currentBalance < totalAmount) {
                const err = new Error(`Insufficient account balance. Available: ৳${currentBalance.toLocaleString()}, Required: ৳${totalAmount.toLocaleString()}. Please add funds first.`);
                err.statusCode = 400;
                throw err;
            }
            const newBalance = currentBalance - totalAmount;
            const now = new Date().toISOString();
            const txData = {
                id: txRef.id,
                userId,
                customerEmail: req.user.email || userData.email || orderData.customerEmail,
                customerName: userData.displayName || userData.name || orderData.customerName || 'Customer',
                type: 'debit',
                amount: totalAmount,
                balanceBefore: currentBalance,
                balanceAfter: newBalance,
                reason: `Payment for Order #${orderId.slice(0, 8)} (${orderData.items?.[0]?.name || 'Domain/Hosting Services'})`,
                orderId,
                createdAt: now
            };
            t.update(userRef, {
                balance: newBalance,
                updatedAt: now
            });
            t.set(txRef, txData);
            t.update(orderRef, {
                paymentStatus: 'verified',
                paymentMethod: 'wallet_balance',
                paymentVerificationStatus: 'approved',
                providerStatus: 'processing',
                paymentSubmittedAt: now,
                paidAt: now,
                updatedAt: now
            });
            return { newBalance, totalAmount, txData };
        });
        const { newBalance, totalAmount, txData } = txResult;
        // Auto trigger fulfillment (domain registration / hosting provisioning)
        let fulfillmentRes = null;
        try {
            fulfillmentRes = await fulfillOrder(orderId, userId);
        }
        catch (fErr) {
            console.warn('[Wallet Pay] Fulfillment background trigger error:', fErr);
        }
        // Send payment confirmation email
        if (txData.customerEmail) {
            await sendEmail({
                to: txData.customerEmail,
                subject: `Payment Receipt - Order #${orderId.slice(0, 8)}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #10b981;">Payment Successful!</h2>
            <p>Dear ${txData.customerName},</p>
            <p>Your order <strong>#${orderId.slice(0, 8)}</strong> has been paid using your Account Wallet Balance.</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 4px 0;"><strong>Deducted Amount:</strong> ৳${totalAmount.toLocaleString()}</p>
              <p style="margin: 4px 0;"><strong>Remaining Balance:</strong> ৳${newBalance.toLocaleString()}</p>
              <p style="margin: 4px 0;"><strong>Payment Method:</strong> Account Wallet Balance</p>
            </div>
            <p>Your order is now being provisioned automatically.</p>
            <p style="margin-top: 20px; color: #64748b; text-align: center;">Thank you for your business!</p>
          </div>
        `,
                customerEmail: txData.customerEmail,
                category: 'payment'
            }).catch(e => console.warn('Payment receipt email failed:', e));
        }
        return res.json({
            success: true,
            message: 'Payment completed successfully with account balance.',
            newBalance,
            orderStatus: 'verified',
            fulfillment: fulfillmentRes
        });
    }
    catch (error) {
        console.error('Wallet payment failed:', error);
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message || 'Payment processing failed.' });
    }
});
/**
 * POST /api/customers/renew-domain
 * Direct 1-Click Domain Renewal using Wallet Balance
 * Uses Firestore runTransaction() to atomically reserve/deduct balance before calling registrar,
 * and refunds automatically if the registrar call fails.
 */
customersRouter.post('/renew-domain', requireFirebaseAuth, async (req, res) => {
    const userId = req.user.uid;
    const { domainName, periodYears = 1 } = req.body;
    if (!domainName || typeof domainName !== 'string') {
        return res.status(400).json({ error: 'Domain name is required for renewal.' });
    }
    const yearsNum = Math.max(1, Math.min(10, Math.floor(Number(periodYears) || 1)));
    const cleanDomain = domainName.trim().toLowerCase();
    const tldMatch = cleanDomain.match(/\.([a-z0-9.-]+)$/i);
    if (!tldMatch) {
        return res.status(400).json({ error: 'Invalid domain name format.' });
    }
    const tld = tldMatch[1];
    try {
        const db = getAdminDb();
        const config = await getDomainProviderConfig();
        const provider = getDomainProvider(config);
        let pricingSettings = { usdToBdtRate: 123, markupPercent: 15 };
        try {
            pricingSettings = await getDomainPricingSettings();
        }
        catch { }
        // Get live pricing quote for this TLD
        let renewPriceBdt = 1500; // default fallback
        try {
            if (provider.getTldPricing) {
                const quote = await provider.getTldPricing(tld);
                if (quote && quote.renewalPrice > 0) {
                    renewPriceBdt = calculateCustomerPriceBdt(quote.renewalPrice, pricingSettings);
                }
            }
        }
        catch {
            const priceDoc = await db.collection('domainPricing').doc(tld).get();
            if (priceDoc.exists && priceDoc.data()?.renewPrice) {
                renewPriceBdt = priceDoc.data()?.renewPrice;
            }
        }
        const totalCost = renewPriceBdt * yearsNum;
        const userRef = db.collection('users').doc(userId);
        const txRef = db.collection('wallet_transactions').doc();
        // Step 1: Atomically check and deduct balance in a Firestore transaction
        const deductedInfo = await db.runTransaction(async (t) => {
            const userSnap = await t.get(userRef);
            const userData = userSnap.exists ? userSnap.data() : {};
            const currentBalance = typeof userData.balance === 'number' ? userData.balance : 0;
            if (currentBalance < totalCost) {
                const err = new Error(`Insufficient wallet balance. Renewal cost: ৳${totalCost.toLocaleString()} (${yearsNum} yr), Available: ৳${currentBalance.toLocaleString()}. Please top up your wallet balance.`);
                err.statusCode = 400;
                throw err;
            }
            const newBalance = currentBalance - totalCost;
            const now = new Date().toISOString();
            t.update(userRef, {
                balance: newBalance,
                updatedAt: now
            });
            t.set(txRef, {
                id: txRef.id,
                userId,
                customerEmail: req.user.email || userData.email,
                customerName: userData.displayName || userData.name || 'Customer',
                type: 'debit',
                amount: totalCost,
                balanceBefore: currentBalance,
                balanceAfter: newBalance,
                reason: `Domain Renewal for ${cleanDomain} (${yearsNum} Year${yearsNum > 1 ? 's' : ''})`,
                domainName: cleanDomain,
                createdAt: now
            });
            return { newBalance, userData, now };
        });
        // Step 2: Attempt provider renewal call; if it fails, refund the balance in a transaction
        let providerResult = null;
        let renewSuccess = false;
        try {
            if (provider.renewDomain) {
                providerResult = await provider.renewDomain(cleanDomain, yearsNum);
                renewSuccess = true;
            }
            else {
                renewSuccess = true; // Manual review or fallback
            }
        }
        catch (pErr) {
            console.error('[Domain Renew] Provider call failed, refunding wallet balance:', pErr);
            await db.runTransaction(async (t) => {
                const uSnap = await t.get(userRef);
                const curBal = typeof uSnap.data()?.balance === 'number' ? uSnap.data().balance : 0;
                const refundedBal = curBal + totalCost;
                const refundNow = new Date().toISOString();
                t.update(userRef, { balance: refundedBal, updatedAt: refundNow });
                t.delete(txRef);
            }).catch((refundErr) => console.error('[Domain Renew] CRITICAL refund error:', refundErr));
            return res.status(500).json({ error: `Domain provider renewal failed: ${pErr.message}` });
        }
        const { newBalance, userData, now } = deductedInfo;
        // Step 3: Record renewal order document
        const renewalOrderRef = db.collection('domainOrders').doc();
        await renewalOrderRef.set({
            id: renewalOrderRef.id,
            userId,
            customerEmail: req.user.email || userData.email,
            customerName: userData.displayName || userData.name || 'Customer',
            domainName: cleanDomain,
            type: 'renewal',
            periodYears: yearsNum,
            amount: totalCost,
            paymentStatus: 'verified',
            paymentMethod: 'wallet_balance',
            providerStatus: renewSuccess ? 'completed' : 'manual_review',
            providerResult,
            createdAt: now
        });
        // Send email
        if (req.user.email || userData.email) {
            await sendEmail({
                to: req.user.email || userData.email,
                subject: `Domain Renewed - ${cleanDomain}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #2563eb;">Domain Renewal Successful</h2>
            <p>Dear ${userData.displayName || userData.name || 'Customer'},</p>
            <p>Your domain <strong>${cleanDomain}</strong> has been successfully renewed for <strong>${yearsNum} year(s)</strong>.</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 4px 0;"><strong>Cost:</strong> ৳${totalCost.toLocaleString()}</p>
              <p style="margin: 4px 0;"><strong>New Wallet Balance:</strong> ৳${newBalance.toLocaleString()}</p>
            </div>
            <p>Thank you for keeping your services active with Click2IT!</p>
          </div>
        `,
                customerEmail: req.user.email || userData.email,
                category: 'domain'
            }).catch(e => console.warn('Renewal email failed:', e));
        }
        return res.json({
            success: true,
            message: `Domain ${cleanDomain} renewed successfully for ${yearsNum} year(s).`,
            newBalance,
            providerResult
        });
    }
    catch (error) {
        console.error('Domain renewal failed:', error);
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message || 'Failed to renew domain.' });
    }
});
// ==========================================
// 2. ADMIN CUSTOMER MANAGEMENT ENDPOINTS
// ==========================================
/**
 * GET /api/admin/customers
 * Get comprehensive list of all customers, including balances, domain counts, hosting counts
 */
customersRouter.get('/admin/list', requireFirebaseAuth, async (req, res) => {
    const adminUid = req.user?.uid;
    const isAdmin = await isUserAdmin(adminUid, req.user?.email).catch(() => false);
    if (!isAdmin) {
        return res.status(403).json({ error: 'Admin authorization required.' });
    }
    try {
        const db = getAdminDb();
        const usersSnap = await db.collection('users').limit(500).get();
        // Aggregations
        const domainsSnap = await db.collection('domainOrders').get().catch(() => ({ docs: [] }));
        const hostingSnap = await db.collection('hostingAccounts').get().catch(() => ({ docs: [] }));
        const ordersSnap = await db.collection('orders').get().catch(() => ({ docs: [] }));
        const domainsByUser = {};
        domainsSnap.docs.forEach((doc) => {
            const uId = doc.data()?.userId;
            if (uId)
                domainsByUser[uId] = (domainsByUser[uId] || 0) + 1;
        });
        const hostingByUser = {};
        hostingSnap.docs.forEach((doc) => {
            const uId = doc.data()?.userId;
            if (uId)
                hostingByUser[uId] = (hostingByUser[uId] || 0) + 1;
        });
        const totalSpentByUser = {};
        const ordersCountByUser = {};
        ordersSnap.docs.forEach((doc) => {
            const d = doc.data();
            const uId = d?.userId;
            if (uId) {
                ordersCountByUser[uId] = (ordersCountByUser[uId] || 0) + 1;
                if (d.paymentStatus === 'verified' || d.status === 'completed') {
                    totalSpentByUser[uId] = (totalSpentByUser[uId] || 0) + Number(d.total || d.totalBdt || 0);
                }
            }
        });
        const customers = usersSnap.docs.map((doc) => {
            const data = doc.data();
            const uid = doc.id;
            return {
                id: uid,
                uid,
                email: data.email || 'N/A',
                name: data.displayName || data.name || data.email || 'Customer',
                phone: data.phone || data.phoneNumber || 'N/A',
                role: data.role || 'customer',
                status: data.status || 'active',
                balance: typeof data.balance === 'number' ? data.balance : 0,
                createdAt: data.createdAt || null,
                domainsCount: domainsByUser[uid] || 0,
                hostingCount: hostingByUser[uid] || 0,
                ordersCount: ordersCountByUser[uid] || 0,
                totalSpent: totalSpentByUser[uid] || 0
            };
        });
        return res.json({
            success: true,
            count: customers.length,
            customers
        });
    }
    catch (error) {
        console.error('Failed to list customers for admin:', error);
        return res.status(500).json({ error: error.message || 'Failed to list customers.' });
    }
});
/**
 * POST /api/admin/customers/:userId/balance or /api/customers/admin/balance or /api/customers/admin/add-funds
 * Admin Add or Deduct Balance / Funds to Customer Account
 */
const handleAdminBalanceAdjust = async (req, res) => {
    const adminUid = req.user?.uid;
    const userId = req.params?.userId || req.body?.userId;
    const { amount, action, reason, adminNotes } = req.body;
    const isAdmin = await isUserAdmin(adminUid, req.user?.email).catch(() => false);
    if (!isAdmin) {
        return res.status(403).json({ error: 'Admin authorization required.' });
    }
    if (!userId) {
        return res.status(400).json({ error: 'Target customer User ID is required.' });
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
        return res.status(400).json({ error: 'Valid positive amount is required.' });
    }
    const effectiveAction = (action || 'add').toLowerCase();
    if (!['add', 'deduct'].includes(effectiveAction)) {
        return res.status(400).json({ error: 'Action must be "add" or "deduct".' });
    }
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
        return res.status(400).json({ error: 'Reason/Description is required for balance adjustment.' });
    }
    try {
        const db = getAdminDb();
        const userRef = db.collection('users').doc(userId);
        const txRef = db.collection('wallet_transactions').doc();
        const { newBalance, userData, txData } = await db.runTransaction(async (t) => {
            const userSnap = await t.get(userRef);
            if (!userSnap.exists) {
                const err = new Error('Customer user account not found.');
                err.statusCode = 404;
                throw err;
            }
            const uData = userSnap.data() || {};
            const currentBalance = typeof uData.balance === 'number' ? uData.balance : 0;
            let updatedBalance = currentBalance;
            if (effectiveAction === 'add') {
                updatedBalance = currentBalance + numAmount;
            }
            else {
                if (currentBalance < numAmount) {
                    const err = new Error(`Cannot deduct ৳${numAmount.toLocaleString()}. Customer current balance is only ৳${currentBalance.toLocaleString()}.`);
                    err.statusCode = 400;
                    throw err;
                }
                updatedBalance = currentBalance - numAmount;
            }
            const now = new Date().toISOString();
            t.update(userRef, {
                balance: updatedBalance,
                updatedAt: now
            });
            const txPayload = {
                id: txRef.id,
                userId,
                customerEmail: uData.email || '',
                customerName: uData.displayName || uData.name || 'Customer',
                type: effectiveAction === 'add' ? 'credit' : 'debit',
                amount: numAmount,
                balanceBefore: currentBalance,
                balanceAfter: updatedBalance,
                reason: reason.trim(),
                adminNotes: adminNotes || '',
                createdBy: req.user.email || 'Admin',
                createdAt: now
            };
            t.set(txRef, txPayload);
            return { newBalance: updatedBalance, userData: uData, txData: txPayload };
        });
        // Send email notification to customer
        if (userData.email) {
            const subject = effectiveAction === 'add'
                ? `Account Balance Credited - ৳${numAmount.toLocaleString()}`
                : `Account Balance Debited - ৳${numAmount.toLocaleString()}`;
            await sendEmail({
                to: userData.email,
                subject,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: ${effectiveAction === 'add' ? '#10b981' : '#f59e0b'};">
              Account Wallet ${effectiveAction === 'add' ? 'Credited' : 'Debited'}
            </h2>
            <p>Dear ${userData.displayName || userData.name || 'Customer'},</p>
            <p>Your account balance has been updated by administrator.</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 4px 0;"><strong>${effectiveAction === 'add' ? 'Amount Added' : 'Amount Deducted'}:</strong> ৳${numAmount.toLocaleString()}</p>
              <p style="margin: 4px 0;"><strong>Reason:</strong> ${reason.trim()}</p>
              <p style="margin: 4px 0;"><strong>New Balance:</strong> ৳${newBalance.toLocaleString()}</p>
            </div>
            <p>You can use your wallet balance for fast 1-click domain registration and renewals!</p>
            <p style="margin-top: 20px; color: #64748b; text-align: center;">Click2IT Billing Team</p>
          </div>
        `,
                customerEmail: userData.email,
                category: 'payment'
            }).catch(e => console.warn('Balance change email failed:', e));
        }
        return res.json({
            success: true,
            message: `Balance successfully ${effectiveAction === 'add' ? 'credited' : 'debited'}.`,
            newBalance,
            transaction: txData
        });
    }
    catch (error) {
        console.error('Failed to adjust customer balance:', error);
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message || 'Failed to adjust balance.' });
    }
};
customersRouter.post('/admin/:userId/balance', requireFirebaseAuth, handleAdminBalanceAdjust);
customersRouter.post('/admin/balance', requireFirebaseAuth, handleAdminBalanceAdjust);
customersRouter.post('/admin/add-funds', requireFirebaseAuth, handleAdminBalanceAdjust);
/**
 * GET /api/admin/customers/:userId/transactions
 * Admin Get Wallet Transactions for a specific customer
 */
customersRouter.get('/admin/:userId/transactions', requireFirebaseAuth, async (req, res) => {
    const adminUid = req.user?.uid;
    const { userId } = req.params;
    const isAdmin = await isUserAdmin(adminUid, req.user?.email).catch(() => false);
    if (!isAdmin) {
        return res.status(403).json({ error: 'Admin authorization required.' });
    }
    try {
        const db = getAdminDb();
        const txSnap = await db.collection('wallet_transactions')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();
        const transactions = txSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));
        return res.json({
            success: true,
            transactions
        });
    }
    catch (error) {
        console.error('Failed to get transactions:', error);
        return res.status(500).json({ error: error.message || 'Failed to fetch transactions.' });
    }
});
/**
 * GET /api/admin/customers/deposits/pending
 * Admin List all pending deposit requests
 */
customersRouter.get('/admin/deposits/pending', requireFirebaseAuth, async (req, res) => {
    const adminUid = req.user?.uid;
    const isAdmin = await isUserAdmin(adminUid, req.user?.email).catch(() => false);
    if (!isAdmin) {
        return res.status(403).json({ error: 'Admin authorization required.' });
    }
    try {
        const db = getAdminDb();
        const depSnap = await db.collection('deposit_requests')
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();
        const deposits = depSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));
        return res.json({
            success: true,
            deposits
        });
    }
    catch (error) {
        console.error('Failed to list deposit requests:', error);
        return res.status(500).json({ error: error.message || 'Failed to list deposit requests.' });
    }
});
/**
 * POST /api/admin/customers/deposits/:depositId/verify
 * Admin Approve or Reject a Deposit Request
 */
customersRouter.post('/admin/deposits/:depositId/verify', requireFirebaseAuth, async (req, res) => {
    const adminUid = req.user?.uid;
    const { depositId } = req.params;
    const { action, adminNotes } = req.body;
    const isAdmin = await isUserAdmin(adminUid, req.user?.email).catch(() => false);
    if (!isAdmin) {
        return res.status(403).json({ error: 'Admin authorization required.' });
    }
    if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'Action must be approve or reject.' });
    }
    try {
        const db = getAdminDb();
        const depRef = db.collection('deposit_requests').doc(depositId);
        const now = new Date().toISOString();
        if (action === 'approve') {
            const txRef = db.collection('wallet_transactions').doc();
            const { newBalance, depData } = await db.runTransaction(async (t) => {
                const depSnap = await t.get(depRef);
                if (!depSnap.exists) {
                    const err = new Error('Deposit request not found.');
                    err.statusCode = 404;
                    throw err;
                }
                const dData = depSnap.data() || {};
                if (dData.status !== 'pending') {
                    const err = new Error(`Deposit request is already ${dData.status}.`);
                    err.statusCode = 400;
                    throw err;
                }
                const userRef = db.collection('users').doc(dData.userId);
                const userSnap = await t.get(userRef);
                if (!userSnap.exists) {
                    const err = new Error('Customer user document not found.');
                    err.statusCode = 404;
                    throw err;
                }
                const userData = userSnap.data() || {};
                const currentBalance = typeof userData.balance === 'number' ? userData.balance : 0;
                const updatedBalance = currentBalance + Number(dData.amount || 0);
                t.update(userRef, {
                    balance: updatedBalance,
                    updatedAt: now
                });
                t.set(txRef, {
                    id: txRef.id,
                    userId: dData.userId,
                    customerEmail: dData.customerEmail,
                    customerName: dData.customerName,
                    type: 'credit',
                    amount: dData.amount,
                    balanceBefore: currentBalance,
                    balanceAfter: updatedBalance,
                    reason: `Approved Deposit via ${(dData.paymentMethod || 'EPS').toUpperCase()} (TX: ${dData.transactionId})`,
                    depositRequestId: depositId,
                    adminNotes: adminNotes || '',
                    createdBy: req.user.email || 'Admin',
                    createdAt: now
                });
                t.update(depRef, {
                    status: 'approved',
                    adminNotes: adminNotes || '',
                    verifiedAt: now,
                    verifiedBy: req.user.email || 'Admin',
                    updatedAt: now
                });
                return { newBalance: updatedBalance, depData: dData };
            });
            // Send email
            if (depData.customerEmail) {
                await sendEmail({
                    to: depData.customerEmail,
                    subject: `Deposit Approved - ৳${depData.amount.toLocaleString()} Credited`,
                    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #10b981;">Deposit Request Approved!</h2>
              <p>Dear ${depData.customerName},</p>
              <p>Your deposit of <strong>৳${depData.amount.toLocaleString()}</strong> has been verified and added to your wallet balance.</p>
              <p><strong>New Balance:</strong> ৳${newBalance.toLocaleString()}</p>
              <p>You can now use your balance for domain registration, renewals, and web hosting!</p>
              <p style="margin-top: 20px; color: #64748b; text-align: center;">Thank you for choosing Click2IT!</p>
            </div>
          `,
                    customerEmail: depData.customerEmail,
                    category: 'payment'
                }).catch(e => console.warn('Deposit approved email failed:', e));
            }
            return res.json({
                success: true,
                message: 'Deposit request approved and funds added to customer balance.',
                newBalance
            });
        }
        else {
            // Reject
            const depSnap = await depRef.get();
            if (!depSnap.exists) {
                return res.status(404).json({ error: 'Deposit request not found.' });
            }
            const depData = depSnap.data() || {};
            if (depData.status !== 'pending') {
                return res.status(400).json({ error: `Deposit request is already ${depData.status}.` });
            }
            await depRef.update({
                status: 'rejected',
                adminNotes: adminNotes || '',
                verifiedAt: now,
                verifiedBy: req.user.email || 'Admin',
                updatedAt: now
            });
            if (depData.customerEmail) {
                await sendEmail({
                    to: depData.customerEmail,
                    subject: `Deposit Request Update - ৳${depData.amount.toLocaleString()}`,
                    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #ef4444;">Deposit Request Not Approved</h2>
              <p>Dear ${depData.customerName},</p>
              <p>Your deposit request of ৳${depData.amount.toLocaleString()} could not be verified.</p>
              ${adminNotes ? `<p><strong>Note:</strong> ${adminNotes}</p>` : ''}
              <p>If you believe this is an error, please contact support with your payment receipt.</p>
            </div>
          `,
                    customerEmail: depData.customerEmail,
                    category: 'payment'
                }).catch(e => console.warn('Deposit rejected email failed:', e));
            }
            return res.json({
                success: true,
                message: 'Deposit request rejected.'
            });
        }
    }
    catch (error) {
        console.error('Failed to verify deposit request:', error);
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message || 'Failed to process deposit verification.' });
    }
});
export default customersRouter;
