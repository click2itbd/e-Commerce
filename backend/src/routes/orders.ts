import { Router, Response } from 'express';
import { getAdminDb, isUserAdmin } from '../firebase/admin.js';
import { sendEmail } from '../services/email.js';
import { requireFirebaseAuth } from '../middleware/firebaseAuth.js';
import { fulfillOrder } from '../services/fulfillment.js';
import { calculateAndCreateServerOrder } from '../services/orderPricing.js';
import { epsInitializePayment, epsVerifyTransaction } from '../services/epsGateway.js';

const ordersRouter = Router();

ordersRouter.post('/create', requireFirebaseAuth, async (req: any, res: Response) => {
  const userId = req.user?.uid;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Authentication required to create an order.' });
  }

  try {
    const result = await calculateAndCreateServerOrder(userId, req.body);

    let paymentUrl: string | null = null;
    let redirectUrl: string | null = null;
    let paymentId: string | null = null;

    const isAdvanceCOD = req.body.paymentType === 'cod' && Boolean(req.body.advanceDelivery) && result.shippingCost > 0;
    const isOnlineRequired = req.body.paymentType === 'pay_now' || isAdvanceCOD;

    if (isOnlineRequired) {
      const payableAmount = isAdvanceCOD ? result.shippingCost : result.grandTotal;
      if (payableAmount > 0) {
        const orderInfo = (result.orderData || {}) as any;
        const originHeader = String(req.headers.origin || process.env.FRONTEND_URL || 'https://click2itbd.com').replace(
          /\/+$/,
          ''
        );
        const baseReturnUrl = `${originHeader}/payment/return?orderId=${encodeURIComponent(result.orderId)}&method=eps`;
        const firstItemName =
          Array.isArray(orderInfo.items) && orderInfo.items[0]?.name
            ? String(orderInfo.items[0].name)
            : `Order #${result.orderId.slice(0, 8)}`;

        try {
          const epsResult = await epsInitializePayment({
            orderId: result.orderId,
            amount: payableAmount,
            customerName: String(orderInfo.customerName || req.user?.name || 'Customer'),
            customerEmail: String(orderInfo.customerEmail || req.user?.email || 'customer@click2itbd.com'),
            customerPhone: String(orderInfo.customerPhone || '01700000000'),
            customerAddress: String(orderInfo.shippingAddress || 'Dhaka, Bangladesh'),
            productName: firstItemName,
            productCategory: req.body.platform === 'hosting' ? 'Hosting & Domain' : 'Ecommerce',
            ipAddress: String(req.ip || req.socket?.remoteAddress || '127.0.0.1'),
            successUrl: `${baseReturnUrl}&status=success`,
            failUrl: `${baseReturnUrl}&status=failed`,
            cancelUrl: `${baseReturnUrl}&status=cancelled`,
          });

          const now = new Date().toISOString();
          const db = getAdminDb();
          await db.collection('orders').doc(result.orderId).update({
            epsMerchantTransactionId: epsResult.merchantTransactionId,
            epsTransactionId: epsResult.transactionId,
            epsPayableAmount: payableAmount,
            paymentMethod: isAdvanceCOD ? 'cod_advance_paid' : 'eps',
            epsInitiatedAt: now,
            updatedAt: now,
          });

          paymentUrl = epsResult.redirectUrl;
          redirectUrl = epsResult.redirectUrl;
          paymentId = epsResult.merchantTransactionId;
        } catch (epsErr: any) {
          console.warn('[Orders] In-flight EPS init in /create failed, client can retry via /payment/eps/init:', epsErr?.message);
        }
      }
    }

    return res.status(201).json({
      success: true,
      orderId: result.orderId,
      orderData: result.orderData,
      subtotal: result.subtotal,
      discountAmount: result.discountAmount,
      shippingCost: result.shippingCost,
      grandTotal: result.grandTotal,
      payNowAmount: result.payNowAmount,
      paymentUrl,
      redirectUrl,
      paymentId,
    });
  } catch (error: any) {
    console.error('[Orders] Server-side order creation failed:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to validate and create order.',
    });
  }
});

ordersRouter.post('/:orderId/payment/manual-bkash', requireFirebaseAuth, async (_req: any, res: Response) => {
  return res.status(410).json({
    success: false,
    error: 'Manual payment is disabled. All online payments must be completed through the EPS Payment Gateway.',
  });
});

