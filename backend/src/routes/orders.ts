import { Router, Response } from 'express';
import { getAdminDb, isUserAdmin } from '../firebase/admin';
import { sendEmail } from '../services/email';
import { requireFirebaseAuth } from '../middleware/firebaseAuth';
import { fulfillOrder } from '../services/fulfillment';

const ordersRouter = Router();

ordersRouter.post('/:orderId/payment/manual-bkash', requireFirebaseAuth, async (req: any, res: Response) => {
  const userId = req.user?.uid;
  const { orderId } = req.params;
  const { transactionId } = req.body;

  if (!transactionId || typeof transactionId !== 'string' || transactionId.trim().length < 3) {
    return res.status(400).json({ error: 'Valid transaction ID is required.' });
  }

  try {
    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const orderData = orderSnap.data();
    if (!orderData) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (orderData.userId !== userId) {
      return res.status(403).json({ error: 'You are not authorized to update this order.' });
    }

    if (orderData.paymentStatus === 'verified') {
      return res.status(400).json({ error: 'Payment has already been verified.' });
    }

    if (orderData.paymentStatus === 'submitted') {
      return res.status(400).json({ error: 'Payment is already submitted for verification.' });
    }

    const trimmedTx = transactionId.trim();
    const now = new Date().toISOString();

    await orderRef.update({
      paymentStatus: 'submitted',
      paymentVerificationStatus: 'review',
      providerStatus: 'pending',
      transactionId: trimmedTx,
      paymentMethod: 'manual_bkash',
      paymentSubmittedAt: now,
      updatedAt: now,
    });

    const emailResult = await sendEmail({
      to: orderData.customerEmail,
      subject: `Order Received - #${orderId.slice(0, 8)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Order Received!</h2>
          <p>Dear ${orderData.customerName || 'Customer'},</p>
          <p>We have received your order <strong>#${orderId.slice(0, 8)}</strong> with manual bKash payment instruction.</p>
          <p><strong>Transaction ID:</strong> ${trimmedTx}</p>
          <p><strong>Amount:</strong> ৳${orderData.total}</p>
          <p>Your payment is pending verification. We will notify you once it is confirmed.</p>
          <p>Thank you for choosing Click2IT!</p>
        </div>
      `,
      orderId,
      customerEmail: orderData.customerEmail,
      category: 'payment',
    });

    return res.json({
      success: true,
      message: 'Transaction ID submitted successfully. Payment is pending verification.',
      emailSent: emailResult.success,
    });
  } catch (error: any) {
    console.error('Manual bKash submission error:', error);
    return res.status(500).json({ error: error.message || 'Failed to submit payment.' });
  }
});

