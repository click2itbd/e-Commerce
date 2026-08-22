import { Router, Response } from 'express';
import { getAdminDb } from '../admin';
import { sendEmail, EmailTemplates } from '../utils/email';
import { requireFirebaseAuth, requireAdmin } from '../middleware/firebaseAuth';

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

ordersRouter.post('/admin/:orderId/payment/verify', requireAdmin, async (req: any, res: Response) => {
  const adminUid = req.user?.uid;
  const { orderId } = req.params;
  const { action, reason } = req.body;

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
      const result = await db.runTransaction(async (tx) => {
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
      const result = await db.runTransaction(async (tx) => {
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

      const webhookUrl = process.env.PAYMENT_WEBHOOK_URL;
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Secret': process.env.MANUAL_PAYMENT_SECRET || '',
          },
          body: JSON.stringify({
            orderId,
            status: 'manual_verified',
            transactionId: orderData.transactionId,
          }),
        }).catch((webhookError) => {
          console.error('Failed to call payment webhook after manual verification:', webhookError);
        });
      }

      return res.json({
        success: true,
        message: 'Payment verified successfully. Order is now processing.',
        emailSent: emailResult.success,
      });
    }

    return res.status(400).json({ error: 'Invalid action.' });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ error: error.message || 'Failed to verify payment.' });
  }
});

export default ordersRouter;