/**
 * POST /api/orders/:orderId/payment/eps/init
 * Initializes an EPS payment session using the server-calculated order total.
 */
ordersRouter.post('/:orderId/payment/eps/init', requireFirebaseAuth, async (req: any, res: Response) => {
  const userId = req.user?.uid;
  const { orderId } = req.params;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  try {
    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    const orderData = orderSnap.data() || {};
    const adminCheck = await isUserAdmin(userId).catch(() => false);
    if (orderData.userId !== userId && !adminCheck) {
      return res.status(403).json({ success: false, error: 'You are not authorized to pay for this order.' });
    }

    if (orderData.paymentStatus === 'verified') {
      return res.status(400).json({ success: false, error: 'Payment has already been verified for this order.' });
    }

    const expectedAmount =
      orderData.paymentMethod === 'cod_advance_paid' && Number(orderData.advancePaidAmount) > 0
        ? Number(orderData.advancePaidAmount)
        : Number(orderData.total || 0);

    if (expectedAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid payable amount for this order.' });
    }

    const originHeader = String(req.headers.origin || process.env.FRONTEND_URL || 'https://click2itbd.com').replace(
      /\/+$/,
      ''
    );
    const baseReturnUrl = `${originHeader}/payment/return?orderId=${encodeURIComponent(orderId)}&method=eps`;

    const firstItemName =
      Array.isArray(orderData.items) && orderData.items[0]?.name
        ? String(orderData.items[0].name)
        : `Order #${orderId.slice(0, 8)}`;

    const epsResult = await epsInitializePayment({
      orderId,
      amount: expectedAmount,
      customerName: String(orderData.customerName || 'Customer'),
      customerEmail: String(orderData.customerEmail || req.user?.email || 'customer@click2itbd.com'),
      customerPhone: String(orderData.customerPhone || '01700000000'),
      customerAddress: String(orderData.shippingAddress || 'Dhaka, Bangladesh'),
      productName: firstItemName,
      productCategory: orderData.platform === 'hosting' ? 'Hosting & Domain' : 'Ecommerce',
      ipAddress: String(req.ip || req.socket?.remoteAddress || '127.0.0.1'),
      successUrl: `${baseReturnUrl}&status=success`,
      failUrl: `${baseReturnUrl}&status=failed`,
      cancelUrl: `${baseReturnUrl}&status=cancelled`,
    });

    const now = new Date().toISOString();
    await orderRef.update({
      epsMerchantTransactionId: epsResult.merchantTransactionId,
      epsTransactionId: epsResult.transactionId,
      epsPayableAmount: expectedAmount,
      paymentMethod: orderData.paymentMethod === 'cod_advance_paid' ? 'cod_advance_paid' : 'eps',
      epsInitiatedAt: now,
      updatedAt: now,
    });

    return res.json({
      success: true,
      paymentUrl: epsResult.redirectUrl,
      redirectUrl: epsResult.redirectUrl,
      paymentId: epsResult.merchantTransactionId,
      merchantTransactionId: epsResult.merchantTransactionId,
      transactionId: epsResult.transactionId,
    });
  } catch (error: any) {
    console.error('[EPS Init] Failed to initialize EPS payment:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to initialize EPS payment.',
    });
  }
});

/**
 * POST /api/orders/:orderId/payment/eps/verify
 * Verifies an EPS transaction server-to-server via CheckMerchantTransactionStatus.
 */
