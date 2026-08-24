import { getAdminDb } from '../firebase/admin';
import { SmtpEmailProvider, SmtpConfig } from '../providers/email/SmtpEmailProvider';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  orderId?: string;
  customerEmail?: string;
  category?: 'order' | 'provisioning' | 'payment' | 'domain' | 'hosting' | 'system';
  type?: string;
}

export interface EmailLog {
  orderId?: string;
  recipient: string;
  type: string;
  status: 'sent' | 'failed' | 'queued';
  subject: string;
  error?: string;
  timestamp: string;
  createdAt: string;
}

let smtpProvider: SmtpEmailProvider | null = null;

export function getSmtpProvider(): SmtpEmailProvider {
  if (!smtpProvider) {
    const config: SmtpConfig = {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      password: process.env.SMTP_PASSWORD || '',
      fromName: process.env.SMTP_FROM_NAME || 'Click2IT',
      fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@click2itbd.com',
    };
    smtpProvider = new SmtpEmailProvider(config);
  }
  return smtpProvider;
}

export async function logEmailToFirestore(options: EmailOptions, status: 'sent' | 'failed', error?: string): Promise<void> {
  try {
    const db = getAdminDb();
    await db.collection('emailLogs').add({
      orderId: options.orderId || null,
      recipient: options.customerEmail || options.to,
      type: options.type || options.category || 'system',
      status,
      subject: options.subject,
      error: error || null,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  } catch (logError) {
    console.error('Failed to log email to Firestore:', logError);
  }
}

export async function isEmailDuplicate(options: EmailOptions): Promise<boolean> {
  try {
    const db = getAdminDb();
    const type = options.type || options.category || 'system';
    const recentWindow = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const snapshot = await db.collection('emailLogs')
      .where('recipient', '==', options.customerEmail || options.to)
      .where('type', '==', type)
      .where('subject', '==', options.subject)
      .where('timestamp', '>=', recentWindow)
      .limit(1)
      .get();

    return !snapshot.empty;
  } catch (error) {
    console.error('Failed to check email duplicate:', error);
    return false;
  }
}

export async function sendEmail(options: EmailOptions, retries: number = 2): Promise<{ success: boolean; error?: string }> {
  const { to, subject, html } = options;

  if (await isEmailDuplicate(options)) {
    console.log(`Duplicate email prevented: ${subject} to ${to}`);
    return { success: true };
  }

  const provider = getSmtpProvider();

  let lastError: string | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }

    const result = await provider.sendEmail(to, subject, html);

    if (result.success) {
      await logEmailToFirestore(options, 'sent');
      return { success: true };
    }

    lastError = result.error;

    if (result.code === 'SMTP_CONFIG_MISSING' || result.code === 'SMTP_AUTH_FAILED' || result.code === 'SMTP_RECIPIENT_REJECTED') {
      break;
    }
  }

  await logEmailToFirestore(options, 'failed', lastError);
  return { success: false, error: lastError };
}

export async function verifySmtpConnection(): Promise<{ success: boolean; code: string; message: string }> {
  const provider = getSmtpProvider();
  return provider.verifyConnection();
}

