const fs = require('fs');
const filePath = 'src/pages/admin/tabs/others/EmailTemplatesManager.tsx';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

const newContent = `const DEFAULT_TEMPLATES: Record<string, EmailTemplateData> = {
  welcome_account: {
    id: 'welcome_account',
    name: 'General: Account Welcome',
    category: 'system',
    subject: 'Welcome to Click2IT BD - {{customerName}}',
    heading: 'Welcome to Click2IT BD!',
    badgeText: '✓ Account Created',
    bodyHtml: \`<p>Dear <strong>{{customerName}}</strong>,</p>
<p>Thank you for signing up with Click2IT BD! We are absolutely thrilled to have you on board.</p>
<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
  <p style="margin:4px 0;">With your new account, you can now:</p>
  <ul style="margin:8px 0; padding-left:20px;">
    <li>Register and manage domain names</li>
    <li>Deploy lightning-fast cloud hosting</li>
    <li>Purchase authentic PC components</li>
    <li>Build custom PCs with expert support</li>
  </ul>
</div>
<p>If you ever have any questions, our support team is available 24/7. Just reply to this email or open a support ticket from your dashboard.</p>
<p>Welcome to the Click2IT family!</p>\`,
    footerNote: 'Need help getting started? Check out our knowledge base.',
  },
  welcome_hosting: {
    id: 'welcome_hosting',
    name: 'Hosting: Account Activation',
    category: 'hosting',
    subject: '🎉 Your Hosting Account is Ready - {{domain}}',
    heading: 'Welcome to Click2IT Cloud Hosting!',
    badgeText: '✓ Hosting Account Active',
    bodyHtml: \`<p>Dear <strong>{{customerName}}</strong>,</p>
<p>Congratulations! Your cPanel cloud hosting account for <strong>{{domain}}</strong> is now active and ready for your website.</p>
<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 18px 0;">
  <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 10px; text-transform: uppercase;">cPanel Login Details</div>
  <div style="font-size: 14px; margin-bottom: 6px;"><strong>Domain:</strong> {{domain}}</div>
  <div style="font-size: 14px; margin-bottom: 6px;"><strong>cPanel Username:</strong> <code style="background:#e2e8f0; padding:2px 6px; border-radius:4px;">{{username}}</code></div>
  <div style="font-size: 14px; margin-bottom: 6px;"><strong>Control Panel:</strong> <a href="{{cPanelUrl}}" style="color: #2563eb; font-weight: 600;">{{cPanelUrl}}</a></div>
  <div style="font-size: 14px; margin-top: 10px;"><strong>Nameservers:</strong><br>• ns1.click2itbd.com<br>• ns2.click2itbd.com</div>
</div>
<p>You can also log in to your account directly from your client portal at <a href="https://click2itbd.com" style="color: #2563eb;">click2itbd.com</a> anytime.</p>\`,
    footerNote: 'Need help moving your site? Contact our 24/7 technical support team.',
  },
  domain_registered: {
    id: 'domain_registered',
    name: 'Domain: Registration Confirmation',
    category: 'domain',
    subject: '🌐 Domain Registered Successfully - {{domain}}',
    heading: 'Your Domain is Registered!',
    badgeText: '✓ Domain Active',
    bodyHtml: \`<p>Dear <strong>{{customerName}}</strong>,</p>
<p>Great news! Your domain <strong>{{domain}}</strong> has been successfully registered and is now yours.</p>
<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 16px 0;">
  <div style="margin-bottom:6px;"><strong>Domain:</strong> {{domain}}</div>
  <div style="margin-bottom:6px;"><strong>Expiry Date:</strong> {{expiryDate}}</div>
  <div><strong>Status:</strong> Active</div>
</div>
<p>You can manage your DNS, nameservers, and renewals from your Click2IT dashboard.</p>\`,
    footerNote: 'Keep your domain secure and renew on time to prevent service disruption.',
  },
  domain_renewed: {
    id: 'domain_renewed',
    name: 'Domain: Renewal Success',
    category: 'domain',
    subject: '✅ Domain Renewed Successfully - {{domain}}',
    heading: 'Domain Renewal Confirmed',
    badgeText: '✓ Domain Renewed',
    bodyHtml: \`<p>Dear <strong>{{customerName}}</strong>,</p>
<p>Your domain <strong>{{domain}}</strong> has been successfully renewed! Thank you for continuing to trust Click2IT BD.</p>
<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 16px 0;">
  <div style="margin-bottom:6px;"><strong>Domain:</strong> {{domain}}</div>
  <div style="margin-bottom:6px;"><strong>New Expiry Date:</strong> {{expiryDate}}</div>
  <div><strong>Amount Paid:</strong> ৳ {{total}}</div>
</div>
<p>Your online presence remains secure and uninterrupted.</p>\`,
    footerNote: 'Keep your domain secure and renew on time to prevent service disruption.',
  },
  payment_verified: {
    id: 'payment_verified',
    name: 'E-commerce: Payment Verification',
    category: 'payment',
    subject: 'Payment Confirmed & Receipt - #{{orderId}}',
    heading: 'Payment Successfully Verified',
    badgeText: '✓ Payment Verified & Paid',
    bodyHtml: \`<p>Dear <strong>{{customerName}}</strong>,</p>
<p>We are writing to officially confirm that your recent payment for order <strong>#{{orderId}}</strong> has been securely processed and verified.</p>
<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 16px 0;">
  <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span>Order Reference:</span> <strong>#{{orderId}}</strong></div>
  <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span>Amount Paid:</span> <strong style="color:#16a34a;">৳ {{total}}</strong></div>
  <div style="display:flex; justify-content:space-between;"><span>Payment Method:</span> <strong>{{paymentMethod}}</strong></div>
</div>
<p>Your order is now fully confirmed and is moving to the next stage of fulfillment. If applicable, you will find a detailed invoice attached to this email.</p>
<p>We deeply appreciate your business!</p>\`,
    footerNote: 'Thank you for choosing Click2IT BD.',
  },
  payment_rejected: {
    id: 'payment_rejected',
    name: 'E-commerce: Payment Rejected',
    category: 'payment',
    subject: 'Action Required: Payment Failed - #{{orderId}}',
    heading: 'Payment Verification Failed',
    badgeText: '❌ Payment Failed',
    bodyHtml: \`<p>Dear <strong>{{customerName}}</strong>,</p>
<p>Unfortunately, we were unable to verify the payment for your order <strong>#{{orderId}}</strong>.</p>
<div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 16px; margin: 16px 0;">
  <p style="margin:0; color:#b91c1c;"><strong>Reason:</strong> Invalid transaction ID, insufficient amount, or gateway error.</p>
</div>
<p>Please log in to your dashboard to review your order and try submitting the payment again. If you believe this is an error, please reply to this email or contact our support team with your proof of payment.</p>\`,
    footerNote: 'Contact support if you need assistance with your payment.',
  },
  order_confirmation: {
    id: 'order_confirmation',
    name: 'E-commerce: Order Confirmation',
    category: 'order',
    subject: 'Order Confirmed - #{{orderId}}',
    heading: 'Thank you for your order!',
    badgeText: '✓ Order Received',
    bodyHtml: \`<p>Dear <strong>{{customerName}}</strong>,</p>
<p>Thank you for choosing Click2ItBD! We are thrilled to confirm that we have received your order <strong>#{{orderId}}</strong> and our team is already working on processing it.</p>
<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
  <h3 style="margin-top:0; color:#1e3a8a; font-size: 15px;">Order Details Summary</h3>
  <div style="margin-bottom:6px;"><strong>Order ID:</strong> #{{orderId}}</div>
  <div><strong>Status:</strong> Processing</div>
</div>
<p>We will send you another update as soon as your order has been shipped or your service is activated. You can track your order status anytime from your client dashboard.</p>
<p>If you need to make any changes to this order, please contact our support team immediately.</p>\`,
    footerNote: 'Thank you for shopping with Click2ItBD.',
  },
  order_status_update: {
    id: 'order_status_update',
    name: 'E-commerce: Order Status Update',
    category: 'order',
    subject: 'Order Status Update: {{status}} - #{{orderId}}',
    heading: 'Your Order Status Has Changed',
    badgeText: '✓ Status Updated',
    bodyHtml: \`<p>Dear <strong>{{customerName}}</strong>,</p>
<p>We are reaching out to let you know that the status of your order <strong>#{{orderId}}</strong> has been updated by our team.</p>
<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
  <p style="margin:0;">Current Status: <span style="display: inline-block; padding: 4px 10px; background: #e0e7ff; color: #3730a3; border-radius: 4px; font-weight: bold; margin-left: 8px;">{{status}}</span></p>
</div>
<p>Please log in to your client dashboard for detailed tracking information and next steps.</p>\`,
    footerNote: 'Thank you for shopping with Click2ItBD.',
  },
  pc_build_summary: {
    id: 'pc_build_summary',
    name: 'PC Builder: Build Summary',
    category: 'order',
    subject: 'Your Custom PC Build Summary',
    heading: 'Your Custom PC Build',
    badgeText: '✓ Quote Ready',
    bodyHtml: \`<p>Dear <strong>{{customerName}}</strong>,</p>
<p>Thank you for using the Click2ItBD PC Builder! Your custom build summary is attached to this email as an official quotation.</p>
<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
  <p style="margin:0; font-size: 16px;"><strong>Estimated Total:</strong> <span style="color:#16a34a;">৳ {{total}}</span></p>
</div>
<p>Our expert technicians are ready to assemble this machine for you with premium cable management and rigorous stress testing.</p>
<p>If you're ready to place your order or need expert advice on part compatibility, simply reply to this email or call our hotline.</p>\`,
    footerNote: 'Thank you for choosing Click2ItBD for your custom rig.',
  },
  support_ticket_created: {
    id: 'support_ticket_created',
    name: 'Support: Ticket Received',
    category: 'support',
    subject: 'Support Ticket Received - [#{{ticketId}}]',
    heading: 'We have received your request',
    badgeText: '✓ Ticket Open',
    bodyHtml: \`<p>Dear <strong>{{customerName}}</strong>,</p>
<p>This is an automated response to confirm that we have received your support request.</p>
<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
  <div style="margin-bottom:6px;"><strong>Ticket ID:</strong> #{{ticketId}}</div>
  <div><strong>Subject:</strong> {{ticketSubject}}</div>
</div>
<p>Our technical support team will review your issue and respond as soon as possible. Standard response times are between 1-4 hours.</p>
<p>You can view and reply to this ticket directly from your client portal.</p>\`,
    footerNote: 'We are committed to resolving your issue quickly.',
  },
  admin_new_order: {
    id: 'admin_new_order',
    name: 'Admin Alert: New Order Received',
    category: 'order',
    subject: 'New Order Received - #{{orderId}}',
    heading: 'New Order Received',
    badgeText: '✓ New Order',
    bodyHtml: \`<p>A new order has just been placed on Click2ItBD!</p>
<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
  <div style="margin-bottom:6px;"><strong>Order ID:</strong> {{orderId}}</div>
  <div style="margin-bottom:6px;"><strong>Customer:</strong> {{customerName}}</div>
  <div style="margin-bottom:6px;"><strong>Total Amount:</strong> ৳ {{total}}</div>
  <div><strong>Payment Method:</strong> {{paymentMethod}}</div>
</div>
<p>Please log in to the admin panel to review the order, verify the payment, and begin fulfillment.</p>\`,
    footerNote: 'Action required in the admin dashboard.',
  },
  low_stock_warning: {
    id: 'low_stock_warning',
    name: 'Admin Alert: Low Stock Warning',
    category: 'order',
    subject: '[ALERT] Low Stock Warning - {{productName}}',
    heading: 'Low Stock Alert',
    badgeText: '⚠️ Low Stock',
    bodyHtml: \`<p><strong>Attention Admin,</strong></p>
<p>The following product has dropped to critical stock levels:</p>
<div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 16px; margin: 16px 0;">
  <div style="margin-bottom:6px; color:#b91c1c;"><strong>Product:</strong> {{productName}}</div>
  <div style="color:#b91c1c;"><strong>Current Stock:</strong> {{currentStock}} units remaining</div>
</div>
<p>Action is required to ensure uninterrupted sales. Please contact vendors to restock this product and update the inventory in the system.</p>\`,
    footerNote: 'Immediate action recommended.',
  },
};

const TEMPLATE_VARIABLES = [
  { tag: '{{customerName}}', desc: 'Customer Full Name' },
  { tag: '{{domain}}', desc: 'Domain Name (e.g. example.com)' },
  { tag: '{{expiryDate}}', desc: 'Domain/Hosting Expiry Date' },
  { tag: '{{cPanelUrl}}', desc: 'cPanel Login Link (:2083)' },
  { tag: '{{username}}', desc: 'cPanel Account Username' },
  { tag: '{{invoiceNumber}}', desc: 'Invoice Number (e.g. INV-00047)' },
  { tag: '{{orderId}}', desc: 'Order ID' },
  { tag: '{{status}}', desc: 'Order Status (e.g. Shipped)' },
  { tag: '{{total}}', desc: 'Total Amount (BDT)' },
  { tag: '{{transactionId}}', desc: 'Payment Transaction ID' },
  { tag: '{{paymentMethod}}', desc: 'Payment Method' },
  { tag: '{{productName}}', desc: 'Product Name' },
  { tag: '{{currentStock}}', desc: 'Current Stock Amount' },
  { tag: '{{ticketId}}', desc: 'Support Ticket ID' },
  { tag: '{{ticketSubject}}', desc: 'Support Ticket Subject' },
];`;

const startIndex = lines.findIndex(line => line.includes('const DEFAULT_TEMPLATES'));
const endIndex = lines.findIndex(line => line.includes('export const EmailTemplatesManager'));

if (startIndex !== -1 && endIndex !== -1) {
  lines.splice(startIndex, endIndex - startIndex, newContent);
  fs.writeFileSync(filePath, lines.join('\n'));
  console.log('Successfully updated the templates and variables!');
} else {
  console.log('Could not find the start or end index.');
}