ordersRouter.post('/:orderId/payment/eps/verify', requireFirebaseAuth, async (req: any, res: Response) => {
  const userId = req.user?.uid;
  const { orderId } = req.params;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  try {
    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    const orderData = orderSnap.data() || {};
    const adminCheck = await isUserAdmin(userId).catch(() => false);
    if (orderData.userId !== userId && !adminCheck) {
      return res.status(403).json({ success: false, error: 'You are not authorized to verify this order.' });
    }

    if (orderData.paymentStatus === 'verified') {
      return res.json({
        success: true,
        alreadyVerified: true,
        status: 'Success',
        transactionId: orderData.transactionId || orderData.epsTransactionId,
        merchantTransactionId: orderData.epsMerchantTransactionId,
      });
    }

    const merchantTransactionId = String(
      req.body?.merchantTransactionId || req.body?.paymentId || orderData.epsMerchantTransactionId || ''
    ).trim();

    if (!merchantTransactionId) {
      return res.status(400).json({
        success: false,
        error: 'merchantTransactionId is required to verify EPS payment.',
      });
    }

    // Security check: if order already recorded an epsMerchantTransactionId, ensure it matches or CustomerOrderId matches
    const verifyRes = await epsVerifyTransaction(merchantTransactionId);
    if (!verifyRes.verified) {
      return res.status(400).json({
        success: false,
        status: verifyRes.status || 'Failed',
        error: `EPS payment is not verified (Status: ${verifyRes.status || 'Failed'}).`,
      });
    }

    if (verifyRes.customerOrderId && verifyRes.customerOrderId !== orderId) {
      return res.status(400).json({
        success: false,
        error: 'Transaction Order ID mismatch.',
      });
    }

    const expectedAmount = Number(
      orderData.epsPayableAmount ||
        (orderData.paymentMethod === 'cod_advance_paid' && Number(orderData.advancePaidAmount) > 0
          ? orderData.advancePaidAmount
          : orderData.total) ||
        0
    );

    if (verifyRes.totalAmount > 0 && expectedAmount > 0 && Math.abs(verifyRes.totalAmount - expectedAmount) > 1) {
      return res.status(400).json({
        success: false,
        error: `Payment amount mismatch. Expected ৳${expectedAmount}, received ৳${verifyRes.totalAmount}.`,
      });
    }

    const now = new Date().toISOString();
    const grandTotal = Number(orderData.total || 0);
    const isAdvance = orderData.paymentMethod === 'cod_advance_paid';
    const actualPaid = Number(verifyRes.totalAmount > 0 ? verifyRes.totalAmount : expectedAmount);
    const dueAmount = isAdvance ? Math.max(0, grandTotal - actualPaid) : 0;

    await orderRef.update({
      status: 'processing',
      paymentStatus: 'verified',
      paymentVerificationStatus: 'verified',
      providerStatus: 'processing',
      paymentMethod: isAdvance ? 'cod_advance_paid' : 'eps',
      transactionId: verifyRes.epsTransactionId || merchantTransactionId,
      epsMerchantTransactionId: merchantTransactionId,
      epsFinancialEntity: verifyRes.financialEntity,
      paidAmount: actualPaid,
      dueAmount,
      advancePaidAmount: isAdvance ? actualPaid : 0,
      paymentVerifiedAt: now,
      paidAt: now,
      updatedAt: now,
    });

    // Record verified payment in transactions accounting ledger
    try {
      await db.collection('transactions').add({
        type: 'payment_received',
        amount: actualPaid,
        date: now,
        description: isAdvance
          ? `Advance Delivery Fee for Order #${orderData.documentNumber || orderId.slice(0, 8)} (${verifyRes.financialEntity})`
          : `EPS Payment for Order #${orderData.documentNumber || orderId.slice(0, 8)} (${verifyRes.financialEntity})`,
        entityId: orderData.customerId || orderData.userId || userId,
        entityName: orderData.customerName || 'Online Customer',
        entityType: 'customer',
        referenceId: orderId,
        documentNumber: orderData.documentNumber || orderId.slice(0, 8),
        paymentAccountId: '',
        paymentMethod: verifyRes.financialEntity || 'eps',
        createdAt: now,
        createdBy: 'EPS Payment Gateway',
      });
    } catch (txErr) {
      console.warn('[EPS Verify] Failed to write payment_received transaction:', txErr);
    }

    // Ensure customer is in `customers` collection for accounting due tracking
    try {
      const custId = orderData.customerId || orderData.userId || userId;
      const custRef = db.collection('customers').doc(custId);
      const custSnap = await custRef.get();
      if (!custSnap.exists) {
        await custRef.set({
          id: custId,
          name: orderData.customerName || 'Customer',
          email: orderData.customerEmail || '',
          phone: orderData.customerPhone || '',
          address: orderData.shippingAddress || '',
          createdAt: now,
          updatedAt: now,
          source: 'online_store',
        });
      }
    } catch (cErr) {
      console.warn('[EPS Verify] Customer sync error:', cErr);
    }

    const hostingOrderRef = db.collection('hostingOrders').doc(orderId);
    const hostingOrderSnap = await hostingOrderRef.get();
    if (hostingOrderSnap.exists) {
      await hostingOrderRef.update({
        paymentStatus: 'verified',
        paymentVerificationStatus: 'verified',
        transactionId: verifyRes.epsTransactionId || merchantTransactionId,
        paymentVerifiedAt: now,
        updatedAt: now,
      });
    }

    let fulfillmentResult: any = null;
    try {
      fulfillmentResult = await fulfillOrder(orderId, 'eps-gateway');
    } catch (fErr: any) {
      console.warn('[EPS Verify] Auto-fulfillment warning:', fErr);
    }

    // Send order confirmation email upon verified payment
    if (orderData.customerEmail) {
      try {
        const docNum = orderData.documentNumber || `#${orderId.slice(0, 8)}`;
        await sendEmail({
          to: orderData.customerEmail,
          subject: isAdvance
            ? `Advance Delivery Paid & Order Confirmed - ${docNum}`
            : `Payment Confirmed & Order Placed - ${docNum}`,
          html: `
            <div style="font-family: sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; rounded: 12px;">
              <h2 style="color: #0E2A47; margin-bottom: 8px;">Click2IT BD</h2>
              <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px 16px; margin: 16px 0;">
                <p style="margin: 0; font-weight: bold; color: #166534;">Payment Verified via EPS Gateway!</p>
                <p style="margin: 4px 0 0; font-size: 13px; color: #15803d;">Transaction ID: ${verifyRes.epsTransactionId || merchantTransactionId} (${verifyRes.financialEntity})</p>
              </div>
              <p>Dear ${orderData.customerName || 'Customer'},</p>
              <p>Your order <strong>${docNum}</strong> has been confirmed. ${isAdvance ? `You have paid the advance delivery charge of ৳${actualPaid}. Remaining due of ৳${dueAmount} will be collected upon delivery.` : `Total paid: ৳${actualPaid}.`}</p>
              <p style="margin-top: 24px; font-size: 12px; color: #64748b;">Thank you for shopping with Click2IT BD.</p>
            </div>
          `,
        });
      } catch (mailErr) {
        console.warn('[EPS Verify] Failed to send confirmation email:', mailErr);
      }
    }

    return res.json({
      success: true,
      status: verifyRes.status,
      transactionId: verifyRes.epsTransactionId || merchantTransactionId,
      merchantTransactionId,
      fulfillment: fulfillmentResult,
    });
  } catch (error: any) {
    console.error('[EPS Verify] Payment verification error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'EPS payment verification failed.',
    });
  }
});