export const EmailTemplates = {
  orderReceived: (orderId: string, customerName: string, total: number, paymentMethod: string) => ({
    subject: `Order Received - #${orderId.slice(0, 8)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb;">Order Received!</h2>
        <p>Dear ${customerName},</p>
        <p>We have received your order <strong>#${orderId.slice(0, 8)}</strong>.</p>
        <p><strong>Total:</strong> ৳${total}</p>
        <p><strong>Payment Method:</strong> ${paymentMethod}</p>
        <p>Your order is pending payment verification. We will notify you once it is confirmed.</p>
        <p>Thank you for choosing Click2IT!</p>
      </div>
    `,
  }),

  paymentSubmitted: (orderId: string, customerName: string, transactionId: string, total: number) => ({
    subject: `Payment Submitted - #${orderId.slice(0, 8)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #f59e0b;">Payment Submitted</h2>
        <p>Dear ${customerName},</p>
        <p>We have received your payment for order <strong>#${orderId.slice(0, 8)}</strong>.</p>
        <p><strong>Transaction ID:</strong> ${transactionId}</p>
        <p><strong>Amount:</strong> ৳${total}</p>
        <p>Your payment is pending verification. We will notify you once it is confirmed.</p>
        <p>Thank you,<br>Click2IT Team</p>
      </div>
    `,
  }),

  paymentVerified: (orderId: string, customerName: string, total: number, transactionId: string) => ({
    subject: `Payment Confirmed - #${orderId.slice(0, 8)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #16a34a;">Payment Confirmed!</h2>
        <p>Dear ${customerName},</p>
        <p>Your payment for order <strong>#${orderId.slice(0, 8)}</strong> has been verified.</p>
        <p><strong>Amount:</strong> ৳${total}</p>
        <p><strong>Transaction ID:</strong> ${transactionId}</p>
        <p>Your order is now being processed. We will notify you once it is completed.</p>
        <p>Thank you for choosing Click2IT!</p>
      </div>
    `,
  }),

  paymentRejected: (orderId: string, customerName: string, reason: string) => ({
    subject: `Payment Rejected - #${orderId.slice(0, 8)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #dc2626;">Payment Rejected</h2>
        <p>Dear ${customerName},</p>
        <p>Your payment for order <strong>#${orderId.slice(0, 8)}</strong> could not be verified.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Please contact support or try again with a valid transaction.</p>
        <p>Thank you,<br>Click2IT Team</p>
      </div>
    `,
  }),

  orderProcessing: (orderId: string, customerName: string) => ({
    subject: `Order Processing - #${orderId.slice(0, 8)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb;">Order Processing</h2>
        <p>Dear ${customerName},</p>
        <p>Your order <strong>#${orderId.slice(0, 8)}</strong> is now being processed.</p>
        <p>We will notify you once it is completed.</p>
        <p>Thank you for choosing Click2IT!</p>
      </div>
    `,
  }),

  domainRegistered: (domain: string, expiryDate: string) => ({
    subject: `Domain Registered - ${domain}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #16a34a;">Domain Registered Successfully!</h2>
        <p>Your domain <strong>${domain}</strong> has been successfully registered.</p>
        <p><strong>Expiry Date:</strong> ${expiryDate}</p>
        <p>You can now use this domain for your website and email.</p>
        <p>Thank you for choosing Click2IT!</p>
      </div>
    `,
  }),

  domainRegistrationFailed: (domain: string, reason: string) => ({
    subject: `Domain Registration Failed - ${domain}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #dc2626;">Domain Registration Failed</h2>
        <p>We were unable to register your domain <strong>${domain}</strong>.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Please contact support for assistance.</p>
        <p>Thank you,<br>Click2IT Team</p>
      </div>
    `,
  }),

  domainRenewed: (domain: string, expiryDate: string, amount: number) => ({
    subject: `Domain Renewed - ${domain}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #16a34a;">Domain Renewed Successfully!</h2>
        <p>Your domain <strong>${domain}</strong> has been successfully renewed.</p>
        <p><strong>New Expiry Date:</strong> ${expiryDate}</p>
        <p><strong>Amount Paid:</strong> ৳${amount}</p>
        <p>Thank you for choosing Click2IT!</p>
      </div>
    `,
  }),

  domainRenewalFailed: (domain: string, reason: string) => ({
    subject: `Domain Renewal Failed - ${domain}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #dc2626;">Domain Renewal Failed</h2>
        <p>We were unable to renew your domain <strong>${domain}</strong>.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Please contact support immediately to avoid domain expiration.</p>
        <p>Thank you,<br>Click2IT Team</p>
      </div>
    `,
  }),

  domainTransferSuccess: (domain: string) => ({
    subject: `Domain Transfer Successful - ${domain}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #16a34a;">Domain Transfer Successful!</h2>
        <p>Your domain <strong>${domain}</strong> has been successfully transferred to Click2IT.</p>
        <p>The transfer process typically takes 5-7 days to complete. You will receive another notification once the transfer is fully complete.</p>
        <p>Thank you for choosing Click2IT!</p>
      </div>
    `,
  }),

  domainTransferFailed: (domain: string, reason: string) => ({
    subject: `Domain Transfer Failed - ${domain}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #dc2626;">Domain Transfer Failed</h2>
        <p>We were unable to transfer your domain <strong>${domain}</strong>.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Please contact support for assistance.</p>
        <p>Thank you,<br>Click2IT Team</p>
      </div>
    `,
  }),

  hostingActivated: (domain: string, controlPanelUrl: string, username: string) => ({
    subject: `Your Hosting is Ready - ${domain}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb;">Your Hosting is Ready!</h2>
        <p>Great news! Your hosting account for <strong>${domain}</strong> has been activated.</p>
        <h3>Account Details:</h3>
        <ul>
          <li><strong>Domain:</strong> ${domain}</li>
          <li><strong>cPanel URL:</strong> <a href="${controlPanelUrl}">${controlPanelUrl}</a></li>
          <li><strong>Username:</strong> ${username}</li>
        </ul>
        <p>For security reasons, your password has been sent to you separately. Please check your email or contact support if you need assistance accessing your account.</p>
        <p>You can now log in to your cPanel and start building your website.</p>
        <p>Thank you for choosing Click2IT!</p>
      </div>
    `,
  }),

  hostingProvisioningFailed: (domain: string, reason: string) => ({
    subject: `Hosting Provisioning Failed - ${domain}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #dc2626;">Hosting Provisioning Failed</h2>
        <p>We were unable to provision hosting for <strong>${domain}</strong>.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Our team has been notified and will contact you shortly.</p>
        <p>Thank you for your patience,<br>Click2IT Team</p>
      </div>
    `,
  }),

  hostingSuspended: (domain: string, reason: string) => ({
    subject: `Hosting Suspended - ${domain}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #f59e0b;">Hosting Suspended</h2>
        <p>Your hosting account for <strong>${domain}</strong> has been suspended.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Please contact support for more information or to resolve this issue.</p>
        <p>Thank you,<br>Click2IT Team</p>
      </div>
    `,
  }),

  hostingTerminated: (domain: string) => ({
    subject: `Hosting Terminated - ${domain}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #dc2626;">Hosting Terminated</h2>
        <p>Your hosting account for <strong>${domain}</strong> has been terminated.</p>
        <p>If you have any questions, please contact our support team.</p>
        <p>Thank you,<br>Click2IT Team</p>
      </div>
    `,
  }),

  orderCompleted: (orderId: string, customerName: string) => ({
    subject: `Order Completed - #${orderId.slice(0, 8)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #16a34a;">Order Completed!</h2>
        <p>Dear ${customerName},</p>
        <p>Your order <strong>#${orderId.slice(0, 8)}</strong> has been completed successfully.</p>
        <p>Thank you for choosing Click2IT!</p>
      </div>
    `,
  }),

  orderFailed: (orderId: string, customerName: string, reason: string) => ({
    subject: `Order Failed - #${orderId.slice(0, 8)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #dc2626;">Order Failed</h2>
        <p>Dear ${customerName},</p>
        <p>Your order <strong>#${orderId.slice(0, 8)}</strong> could not be completed.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Please contact support for assistance.</p>
        <p>Thank you,<br>Click2IT Team</p>
      </div>
    `,
  }),

  welcome: (customerName: string, email: string) => ({
    subject: 'Welcome to Click2IT!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb;">Welcome to Click2IT!</h2>
        <p>Dear ${customerName},</p>
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
    `,
  }),
};
