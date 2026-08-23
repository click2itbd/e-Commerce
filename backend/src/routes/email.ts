import { Router, Response } from 'express';
import { sendEmail } from '../services/email';
import { requireFirebaseAuth } from '../middleware/firebaseAuth';

const emailRouter = Router();

emailRouter.post('/send-email', requireFirebaseAuth, async (req: any, res: Response) => {
  try {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
    }

    const result = await sendEmail({ to, subject, html });

    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Failed to send email' });
    }

    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error: any) {
    console.error('Email send error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

emailRouter.post('/send-welcome-email', requireFirebaseAuth, async (req: any, res: Response) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const subject = 'Welcome to Click2IT!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Click2IT!</h2>
        <p>Dear ${name || 'Customer'},</p>
        <p>Thank you for signing up with Click2IT. We're excited to have you on board!</p>
        <p>You can now:</p>
        <ul>
          <li>Search and register domains</li>
          <li>Purchase hosting plans</li>
          <li>Manage your services from your dashboard</li>
          <li>Access 24/7 support</li>
        </ul>
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Best regards,<br>Click2IT Team</p>
      </div>
    `;

    const result = await sendEmail({ to: email, subject, html });
    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Failed to send welcome email' });
    }

    res.status(200).json({ success: true, message: 'Welcome email sent' });
  } catch (error: any) {
    console.error('Welcome email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
emailRouter.post('/notify-admin-new-order', requireFirebaseAuth, async (req: any, res: Response) => {
  try {
    const { orderId, orderData } = req.body;
    
    if (!orderId || !orderData) {
      return res.status(400).json({ error: 'Missing orderId or orderData' });
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_FROM_EMAIL || 'info@click2itbd.com';
    const customerName = orderData.customerName || 'A customer';
    const totalAmount = orderData.total || 0;
    
    const subject = `New Order Received - #${orderId.slice(0, 8)}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Order Received!</h2>
        <p>A new order has been placed on Click2IT.</p>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Customer:</strong> ${customerName} (${orderData.customerEmail || 'No email'})</p>
        <p><strong>Phone:</strong> ${orderData.customerPhone || 'N/A'}</p>
        <p><strong>Total Amount:</strong> ৳${totalAmount}</p>
        <p><strong>Payment Method:</strong> ${orderData.paymentMethod || 'N/A'}</p>
        <br/>
        <p>Please log in to the admin dashboard to review this order.</p>
      </div>
    `;

    const result = await sendEmail({ 
      to: adminEmail, 
      subject, 
      html,
      orderId,
      category: 'system'
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Failed to send admin notification' });
    }

    res.status(200).json({ success: true, message: 'Admin notification sent' });
  } catch (error: any) {
    console.error('Admin notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default emailRouter;