/**
 * POST /api/orders/:orderId/payment/eps/fail-or-cancel
 * Cancels an order when the customer cancels payment or when EPS declines it.
 * Releases reserved stock and removes pending accounting transactions.
 */
ordersRouter.post('/:orderId/payment/eps/fail-or-cancel', requireFirebaseAuth, async (req: any, res: Response) => {
  const userId = req.user?.uid;
  const { orderId } = req.params;
  const { reason, status } = req.body || {};

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  try {
    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    const orderData = orderSnap.data() || {};
    const adminCheck = await isUserAdmin(userId).catch(() => false);
    if (orderData.userId !== userId && !adminCheck) {
      return res.status(403).json({ success: false, error: 'Unauthorized.' });
    }

    // If order was already paid, do not cancel
    if (orderData.paymentStatus === 'verified') {
      return res.status(400).json({ success: false, error: 'Cannot cancel an order with verified payment.' });
    }

    const now = new Date().toISOString();
    const targetStatus = status === 'failed' ? 'payment_failed' : 'cancelled';

    await orderRef.update({
      status: targetStatus,
      paymentStatus: status === 'failed' ? 'failed' : 'cancelled',
      cancellationReason: reason || 'Customer cancelled payment or transaction failed on EPS Gateway.',
      cancelledAt: now,
      updatedAt: now,
    });

    // Remove pending sale transaction so customer doesn't owe money for a cancelled order
    try {
      const txSnap = await db.collection('transactions').where('referenceId', '==', orderId).get();
      for (const tDoc of txSnap.docs) {
        await tDoc.ref.delete();
      }
    } catch (txErr) {
      console.warn('[EPS Cancel] Failed to cleanup pending transaction:', txErr);
    }

    // Restore stock
    try {
      const rawItems = Array.isArray(orderData.items) ? orderData.items : [];
      for (const item of rawItems) {
        const prodId = item.productId || item.id;
        if (prodId && item.quantity) {
          const pRef = db.collection('products').doc(prodId);
          const pSnap = await pRef.get();
          if (pSnap.exists) {
            const curr = Number(pSnap.data()?.stock || 0);
            await pRef.update({ stock: curr + Number(item.quantity), updatedAt: now });
          }
        }
      }
    } catch (stockErr) {
      console.warn('[EPS Cancel] Failed to restore product stock:', stockErr);
    }

    return res.json({
      success: true,
      message: `Order marked as ${targetStatus}.`,
    });
  } catch (error: any) {
    console.error('[EPS Cancel] Error cancelling order:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to cancel order.' });
  }
});

