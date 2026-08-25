import { getAdminDb, getAdminDocument, isUserAdmin } from '../firebase/admin.js';
import { sendEmail } from './email.js';
import { getDomainProvider, getHostingProvider } from '../providers/providerFactory.js';
import { getDomainPricingSettings } from './domainPricing.js';
import { ProviderError } from '../providers/domain/DynadotDomainProvider.js';
import { classifyHostingError } from './hosting.js';
import { config } from '../config/index.js';

export interface FulfillmentResult {
  success: boolean;
  orderId: string;
  status: 'completed' | 'failed' | 'manual_review';
  domainResults: FulfillmentItemResult[];
  hostingResults: FulfillmentItemResult[];
  error?: string;
}

export interface FulfillmentItemResult {
  itemId: string;
  type: 'domain' | 'hosting';
  action: 'register' | 'renew' | 'transfer' | 'provision';
  success: boolean;
  status: string;
  error?: string;
  errorCode?: string;
  providerResult?: any;
}

export async function fulfillOrder(orderId: string, actorUid: string): Promise<FulfillmentResult> {
  const db = getAdminDb();
  const now = new Date().toISOString();

  const orderRef = db.collection('orders').doc(orderId);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    return { success: false, orderId, status: 'failed', domainResults: [], hostingResults: [], error: 'Order not found' };
  }

  const orderData = orderSnap.data();
  if (!orderData) {
    return { success: false, orderId, status: 'failed', domainResults: [], hostingResults: [], error: 'Order not found' };
  }

  if (orderData.paymentStatus !== 'verified') {
    return { success: false, orderId, status: 'failed', domainResults: [], hostingResults: [], error: 'Order payment is not verified' };
  }

  if (orderData.status === 'completed') {
    return { success: true, orderId, status: 'completed', domainResults: [], hostingResults: [], error: 'Order already completed' };
  }

  if (orderData.status === 'processing') {
    return { success: false, orderId, status: 'failed', domainResults: [], hostingResults: [], error: 'Order is already being processed' };
  }

  await orderRef.update({
    status: 'processing',
    providerStatus: 'processing',
    updatedAt: now,
  });

  await writeAuditLog(db, orderId, 'fulfillment_started', actorUid, orderData.status, 'processing', null, null);

  const domainResults: FulfillmentItemResult[] = [];
  const hostingResults: FulfillmentItemResult[] = [];

  const domainOrdersSnap = await db.collection('domainOrders')
    .where('orderId', '==', orderId)
    .get();

  const hostingAccountsSnap = await db.collection('hostingAccounts')
    .where('orderId', '==', orderId)
    .get();

  let hasFailure = false;
  let hasManualReview = false;

  for (const docSnap of domainOrdersSnap.docs) {
    const domainData = docSnap.data();
    const result = await fulfillDomainOrder(docSnap.id, domainData, actorUid);
    domainResults.push(result);
    if (!result.success) {
      hasFailure = true;
      if (result.status === 'manual_review') {
        hasManualReview = true;
      }
    }
  }

  for (const docSnap of hostingAccountsSnap.docs) {
    const hostingData = docSnap.data();
    const result = await fulfillHostingAccount(docSnap.id, hostingData, actorUid);
    hostingResults.push(result);
    if (!result.success) {
      hasFailure = true;
      if (result.status === 'manual_review') {
        hasManualReview = true;
      }
    }
  }

  let finalStatus: 'completed' | 'failed' | 'manual_review';
  if (hasManualReview) {
    finalStatus = 'manual_review';
  } else if (hasFailure) {
    finalStatus = 'failed';
  } else {
    finalStatus = 'completed';
  }

  await orderRef.update({
    status: finalStatus,
    providerStatus: finalStatus,
    updatedAt: now,
  });

  await writeAuditLog(db, orderId, 'fulfillment_completed', actorUid, 'processing', finalStatus, null, finalStatus === 'completed' ? null : 'Some items failed fulfillment');

  if (finalStatus === 'completed' && orderData.customerEmail) {
    const subject = `Order Completed - #${orderId.slice(0, 8)}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #16a34a;">Order Completed!</h2>
        <p>Dear ${orderData.customerName || 'Customer'},</p>
        <p>Your order <strong>#${orderId.slice(0, 8)}</strong> has been completed successfully.</p>
        <p>Thank you for choosing Click2IT!</p>
      </div>
    `;
    await sendEmail({ to: orderData.customerEmail, subject, html, orderId, customerEmail: orderData.customerEmail, category: 'order' });
  }

  if (finalStatus === 'manual_review' || finalStatus === 'failed') {
    let adminEmail: string | null = null;
    try {
      const siteResult = await getAdminDocument('settings', 'site');
      if (siteResult.exists && siteResult.data) {
        adminEmail = (siteResult.data as any).contactEmail || null;
      }
    } catch (error) {
      console.error('Failed to read site settings:', error);
    }
    if (!adminEmail) {
      adminEmail = process.env.ADMIN_EMAIL || config.smtp.fromEmail || 'info@click2itbd.com';
    }
    if (adminEmail) {
      const failedItems = [...domainResults.filter(r => !r.success), ...hostingResults.filter(r => !r.success)];
      const subject = `Order Fulfillment ${finalStatus === 'manual_review' ? 'Needs Review' : 'Failed'} - #${orderId.slice(0, 8)}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: ${finalStatus === 'manual_review' ? '#f59e0b' : '#dc2626'};">Order Fulfillment ${finalStatus === 'manual_review' ? 'Needs Review' : 'Failed'}</h2>
          <p>Order <strong>#${orderId.slice(0, 8)}</strong> requires attention.</p>
          <h3>Failed Items:</h3>
          <ul>
            ${failedItems.map(item => `<li>${item.type}: ${item.action} - ${item.error || 'Unknown error'} (${item.errorCode || 'unknown'})</li>`).join('')}
          </ul>
          <p>Please review and take appropriate action.</p>
        </div>
      `;
      await sendEmail({ to: adminEmail, subject, html, orderId, customerEmail: adminEmail, category: 'system' });
    }
  }

  return {
    success: finalStatus === 'completed',
    orderId,
    status: finalStatus,
    domainResults,
    hostingResults,
    error: finalStatus === 'completed' ? undefined : 'Some items failed fulfillment',
  };
}

