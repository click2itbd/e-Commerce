import { getAdminDb, getAdminDocument, isUserAdmin } from '../firebase/admin';
import { sendEmail } from './email';
import { getDomainProvider } from '../providers/providerFactory';
import { getDomainPricingSettings } from './domainPricing';
import { getHostingProvider } from '../providers/providerFactory';
import { ProviderError } from '../providers/domain/DynadotDomainProvider';
import { classifyHostingError } from './hosting';
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

  if (domainData.status !== 'pending' && domainData.status !== 'pending_payment' && domainData.status !== 'payment_verified') {
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

  if (hostingData.status !== 'pending' && hostingData.status !== 'pending_payment' && hostingData.provisioningStatus !== 'pending') {
    return {
      itemId: hostingAccountId,
      type: 'hosting',
      action: 'provision',
      success: false,
      status: hostingData.status,
      error: `Hosting status '${hostingData.status}' is not eligible for fulfillment`,
    };
  }

  const { provider } = await getHostingProviderWithSettings();
  const idempotencyKey = `${hostingData.domain}-${hostingData.planId}-${hostingData.billingCycle}`;

  const existing = await db.collection('hostingAccounts')
    .where('idempotencyKey', '==', idempotencyKey)
    .where('status', '!=', 'cancelled')
    .limit(1)
    .get();

  if (!existing.empty) {
    return {
      itemId: hostingAccountId,
      type: 'hosting',
      action: 'provision',
      success: true,
      status: 'active',
      error: 'Account already exists',
    };
  }

  try {
    const result = await provider.provisionAccount({
      domain: hostingData.domain,
      contactEmail: hostingData.contactEmail || hostingData.customerEmail || '',
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
        updatedAt: now,
      });
    } else {
      await db.collection('hostingAccounts').doc(hostingAccountId).update({
        status: 'failed',
        provisioningStatus: 'failed',
        error: result.error,
        updatedAt: now,
      });
    }

    await writeAuditLog(db, hostingAccountId, isSuccess ? 'fulfilled' : 'fulfillment_failed', actorUid, hostingData.status, isSuccess ? 'active' : 'failed', null, result?.error || null);

    if (isSuccess && hostingData.customerEmail) {
      const fromName = await getSiteName();
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #16a34a;">Hosting Account Provisioned</h2>
          <p>Hi,</p>
          <p>Your hosting account for <strong>${hostingData.domain}</strong> has been successfully provisioned.</p>
          ${result.cPanelUrl ? `<p><strong>Control Panel:</strong> <a href="${result.cPanelUrl}">${result.cPanelUrl}</a></p>` : ''}
          ${result.nameservers?.length ? `<p><strong>Nameservers:</strong> ${result.nameservers.join(', ')}</p>` : ''}
          <p><strong>Billing Cycle:</strong> ${hostingData.billingCycle}</p>
          <p style="color: #888; font-size: 0.9em;">Thank you for choosing ${fromName}.</p>
        </div>
      `;
      await sendEmail({ to: hostingData.customerEmail, subject: `Hosting Ready: ${hostingData.domain}`, html, orderId: hostingData.orderId, customerEmail: hostingData.customerEmail, category: 'hosting' });
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
  const dynadotApiKey = process.env.DYNADOT_API_KEY || config.secrets.dynadotApiKey || '';
  if (!dynadotApiKey) {
    console.warn('[Fulfillment] No Dynadot API key found in .env (DYNADOT_API_KEY) — domain orders will fail');
  }
  return {
    domainApiType: dynadotApiKey ? 'dynadot' : 'dummy',
    domainApiKey: dynadotApiKey,
  };
}

async function getHostingProviderWithSettings() {
  const hostingApiType = process.env.WHM_API_TYPE || config.secrets.whmApiType || 'cpanel';
  const hostingApiKey = process.env.WHM_API_TOKEN || process.env.WHM_API_KEY || config.secrets.whmApiToken || config.secrets.whmApiKey || '';
  const hostingApiUrl = process.env.WHM_URL || process.env.WHM_API_URL || config.secrets.whmApiUrl || '';
  const hostingApiUsername = (process.env.WHM_USERNAME || config.secrets.whmUsername || 'root').trim();

  if (!hostingApiKey) {
    throw new Error('No WHM API token configured. Set WHM_API_TOKEN in backend/.env');
  }
  if (!hostingApiUrl) {
    throw new Error('No WHM API URL configured. Set WHM_URL or WHM_API_URL in backend/.env');
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