ordersRouter.post('/admin/:orderId/payment/verify', requireFirebaseAuth, async (req: any, res: Response) => {
  const adminUid = req.user?.uid || req.user?.user_id || req.user?.sub || 'admin';
  const { orderId } = req.params;
  const { action, reason } = req.body;

  // Security: check admin/staff access
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

    if (orderData.paymentStatus === 'verified') {
      if (action === 'accept') {
        let retryFulfillmentError: string | null = null;
        let fulfillmentResult;
        try {
          fulfillmentResult = await fulfillOrder(orderId, adminUid);
        } catch (e: any) {
          retryFulfillmentError = e.message || 'Fulfillment retry failed';
        }
        return res.json({
          success: true,
          alreadyVerified: true,
          message: fulfillmentResult?.status === 'pending'
            ? 'The registrar request is still pending; it was not submitted again.'
            : 'Fulfillment retry requested successfully.',
          fulfillmentResult,
          fulfillmentError: retryFulfillmentError || undefined,
        });
      }
      return res.status(200).json({ success: true, alreadyVerified: true, message: 'Payment has already been verified.' });
    }

    const now = new Date().toISOString();
    const txId = orderData.transactionId || 'MANUAL-VERIFY';
    const orderTotal = Number(orderData.total) || 0;

    if (action === 'reject') {
      await orderRef.update({
        paymentStatus: 'rejected',
        paymentVerificationStatus: 'rejected',
        providerStatus: 'cancelled',
        paymentRejectedBy: adminUid,
        paymentRejectedAt: now,
        paymentRejectionReason: reason || 'Payment verification failed.',
        updatedAt: now,
      });

      try {
        await db.collection('paymentAuditLog').add({
          orderId,
          action: 'payment_rejected',
          adminUid,
          transactionId: txId,
          amount: orderTotal,
          timestamp: now,
          reason: reason || 'Payment verification failed.',
        });
      } catch (auditErr) {
        console.warn('[Orders] Failed to write audit log:', auditErr);
      }

      let emailSent = false;
      if (orderData.customerEmail) {
        try {
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
          emailSent = emailResult.success;
        } catch (mailErr) {
          console.warn('[Orders] Email notification error:', mailErr);
        }
      }

      return res.json({
        success: true,
        message: 'Payment rejected successfully.',
        emailSent,
      });
    }

    if (action === 'accept') {
      await orderRef.update({
        paymentStatus: 'verified',
        paymentVerificationStatus: 'verified',
        providerStatus: 'processing',
        paymentVerifiedBy: adminUid,
        paymentVerifiedAt: now,
        updatedAt: now,
      });

      try {
        await db.collection('paymentAuditLog').add({
          orderId,
          action: 'payment_verified',
          adminUid,
          transactionId: txId,
          amount: orderTotal,
          timestamp: now,
        });
      } catch (auditErr) {
        console.warn('[Orders] Failed to write audit log:', auditErr);
      }

      let emailSent = false;
      if (orderData.customerEmail) {
        try {
          const docNum = orderData.documentNumber || `#${orderId.slice(0, 8)}`;
          const items = Array.isArray(orderData.items) ? orderData.items : [];
          const customerName = orderData.customerName || 'Valued Customer';
          const customerPhone = orderData.customerPhone || '';
          const customerAddress = orderData.shippingAddress || '';
          const paymentMethod = (orderData.paymentMethod || 'bKash').toUpperCase();
          const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

          const itemsRows = items.map((item: any) => `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px 16px; text-align: left;">
                <div style="font-weight: 600; color: #111827; font-size: 14px;">${item.name || item.domain || 'Service Item'}</div>
                ${item.description ? `<div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${item.description}</div>` : ''}
              </td>
              <td style="padding: 12px 16px; text-align: center; color: #4b5563; font-size: 14px;">${item.quantity || 1}</td>
              <td style="padding: 12px 16px; text-align: right; color: #111827; font-weight: 600; font-size: 14px;">৳${(item.price || item.total || 0).toLocaleString()}</td>
            </tr>
          `).join('');

          const emailResult = await sendEmail({
            to: orderData.customerEmail,
            subject: `Payment Confirmed & Receipt - ${docNum}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 30px 10px;">
                  <tr>
                    <td align="center">
                      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
                        
                        <!-- Header Banner -->
                        <tr>
                          <td style="background: linear-gradient(135deg, #0a1628 0%, #1e3a8a 100%); padding: 32px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">CLICK2IT BD</h1>
                            <p style="margin: 6px 0 0; color: #93c5fd; font-size: 13px; font-weight: 500;">Cloud Hosting & Domain Services</p>
                            
                            <div style="margin-top: 18px; display: inline-block; background: rgba(34, 197, 94, 0.2); border: 1px solid #22c55e; border-radius: 30px; padding: 6px 18px;">
                              <span style="color: #4ade80; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">✓ Payment Verified & Confirmed</span>
                            </div>
                          </td>
                        </tr>

                        <!-- Greeting -->
                        <tr>
                          <td style="padding: 28px 30px 15px;">
                            <p style="margin: 0; font-size: 16px; color: #111827;">Dear <strong>${customerName}</strong>,</p>
                            <p style="margin: 8px 0 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
                              Thank you for your payment! We have verified your transaction. Below is your official receipt and order summary.
                            </p>
                          </td>
                        </tr>

                        <!-- Invoice Details Card -->
                        <tr>
                          <td style="padding: 0 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px;">
                              <tr>
                                <td width="50%" style="vertical-align: top;">
                                  <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Invoice Number</div>
                                  <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 2px;">${docNum}</div>
                                  
                                  <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 12px; letter-spacing: 0.5px;">Payment Method</div>
                                  <div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 2px;">${paymentMethod}</div>
                                </td>
                                <td width="50%" style="vertical-align: top; text-align: right;">
                                  <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Date</div>
                                  <div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 2px;">${dateStr}</div>
                                  
                                  <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 12px; letter-spacing: 0.5px;">Transaction ID</div>
                                  <div style="font-size: 13px; font-family: monospace; font-weight: 700; color: #059669; margin-top: 2px;">${txId}</div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- Items Table -->
                        <tr>
                          <td style="padding: 24px 30px 10px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; border-collapse: collapse;">
                              <thead>
                                <tr style="background-color: #f1f5f9; border-bottom: 2px solid #e2e8f0;">
                                  <th style="padding: 10px 16px; text-align: left; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Description</th>
                                  <th style="padding: 10px 16px; text-align: center; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Qty</th>
                                  <th style="padding: 10px 16px; text-align: right; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${itemsRows || `
                                  <tr>
                                    <td style="padding: 12px 16px; text-align: left; font-size: 14px; font-weight: 600; color: #111827;">Hosting / Domain Service</td>
                                    <td style="padding: 12px 16px; text-align: center; font-size: 14px; color: #4b5563;">1</td>
                                    <td style="padding: 12px 16px; text-align: right; font-size: 14px; font-weight: 600; color: #111827;">৳${orderTotal.toLocaleString()}</td>
                                  </tr>
                                `}
                              </tbody>
                              <tfoot>
                                <tr style="background-color: #f8fafc; border-top: 2px solid #e2e8f0;">
                                  <td colspan="2" style="padding: 12px 16px; text-align: right; font-weight: 700; color: #0f172a; font-size: 14px;">Total Paid:</td>
                                  <td style="padding: 12px 16px; text-align: right; font-weight: 800; color: #16a34a; font-size: 17px;">৳${orderTotal.toLocaleString()}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </td>
                        </tr>

                        <!-- Customer Details -->
                        ${(customerPhone || customerAddress) ? `
                        <tr>
                          <td style="padding: 10px 30px 15px;">
                            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Customer Info</div>
                            <div style="font-size: 13px; color: #374151; line-height: 1.5;">
                              ${customerPhone ? `<div><strong>Phone:</strong> ${customerPhone}</div>` : ''}
                              ${customerAddress ? `<div><strong>Address:</strong> ${customerAddress}</div>` : ''}
                            </div>
                          </td>
                        </tr>
                        ` : ''}

                        <!-- Next Steps Info -->
                        <tr>
                          <td style="padding: 10px 30px 25px;">
                            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 18px; border-radius: 0 8px 8px 0;">
                              <div style="font-weight: 700; color: #1e40af; font-size: 13px;">What Happens Next?</div>
                              <p style="margin: 4px 0 0; font-size: 13px; color: #1e3a8a; line-height: 1.5;">
                                Your order is currently being processed. Once setup is complete, you will receive an activation email with full service details.
                              </p>
                            </div>
                          </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                          <td style="background-color: #f8fafc; border-top: 1px solid #e5e7eb; padding: 24px 30px; text-align: center;">
                            <p style="margin: 0; font-size: 13px; font-weight: 700; color: #0f172a;">Click2IT BD</p>
                            <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">
                              Email: <a href="mailto:info@click2itbd.com" style="color: #2563eb; text-decoration: none;">info@click2itbd.com</a> | Web: <a href="https://click2itbd.com" style="color: #2563eb; text-decoration: none;">click2itbd.com</a>
                            </p>
                            <p style="margin: 8px 0 0; font-size: 11px; color: #94a3b8;">
                              © 2026 Click2IT BD. All rights reserved.
                            </p>
                          </td>
                        </tr>

                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
            `,
            orderId,
            customerEmail: orderData.customerEmail,
            category: 'payment',
          });
          emailSent = emailResult.success;
        } catch (mailErr) {
          console.warn('[Orders] Email notification error:', mailErr);
        }
      }

      let fulfillmentError: string | null = null;
      let fulfillmentResult;
      try {
        fulfillmentResult = await fulfillOrder(orderId, adminUid);
        console.log(`[Orders] Fulfillment started for order ${orderId}:`, fulfillmentResult);
      } catch (err: any) {
        fulfillmentError = err.message || 'Unknown fulfillment error';
        console.error(`[Orders] Fulfillment notice for order ${orderId}:`, err);
      }

      return res.json({
        success: true,
        message: fulfillmentResult?.status === 'pending'
          ? 'Payment verified. The registrar accepted the request, but registration is not active yet.'
          : 'Payment verified successfully. Order is now processing.',
        emailSent,
        fulfillmentResult,
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
    const userId = req.user?.uid;
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

    const adminCheck = await isUserAdmin(userId).catch(() => false);
    if (orderData.userId !== userId && !adminCheck) {
      return res.status(403).json({ success: false, error: 'Not authorized to query this order' });
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
    const userId = req.user?.uid;
    const { orderId } = req.params;
    const { paymentId, merchantTransactionId } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
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

    // Security: Verify order ownership
    const adminCheck = await isUserAdmin(userId).catch(() => false);
    if (orderData.userId !== userId && !adminCheck) {
      return res.status(403).json({ success: false, error: 'You are not authorized to verify payment for this order' });
    }

    if (orderData.paymentStatus === 'verified') {
      return res.json({ success: true, message: 'Payment already verified' });
    }

    // Security: Require server-side EPS gateway verification; never trust client paymentId blindly
    const mtx = String(merchantTransactionId || paymentId || orderData.epsMerchantTransactionId || '').trim();
    if (!mtx) {
      return res.status(400).json({
        success: false,
        error: 'Server-side EPS merchantTransactionId is required for payment verification.',
      });
    }

    const verifyRes = await epsVerifyTransaction(mtx);
    if (!verifyRes.verified) {
      return res.status(400).json({
        success: false,
        error: `Gateway payment verification failed (Status: ${verifyRes.status || 'Unverified'}).`,
      });
    }

    if (verifyRes.customerOrderId && verifyRes.customerOrderId !== orderId) {
      return res.status(400).json({
        success: false,
        error: 'Transaction does not belong to this order.',
      });
    }

    const expectedAmount = Number(
      orderData.epsPayableAmount ||
        (orderData.paymentMethod === 'cod_advance_paid' && Number(orderData.advancePaidAmount) > 0
          ? orderData.advancePaidAmount
          : orderData.total) ||
        0
    );

    if (verifyRes.totalAmount > 0 && expectedAmount > 0 && Math.abs(verifyRes.totalAmount - expectedAmount) > 1) {
      return res.status(400).json({
        success: false,
        error: 'Verified gateway amount does not match the order total.',
      });
    }

    const now = new Date().toISOString();
    await orderRef.update({
      paymentStatus: 'verified',
      paymentVerificationStatus: 'verified',
      paymentMethod: orderData.paymentMethod === 'cod_advance_paid' ? 'cod_advance_paid' : 'eps',
      transactionId: verifyRes.epsTransactionId || mtx,
      epsMerchantTransactionId: mtx,
      paidAt: now,
      updatedAt: now,
    });

    try {
      await fulfillOrder(orderId, 'eps-gateway');
    } catch (fErr) {
      console.warn('[Execute Payment] Auto-fulfillment warning:', fErr);
    }

    return res.json({
      success: true,
      message: 'Payment verified with EPS Gateway and executed successfully',
      transactionId: verifyRes.epsTransactionId || mtx,
    });
  } catch (error: any) {
    console.error('Payment execution error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Payment execution failed' });
  }
});

// Admin: Complete an order and activate its linked domain / hosting accounts
ordersRouter.post('/admin/:orderId/complete', requireFirebaseAuth, async (req: any, res: Response) => {
  const adminUid = req.user?.uid || req.user?.user_id || req.user?.sub || 'admin';
  const adminCheck = await isUserAdmin(adminUid).catch(() => false);
  if (!adminCheck) {
    return res.status(403).json({ error: 'Admin access required.' });
  }

  try {
    const { orderId } = req.params;
    const db = getAdminDb();
    const now = new Date().toISOString();

    const orderRef = db.collection('orders').doc(orderId);
    await orderRef.update({
      status: 'completed',
      providerStatus: 'completed',
      updatedAt: now,
    });

    // Update hostingAccounts linked to this order
    const hSnap = await db.collection('hostingAccounts').where('orderId', '==', orderId).get();
    for (const docSnap of hSnap.docs) {
      await docSnap.ref.update({
        status: 'active',
        provisioningStatus: 'completed',
        updatedAt: now,
      });
    }

    // Update domainOrders linked to this order
    const dSnap = await db.collection('domainOrders').where('orderId', '==', orderId).get();
    for (const docSnap of dSnap.docs) {
      await docSnap.ref.update({
        status: 'active',
        updatedAt: now,
      });
    }

    return res.json({ success: true, message: 'Order marked as completed.' });
  } catch (error: any) {
    console.error('Admin mark complete error:', error);
    return res.status(500).json({ error: error.message || 'Failed to complete order.' });
  }
});

// Admin: Update status of a specific domainOrder or hostingAccount
ordersRouter.post('/admin/service-status', requireFirebaseAuth, async (req: any, res: Response) => {
  const adminUid = req.user?.uid || req.user?.user_id || req.user?.sub || 'admin';
  const adminCheck = await isUserAdmin(adminUid).catch(() => false);
  if (!adminCheck) {
    return res.status(403).json({ error: 'Admin access required.' });
  }

  try {
    const { collectionName, documentId, newStatus, updates } = req.body;
    if (!['domainOrders', 'hostingAccounts'].includes(collectionName) || !documentId || !newStatus) {
      return res.status(400).json({ error: 'Invalid parameters.' });
    }

    const db = getAdminDb();
    const docRef = db.collection(collectionName).doc(documentId);
    await docRef.update({
      status: newStatus,
      updatedAt: new Date().toISOString(),
      ...(updates || {}),
    });

    return res.json({ success: true, message: `${collectionName} updated successfully.` });
  } catch (error: any) {
    console.error('Admin update service status error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update service status.' });
  }
});

export default ordersRouter;