async function fulfillDomainOrder(domainOrderId: string, domainData: any, actorUid: string): Promise<FulfillmentItemResult> {
  const db = getAdminDb();
  const now = new Date().toISOString();

  if (domainData.status === 'active' || domainData.status === 'registered') {
    return {
      itemId: domainOrderId,
      type: 'domain',
      action: domainData.type === 'renewal' ? 'renew' : domainData.type === 'transfer' ? 'transfer' : 'register',
      success: true,
      status: domainData.status,
      error: 'Already fulfilled',
    };
  }

  if (
    domainData.status !== 'pending' &&
    domainData.status !== 'pending_payment' &&
    domainData.status !== 'payment_verified' &&
    domainData.status !== 'failed' &&
    domainData.status !== 'manual_review'
  ) {
    return {
      itemId: domainOrderId,
      type: 'domain',
      action: domainData.type === 'renewal' ? 'renew' : domainData.type === 'transfer' ? 'transfer' : 'register',
      success: false,
      status: domainData.status,
      error: `Domain status '${domainData.status}' is not eligible for fulfillment`,
    };
  }

  const config = await getDomainConfig();
  const provider = getDomainProvider({ domainApiType: config.domainApiType || 'dummy', domainApiKey: config.domainApiKey });

  let result: any;
  let action: 'register' | 'renew' | 'transfer' = 'register';
  let errorCode: string | undefined;

  try {
    if (domainData.type === 'transfer') {
      action = 'transfer';
      const authCode = domainData.authCode;
      if (!authCode) {
        await db.collection('domainOrders').doc(domainOrderId).update({
          status: 'manual_review',
          fulfillmentError: 'Auth code is required for transfer',
          updatedAt: now,
        });
        await writeAuditLog(db, domainOrderId, 'fulfillment_failed', actorUid, domainData.status, 'manual_review', 'validation_error', 'Auth code is required for transfer');
        return {
          itemId: domainOrderId,
          type: 'domain',
          action: 'transfer',
          success: false,
          status: 'manual_review',
          error: 'Auth code is required for transfer',
          errorCode: 'validation_error',
        };
      }
      result = await (provider as any).transferDomain?.(domainData.domain, authCode, domainData.years || 1);
    } else if (domainData.type === 'renewal') {
      action = 'renew';
      result = await provider.renewDomain(domainData.domain, domainData.renewalPeriod || 1);
    } else {
      action = 'register';
      result = await provider.registerDomain({
        domain: domainData.domain,
        years: domainData.years || 1,
        contactId: domainData.contactId,
        nameServers: domainData.nameServers || domainData.nameservers,
        autoRenew: domainData.autoRenew,
      });
    }
  } catch (error: any) {
    errorCode = error instanceof ProviderError ? error.code : 'provider_error';
    const errorMessage = error.message || 'Fulfillment failed';

    await db.collection('domainOrders').doc(domainOrderId).update({
      status: 'manual_review',
      fulfillmentError: errorMessage,
      errorCode,
      retryCount: (domainData.retryCount || 0) + 1,
      lastRetryAt: now,
      updatedAt: now,
    });

    await writeAuditLog(db, domainOrderId, 'fulfillment_failed', actorUid, domainData.status, 'manual_review', errorCode, errorMessage);

    return {
      itemId: domainOrderId,
      type: 'domain',
      action,
      success: false,
      status: 'manual_review',
      error: errorMessage,
      errorCode,
    };
  }

  const isSuccess = result?.success || false;
  const newStatus = isSuccess ? 'active' : 'failed';

  await db.collection('domainOrders').doc(domainOrderId).update({
    status: newStatus,
    registrationId: result?.registrationId || result?.transferId || domainData.registrationId || null,
    expiresAt: result?.expiresAt || domainData.expiresAt || null,
    newExpiryDate: result?.newExpiryDate || null,
    error: result?.error || null,
    providerStatus: result?.status || null,
    updatedAt: now,
  });

  await writeAuditLog(db, domainOrderId, isSuccess ? 'fulfilled' : 'fulfillment_failed', actorUid, domainData.status, newStatus, null, result?.error || null);

  if (isSuccess && domainData.customerEmail) {
    const subject = action === 'renew' ? `Domain Renewed - ${domainData.domain}` :
                   action === 'transfer' ? `Domain Transferred - ${domainData.domain}` :
                   `Domain Registered - ${domainData.domain}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #16a34a;">Domain ${action === 'renew' ? 'Renewed' : action === 'transfer' ? 'Transferred' : 'Registered'} Successfully!</h2>
        <p>Your domain <strong>${domainData.domain}</strong> has been successfully ${action === 'renew' ? 'renewed' : action === 'transfer' ? 'transferred' : 'registered'}.</p>
        ${result?.expiresAt ? `<p><strong>Expires At:</strong> ${new Date(result.expiresAt).toLocaleDateString()}</p>` : ''}
        <p>Thank you for choosing Click2IT!</p>
      </div>
    `;
    await sendEmail({ to: domainData.customerEmail, subject, html, orderId: domainData.orderId, customerEmail: domainData.customerEmail, category: 'domain' });
  }

  return {
    itemId: domainOrderId,
    type: 'domain',
    action,
    success: isSuccess,
    status: newStatus,
    error: result?.error,
    errorCode: isSuccess ? undefined : errorCode,
    providerResult: result,
  };
}