ordersRouter.post('/admin/:orderId/payment/verify', requireFirebaseAuth, async (req: any, res: Response) => {
  const adminUid = req.user?.uid;
  const { orderId } = req.params;
  const { action, reason } = req.body;

  // Security: only admins can verify payments
  const adminCheck = await isUserAdmin(adminUid).catch(() => false);
  if (!adminCheck) {
    return res.status(403).json({ error: 'Admin access required.' });
  }

  if (!['accept', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action. Use "accept" or "reject".' });
  }

  try {
    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const orderData = orderSnap.data();
    if (!orderData) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (!orderData.transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required for verification.' });
    }

    if (orderData.paymentStatus === 'verified') {
      return res.status(409).json({ success: true, alreadyVerified: true, message: 'Payment has already been verified.' });
    }

    if (orderData.paymentStatus === 'rejected') {
      return res.status(400).json({ error: 'Payment has already been rejected. Contact support to override.' });
    }

    if (orderData.paymentStatus !== 'submitted') {
      return res.status(400).json({ error: 'Order is not awaiting payment verification.' });
    }

    const now = new Date().toISOString();
    const auditRef = db.collection('paymentAuditLog').doc();

    if (action === 'reject') {
      await db.runTransaction(async (tx) => {
        tx.update(orderRef, {
          paymentStatus: 'rejected',
          paymentVerificationStatus: 'rejected',
          providerStatus: 'cancelled',
          paymentRejectedBy: adminUid,
          paymentRejectedAt: now,
          paymentRejectionReason: reason || 'Payment verification failed.',
          updatedAt: now,
        });

        tx.set(auditRef, {
          orderId,
          action: 'payment_rejected',
          adminUid,
          transactionId: orderData.transactionId,
          amount: orderData.total,
          timestamp: now,
          reason: reason || 'Payment verification failed.',
        });
      });

      const emailResult = await sendEmail({
        to: orderData.customerEmail,
        subject: `Payment Rejected - #${orderId.slice(0, 8)}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Payment Rejected</h2>
            <p>Dear ${orderData.customerName || 'Customer'},</p>
            <p>Your payment for order <strong>#${orderId.slice(0, 8)}</strong> could not be verified.</p>
            <p><strong>Reason:</strong> ${reason || 'Payment verification failed.'}</p>
            <p>Please contact support or try again with a valid transaction.</p>
            <p>Thank you,<br>Click2IT Team</p>
          </div>
        `,
        orderId,
        customerEmail: orderData.customerEmail,
        category: 'payment',
      });

      return res.json({
        success: true,
        message: 'Payment rejected successfully.',
        emailSent: emailResult.success,
      });
    }

    if (action === 'accept') {
      await db.runTransaction(async (tx) => {
        tx.update(orderRef, {
          paymentStatus: 'verified',
          paymentVerificationStatus: 'verified',
          providerStatus: 'processing',
          paymentVerifiedBy: adminUid,
          paymentVerifiedAt: now,
          updatedAt: now,
        });

        tx.set(auditRef, {
          orderId,
          action: 'payment_verified',
          adminUid,
          transactionId: orderData.transactionId,
          amount: orderData.total,
          timestamp: now,
          reason: reason || null,
        });
      });

      const emailResult = await sendEmail({
        to: orderData.customerEmail,
        subject: `Payment Confirmed - #${orderId.slice(0, 8)}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Payment Confirmed!</h2>
            <p>Dear ${orderData.customerName || 'Customer'},</p>
            <p>Your payment for order <strong>#${orderId.slice(0, 8)}</strong> has been verified.</p>
            <p><strong>Amount:</strong> ৳${orderData.total}</p>
            <p><strong>Transaction ID:</strong> ${orderData.transactionId}</p>
            <p>Your order is now being processed. We will notify you once it is completed.</p>
            <p>Thank you for choosing Click2IT!</p>
          </div>
        `,
        orderId,
        customerEmail: orderData.customerEmail,
        category: 'payment',
      });

      let fulfillmentError: string | null = null;
      try {
        const fulfillmentResult = await fulfillOrder(orderId, adminUid);
        console.log(`[Orders] Fulfillment started for order ${orderId}:`, fulfillmentResult);
      } catch (err: any) {
        fulfillmentError = err.message || 'Unknown fulfillment error';
        console.error(`[Orders] Fulfillment failed for order ${orderId}:`, err);
      }

      return res.json({
        success: true,
        message: 'Payment verified successfully. Order is now processing.',
        emailSent: emailResult.success,
        fulfillmentError: fulfillmentError || undefined,
      });
    }

    return res.status(400).json({ error: 'Invalid action.' });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ error: error.message || 'Failed to verify payment.' });
  }
});

ordersRouter.post('/admin/:orderId/retry-fulfillment', requireFirebaseAuth, async (req: any, res: Response) => {
  try {
    const adminUid = req.user?.uid;
    const { orderId } = req.params;

    const isAdmin = await isUserAdmin(adminUid);
    if (!isAdmin) {
      return res.status(403).json({ success: false, error: 'Admin authorization required' });
    }

    const result = await fulfillOrder(orderId, adminUid);
    return res.json(result);
  } catch (error: any) {
    console.error('Retry fulfillment error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

ordersRouter.get('/:orderId/payment/query-bkash', requireFirebaseAuth, async (req: any, res: Response) => {
  try {
    const { orderId } = req.params;
    const { paymentId } = req.query;

    if (!paymentId) {
      return res.status(400).json({ success: false, error: 'paymentId is required' });
    }

    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const orderData = orderSnap.data();
    if (!orderData) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    return res.json({ 
      success: true, 
      status: orderData.paymentStatus === 'verified' ? 'Completed' : 'Pending',
      orderId,
      paymentId,
    });
  } catch (error: any) {
    console.error('bKash query payment error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Payment query failed' });
  }
});

ordersRouter.post('/:orderId/payment/execute-bkash', requireFirebaseAuth, async (req: any, res: Response) => {
  try {
    const { orderId } = req.params;
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ success: false, error: 'paymentId is required' });
    }

    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const orderData = orderSnap.data();
    if (!orderData) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (orderData.paymentStatus === 'verified') {
      return res.json({ success: true, message: 'Payment already verified' });
    }

    await orderRef.update({
      paymentStatus: 'verified',
      bkashPaymentId: paymentId,
      updatedAt: new Date().toISOString(),
    });

    return res.json({ success: true, message: 'Payment executed successfully' });
  } catch (error: any) {
    console.error('bKash execute payment error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Payment execution failed' });
  }
});

export default ordersRouter;