async function fulfillHostingAccount(hostingAccountId: string, hostingData: any, actorUid: string): Promise<FulfillmentItemResult> {
  const db = getAdminDb();
  const now = new Date().toISOString();

  if (hostingData.status === 'active' || hostingData.provisioningStatus === 'completed') {
    return {
      itemId: hostingAccountId,
      type: 'hosting',
      action: 'provision',
      success: true,
      status: hostingData.status,
      error: 'Already fulfilled',
    };
  }

  if (hostingData.status !== 'pending' && hostingData.status !== 'pending_payment' && hostingData.status !== 'failed' && hostingData.status !== 'manual_review' && hostingData.provisioningStatus !== 'pending' && hostingData.provisioningStatus !== 'failed') {
    return {
      itemId: hostingAccountId,
      type: 'hosting',
      action: 'provision',
      success: false,
      status: hostingData.status,
      error: `Hosting status '${hostingData.status}' is not eligible for fulfillment`,
    };
  }

  let contactEmail = hostingData.contactEmail || hostingData.customerEmail || '';
  let customerName = hostingData.customerName || '';
  if ((!contactEmail || !customerName) && hostingData.orderId) {
    try {
      const orderDoc = await db.collection('orders').doc(hostingData.orderId).get();
      if (orderDoc.exists) {
        const oData = orderDoc.data() || {};
        if (!contactEmail) contactEmail = oData.customerEmail || oData.email || '';
        if (!customerName) customerName = oData.customerName || '';
      }
    } catch (e) {
      console.warn('Error loading order for hosting account:', e);
    }
  }

  const { provider } = await getHostingProviderWithSettings();

  try {
    const result = await provider.provisionAccount({
      domain: hostingData.domain || 'click2itbd.com',
      contactEmail,
      billingCycle: hostingData.billingCycle || 'monthly',
      planCode: hostingData.planId || 'default',
    });

    const isSuccess = result.success || false;

    if (isSuccess) {
      await db.collection('hostingAccounts').doc(hostingAccountId).update({
        providerAccountId: result.providerAccountId,
        status: 'active',
        provisioningStatus: 'completed',
        cPanelUrl: result.cPanelUrl,
        nameservers: result.nameservers || [],
        contactEmail,
        customerEmail: contactEmail,
        updatedAt: now,
      });
    } else {
      await db.collection('hostingAccounts').doc(hostingAccountId).update({
        status: 'failed',
        provisioningStatus: 'failed',
        error: result.error,
        contactEmail,
        customerEmail: contactEmail,
        updatedAt: now,
      });
    }

    await writeAuditLog(db, hostingAccountId, isSuccess ? 'fulfilled' : 'fulfillment_failed', actorUid, hostingData.status, isSuccess ? 'active' : 'failed', null, result?.error || null);

    if (isSuccess && contactEmail) {
      const fromName = await getSiteName();
      let emailSubject = `🎉 Your Hosting Account is Ready - ${hostingData.domain}`;
      let heading = 'Welcome to Click2IT Cloud Hosting!';
      let badgeText = '✓ Hosting Account Active';
      let bodyHtml = `
        <p>Dear <strong>${customerName || 'Valued Customer'}</strong>,</p>
        <p>Congratulations! Your cPanel cloud hosting account for <strong>${hostingData.domain}</strong> is now active and ready for your website.</p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 18px 0;">
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 10px; text-transform: uppercase;">cPanel Login Details</div>
          <div style="font-size: 14px; margin-bottom: 6px;"><strong>Domain:</strong> ${hostingData.domain}</div>
          <div style="font-size: 14px; margin-bottom: 6px;"><strong>cPanel Username:</strong> <code style="background:#e2e8f0; padding:2px 6px; border-radius:4px;">${result.providerAccountId || 'See control panel'}</code></div>
          ${result.cPanelUrl ? `<div style="font-size: 14px; margin-bottom: 6px;"><strong>Control Panel:</strong> <a href="${result.cPanelUrl}" style="color: #2563eb; font-weight: 600;">${result.cPanelUrl}</a></div>` : ''}
          ${result.nameservers?.length ? `<div style="font-size: 14px; margin-top: 10px;"><strong>Nameservers:</strong><br>${result.nameservers.map((ns: string) => `• ${ns}`).join('<br>')}</div>` : ''}
        </div>
        <p>You can also log in to your account from your client portal at <a href="https://click2itbd.com" style="color: #2563eb;">click2itbd.com</a> anytime.</p>
      `;
      let footerNote = 'Need help moving your site? Contact our 24/7 technical support team.';

      try {
        const tmplSnap = await db.collection('emailTemplates').doc('welcome_hosting').get();
        if (tmplSnap.exists) {
          const tData = tmplSnap.data() || {};
          if (tData.subject) {
            emailSubject = tData.subject
              .replace(/\{\{domain\}\}/g, hostingData.domain)
              .replace(/\{\{customerName\}\}/g, customerName || 'Valued Customer')
              .replace(/\{\{username\}\}/g, result.providerAccountId || '')
              .replace(/\{\{cPanelUrl\}\}/g, result.cPanelUrl || '');
          }
          if (tData.heading) heading = tData.heading;
          if (tData.badgeText) badgeText = tData.badgeText;
          if (tData.bodyHtml) {
            bodyHtml = tData.bodyHtml
              .replace(/\{\{domain\}\}/g, hostingData.domain)
              .replace(/\{\{customerName\}\}/g, customerName || 'Valued Customer')
              .replace(/\{\{username\}\}/g, result.providerAccountId || '')
              .replace(/\{\{cPanelUrl\}\}/g, result.cPanelUrl || '')
              .replace(/\{\{nameservers\}\}/g, (result.nameservers || []).join(', '));
          }
          if (tData.footerNote !== undefined) footerNote = tData.footerNote;
        }
      } catch (tmplErr) {
        console.warn('Could not load custom email template from Firestore:', tmplErr);
      }

      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 25px 10px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
                  <tr>
                    <td style="background: linear-gradient(135deg, #0a1628 0%, #1e3a8a 100%); padding: 30px 24px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${fromName}</h1>
                      <p style="margin: 4px 0 0; color: #93c5fd; font-size: 13px;">${heading}</p>
                      <div style="margin-top: 14px; display: inline-block; background: rgba(34, 197, 94, 0.2); border: 1px solid #22c55e; border-radius: 30px; padding: 4px 14px;">
                        <span style="color: #4ade80; font-size: 12px; font-weight: 700; text-transform: uppercase;">${badgeText}</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 24px 28px; color: #1f2937; line-height: 1.6; font-size: 14px;">
                      ${bodyHtml}
                    </td>
                  </tr>
                  ${footerNote ? `
                  <tr>
                    <td style="padding: 0 28px 20px;">
                      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 0 8px 8px 0; font-size: 12px; color: #1e40af;">
                        ${footerNote}
                      </div>
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="background-color: #f8fafc; border-top: 1px solid #e5e7eb; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b;">
                      <p style="margin: 0; font-weight: 700; color: #0f172a;">${fromName}</p>
                      <p style="margin: 4px 0 0;">Email: info@click2itbd.com | Web: click2itbd.com</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      await sendEmail({ to: contactEmail, subject: emailSubject, html: fullHtml, orderId: hostingData.orderId, customerEmail: contactEmail, category: 'hosting' });
    }

    return {
      itemId: hostingAccountId,
      type: 'hosting',
      action: 'provision',
      success: isSuccess,
      status: isSuccess ? 'active' : 'failed',
      error: result.error,
      errorCode: isSuccess ? undefined : classifyHostingError(result.error).code,
      providerResult: result,
    };
  } catch (error: any) {
    const classified = classifyHostingError(error);
    await db.collection('hostingAccounts').doc(hostingAccountId).update({
      status: 'manual_review',
      provisioningStatus: 'failed',
      error: classified.message,
      errorCode: classified.code,
      retryCount: (hostingData.retryCount || 0) + 1,
      lastRetryAt: now,
      updatedAt: now,
    });

    await writeAuditLog(db, hostingAccountId, 'fulfillment_failed', actorUid, hostingData.status, 'manual_review', classified.code, classified.message);

    return {
      itemId: hostingAccountId,
      type: 'hosting',
      action: 'provision',
      success: false,
      status: 'manual_review',
      error: classified.message,
      errorCode: classified.code,
    };
  }
}

async function getDomainConfig() {
  let dynadotApiKey = process.env.DYNADOT_API_KEY || config.secrets.dynadotApiKey || '';
  if (!dynadotApiKey) {
    try {
      const apiKeysDoc = await getAdminDocument('settings', 'api_keys');
      if (apiKeysDoc.exists && apiKeysDoc.data?.dynadotApiKey) {
        dynadotApiKey = apiKeysDoc.data.dynadotApiKey;
      }
    } catch (e) {
      console.warn('[Fulfillment] Error reading api_keys from Firestore:', e);
    }
  }

  if (!dynadotApiKey) {
    console.warn('[Fulfillment] No Dynadot API key found in .env or settings/api_keys — domain orders will fail');
  }

  return {
    domainApiType: dynadotApiKey ? 'dynadot' : 'dummy',
    domainApiKey: dynadotApiKey,
  };
}

async function getHostingProviderWithSettings() {
  let hostingApiType = process.env.WHM_API_TYPE || config.secrets.whmApiType || 'cpanel';
  let hostingApiKey = process.env.WHM_API_TOKEN || process.env.WHM_API_KEY || config.secrets.whmApiToken || config.secrets.whmApiKey || '';
  let hostingApiUrl = process.env.WHM_URL || process.env.WHM_API_URL || config.secrets.whmApiUrl || '';
  let hostingApiUsername = (process.env.WHM_USERNAME || config.secrets.whmUsername || 'root').trim();

  if (!hostingApiKey || !hostingApiUrl) {
    try {
      const hostingDoc = await getAdminDocument('settings', 'hostingApiConfig');
      if (hostingDoc.exists && hostingDoc.data) {
        if (!hostingApiKey && hostingDoc.data.hostingApiKey) hostingApiKey = hostingDoc.data.hostingApiKey;
        if (!hostingApiUrl && hostingDoc.data.hostingApiUrl) hostingApiUrl = hostingDoc.data.hostingApiUrl;
        if (hostingDoc.data.hostingApiType) hostingApiType = hostingDoc.data.hostingApiType;
        if (hostingDoc.data.hostingApiUsername) hostingApiUsername = hostingDoc.data.hostingApiUsername;
      }
    } catch (e) {
      console.warn('[Fulfillment] Error reading hostingApiConfig from Firestore:', e);
    }
  }

  if (!hostingApiKey) {
    throw new Error('No WHM API token configured. Set in Admin Hosting API Settings or backend/.env');
  }
  if (!hostingApiUrl) {
    throw new Error('No WHM API URL configured. Set in Admin Hosting API Settings or backend/.env');
  }

  const provider = getHostingProvider({
    hostingApiType,
    hostingApiKey,
    hostingApiUrl,
    hostingApiUsername,
  });

  return { provider };
}

async function getSiteName(): Promise<string> {
  try {
    const result = await getAdminDocument('settings', 'site');
    if (result.exists && result.data) {
      return (result.data as any).siteName || 'Click2IT';
    }
  } catch (error) {
    console.error('Failed to read site settings:', error);
  }
  return 'Click2IT';
}

async function writeAuditLog(
  db: any,
  orderId: string,
  action: string,
  actorUid: string,
  previousStatus: string,
  newStatus: string,
  errorCode: string | null,
  errorMessage: string | null
): Promise<void> {
  try {
    await db.collection('fulfillmentAuditLog').add({
      orderId,
      action,
      actorUid,
      previousStatus,
      newStatus,
      errorCode: errorCode || null,
      errorMessage: errorMessage || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
