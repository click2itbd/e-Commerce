const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

admin.initializeApp();

async function verifyPaymentWithGateway(orderId, orderData) {
  const db = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277');
  
  // bKash payment verification
  if (orderData.bkashPaymentId) {
    try {
      const settingsSnap = await db.collection('settings').doc('api_keys').get();
      const apiSettings = settingsSnap.exists ? settingsSnap.data() : null;
      const isSandbox = apiSettings?.isSandboxMode === true;
      
      let accessToken;
      try {
        accessToken = await getBkashAccessToken(db);
      } catch (e) {
        console.error('Failed to get bKash access token:', e);
        return false;
      }

      const creds = await getBkashCredentials(db);
      const response = await fetch(`${creds.baseUrl}/tokenized/checkout/payment/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-APP-Key': creds.appKey
        },
        body: JSON.stringify({
          paymentID: orderData.bkashPaymentId
        })
      });

      const rawText = await response.text();
      let apiData;
      try { apiData = JSON.parse(rawText); } catch (e) { apiData = {}; }

      if (!response.ok || apiData.status_code !== '0000') {
        console.error('bKash payment verification failed:', apiData);
        return false;
      }

      const paymentStatus = apiData.status || apiData.transactionStatus || '';
      const isPaid = paymentStatus.toLowerCase() === 'completed' || 
                     paymentStatus.toLowerCase() === 'success' ||
                     apiData.status_code === '0000';
      
      if (!isPaid) {
        console.error('bKash payment not completed:', { paymentId: orderData.bkashPaymentId, status: paymentStatus });
        return false;
      }

      const paidAmount = parseFloat(apiData.amount || '0');
      const orderAmount = parseFloat(orderData.total || orderData.grandTotal || '0');
      
      if (paidAmount > 0 && Math.abs(paidAmount - orderAmount) > 1) {
        console.error('bKash payment amount mismatch:', { expected: orderAmount, actual: paidAmount });
        return false;
      }

      return true;
    } catch (error) {
      console.error('bKash payment verification error:', error);
      return false;
    }
  }

  // No payment ID found - cannot verify
  console.warn('Payment verification skipped: no payment ID found for order', orderId);
  return false;
}

async function getBkashCredentials(db) {
  const data = await db.collection('settings').doc('api_keys').get();
  if (!data.exists) {
    throw new Error('bKash credentials not configured');
  }
  const apiSettings = data.data();
  const isSandbox = apiSettings?.isSandboxMode === true;
  const prefix = isSandbox ? 'sandbox_' : 'production_';
  
  return {
    appKey: apiSettings[`${prefix}bkashAppKey`],
    appSecret: apiSettings[`${prefix}bkashAppSecret`],
    username: apiSettings[`${prefix}bkashUsername`],
    password: apiSettings[`${prefix}bkashPassword`],
    baseUrl: getBkashBaseUrl(isSandbox),
    isSandbox
  };
}

async function getBkashAccessToken(db) {
  const creds = await getBkashCredentials(db);
  
  const auth = Buffer.from(`${creds.username}:${creds.password}`).toString('base64');
  
  const response = await fetch(`${creds.baseUrl}/tokenized/checkout/token/grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
      'X-APP-Key': creds.appKey
    },
    body: JSON.stringify({
      app_key: creds.appKey,
      app_secret: creds.appSecret
    })
  });

  const rawText = await response.text();
  let apiData;
  try { apiData = JSON.parse(rawText); } catch (e) { apiData = {}; }

  if (!response.ok || apiData.status_code !== '0000') {
    throw new Error(apiData.status_message || 'Failed to get bKash access token');
  }

  return apiData.id_token;
}

function getBkashBaseUrl(isSandbox) {
  return isSandbox ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta' : 'https://tokenized.pay.bka.sh/v1.2.0-beta';
}

exports.storeTransferAuthCodes = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const { orderId, authCodes } = data;
  
  if (!orderId || !Array.isArray(authCodes) || authCodes.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'orderId and authCodes array are required.');
  }

  const db = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277');
  
  try {
    const batch = db.batch();
    
    for (const codeData of authCodes) {
      const { domain, authCode } = codeData;
      if (!domain || !authCode) continue;
      
      const docRef = db.collection('transferAuthCodes').doc(`${orderId}_${domain}`);
      batch.set(docRef, {
        orderId,
        domain,
        authCode,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)), // 24 hours
      });
    }
    
    await batch.commit();
    return { success: true, message: 'Transfer auth codes stored securely' };
  } catch (error) {
    console.error('Failed to store transfer auth codes:', error);
    throw new functions.https.HttpsError('internal', 'Failed to store transfer auth codes.');
  }
});

exports.cleanupTransferAuthCodes = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const { orderId, domains } = data;
  
  if (!orderId || !Array.isArray(domains)) {
    throw new functions.https.HttpsError('invalid-argument', 'orderId and domains array are required.');
  }

  const db = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277');
  
  try {
    const batch = db.batch();
    
    for (const domain of domains) {
      const docRef = db.collection('transferAuthCodes').doc(`${orderId}_${domain}`);
      batch.delete(docRef);
    }
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Failed to cleanup transfer auth codes:', error);
    throw new functions.https.HttpsError('internal', 'Failed to cleanup transfer auth codes.');
  }
});

exports.checkTransferEligibility = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const { domain } = data;
  
  if (!domain || typeof domain !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Domain is required.');
  }

  const normalizedDomain = domain.toLowerCase().trim();
  const db = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277');
  
  try {
    // Check if domain is already transferred/registered with us
    const existingOrderSnap = await db.collection('domainOrders')
      .where('domain', '==', normalizedDomain)
      .where('status', 'in', ['active', 'pending', 'renewing'])
      .limit(1)
      .get();
    
    if (!existingOrderSnap.empty) {
      return {
        eligible: false,
        reason: 'This domain is already registered or being processed with us.',
        code: 'DOMAIN_ALREADY_MANAGED'
      };
    }

    // Check if there's a pending transfer for this domain
    const pendingTransferSnap = await db.collection('domainOrders')
      .where('domain', '==', normalizedDomain)
      .where('action', '==', 'transfer')
      .where('status', '==', 'pending')
      .limit(1)
      .get();
    
    if (!pendingTransferSnap.empty) {
      return {
        eligible: false,
        reason: 'A transfer for this domain is already in progress.',
        code: 'TRANSFER_ALREADY_PENDING'
      };
    }

    // Basic domain format validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(normalizedDomain)) {
      return {
        eligible: false,
        reason: 'Invalid domain format.',
        code: 'INVALID_DOMAIN_FORMAT'
      };
    }

    return {
      eligible: true,
      message: 'Domain appears eligible for transfer. Final eligibility will be confirmed by the current registrar during the transfer process.',
      checks: {
        formatValid: true,
        notAlreadyManaged: true,
        noPendingTransfer: true
      }
    };
  } catch (error) {
    console.error('Transfer eligibility check error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to check transfer eligibility.');
  }
});

exports.paymentWebhook = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  try {
    const { orderId, status, transactionId } = req.body; 

    if (!orderId || !status) {
      return res.status(400).send("Missing required parameters: orderId or status");
    }

    // Check in 'orders' collection
    let targetRef = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').collection("orders").doc(orderId);
    let docSnap = await targetRef.get();

    // If not in 'orders', check in 'invoices' (for domain offers/renewals)
    if (!docSnap.exists) {
      targetRef = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').collection("invoices").doc(orderId);
      docSnap = await targetRef.get();
    }

    if (!docSnap.exists) {
      return res.status(404).send("Order/Invoice not found");
    }

    const orderData = docSnap.data();

    // Idempotency: prevent duplicate provisioning
    if (orderData.provisioningStatus === 'completed') {
      return res.status(200).send({ message: "Order already processed", orderId });
    }

    // Verify payment with gateway before provisioning
    if (status === "success") {
      const verified = await verifyPaymentWithGateway(orderId, orderData);
      if (!verified) {
        await targetRef.update({
          paymentStatus: 'failed',
          provisioningStatus: 'failed',
          provisioningError: 'Payment verification failed with gateway',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return res.status(400).send({ error: "Payment verification failed" });
      }

    // Securely update using Admin SDK (bypasses Firestore Rules)
    await targetRef.update({
      status: "processing",
      paymentStatus: "paid",
      provisioningStatus: "processing",
      transactionId: transactionId || "N/A",
      paymentCompletedAt: admin.firestore.FieldValue.serverTimestamp()
    });

      // Check if this order contains domains and register them via Dynadot
      if (docSnap.exists) {
        const orderData = docSnap.data();
        if (orderData.items && orderData.items.length > 0) {
          
          const domainItems = orderData.items.filter(item => item.itemType === 'domain');
          
          const renewalItems = orderData.items.filter(item => item.itemType === 'domain_renewal');
          const transferItems = orderData.items.filter(item => item.itemType === 'domain_transfer');


          
          if (domainItems.length > 0) {
            // Fetch API settings
            const settingsSnap = await getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').collection('settings').doc('api_keys').get();
            const apiSettings = settingsSnap.exists ? settingsSnap.data() : null;
            const apiKey = apiSettings?.dynadotApiKey;
            const isSandbox = apiSettings?.isSandboxMode === true;
            const baseUrl = isSandbox ? 'https://api-sandbox.dynadot.com/api3.json' : 'https://api.dynadot.com/api3.json';

            if (apiKey) {

            
              for (const item of transferItems) {
                const domain = item.domain || item.id.replace('domain_transfer_', '');
                
                // Fetch auth code from secure collection
                const authCodeSnap = await getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277')
                  .collection('transferAuthCodes')
                  .doc(`${orderId}_${domain}`)
                  .get();
                
                const authCode = authCodeSnap.exists ? authCodeSnap.data()?.authCode : '';
                
                if (!authCode) {
                  console.warn(`No auth code found for transfer: ${domain}`);
                  const dOrdersSnap = await getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').collection('domainOrders')
                    .where('orderId', '==', orderId)
                    .where('domain', '==', domain)
                    .get();
                  if (!dOrdersSnap.empty) {
                    await updateDoc(dOrdersSnap.docs[0].ref, {
                      status: 'failed',
                      provisioningStatus: 'failed',
                      error: 'Missing authorization code',
                      updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                  }
                  continue;
                }
                
                // Call Dynadot Transfer Command
                const dynadotUrl = `${baseUrl}?key=${apiKey}&command=transfer&domain=${domain}&authcode0=${encodeURIComponent(authCode)}`;
                try {
                  const regResponse = await fetch(dynadotUrl);
                  const regData = await regResponse.json();
                  
                  // Log Transfer
                  await getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').collection('apiLogs').add({
                    action: 'dynadot_transfer',
                    domain,
                    orderId,
                    isSandbox,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    response: regData
                  });
                  
                  // Clean up auth code after use
                  await getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277')
                    .collection('transferAuthCodes')
                    .doc(`${orderId}_${domain}`)
                    .delete();
                  
                  // Update domainOrders document with proper state machine
                  const dOrdersSnap = await getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').collection('domainOrders')
                    .where('orderId', '==', orderId)
                    .where('domain', '==', domain)
                    .get();
                    
                   if (!dOrdersSnap.empty) {
                      const dOrderRef = dOrdersSnap.docs[0].ref;
                      const isSuccess = regData?.TransferResponse?.TransferResults?.[0]?.Status?.toLowerCase() === 'success';
                      
                      await dOrderRef.update({
                        status: isSuccess ? 'active' : 'failed',
                        transferResponse: JSON.stringify(regData),
                        provisioningStatus: isSuccess ? 'completed' : 'failed',
                        error: isSuccess ? null : (regData?.TransferResponse?.TransferResults?.[0]?.Message || 'Transfer failed'),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                      });
                    }
                    
                  } catch (e) {
                    console.error('Auto-transfer failed for', domain, e);
                    const dOrdersSnap = await getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').collection('domainOrders')
                      .where('orderId', '==', orderId)
                      .where('domain', '==', domain)
                      .get();
                    if (!dOrdersSnap.empty) {
                      await updateDoc(dOrdersSnap.docs[0].ref, {
                        provisioningStatus: 'failed',
                        error: e.message,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                      });
                    }
                    
                    // Clean up auth code even on failure
                    try {
                      await getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277')
                        .collection('transferAuthCodes')
                        .doc(`${orderId}_${domain}`)
                        .delete();
                    } catch (cleanupError) {
                      console.error('Failed to cleanup auth code:', cleanupError);
                    }
                  }
                }
                for (const item of renewalItems) {
                const domain = item.domain;
                const years = item.termYears || 1;
                
                // Call Dynadot Renew Command
                const dynadotUrl = `${baseUrl}?key=${apiKey}&command=renew&domain=${domain}&duration=${years}`;
                try {
                  const regResponse = await fetch(dynadotUrl);
                  const regData = await regResponse.json();
                  
                  // Log Registration
                  await getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').collection('apiLogs').add({
                    action: 'dynadot_renew',
                    domain,
                    orderId,
                    isSandbox,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    response: regData
                  });
                  
                  // Update domainOrders document if successful
                  const dOrdersSnap = await getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').collection('domainOrders')
                    .where('orderId', '==', orderId)
                    .where('domain', '==', domain)
                    .get();
                    
                   if (!dOrdersSnap.empty) {
                     const dOrderRef = dOrdersSnap.docs[0].ref;
                     const isSuccess = regData?.RenewResponse?.RenewResults?.[0]?.Status?.toLowerCase() === 'success';
                     
                     await dOrderRef.update({
                       status: isSuccess ? 'active' : 'failed',
                       renewalResponse: JSON.stringify(regData),
                       provisioningStatus: isSuccess ? 'completed' : 'failed',
                       updatedAt: admin.firestore.FieldValue.serverTimestamp()
                     });
                   }
                   
                 } catch (e) {
                   console.error('Auto-renewal failed for', domain, e);
                   const dOrdersSnap = await getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').collection('domainOrders')
                     .where('orderId', '==', orderId)
                     .where('domain', '==', domain)
                     .get();
                   if (!dOrdersSnap.empty) {
                     await updateDoc(dOrdersSnap.docs[0].ref, {
                       provisioningStatus: 'failed',
                       error: e.message,
                       updatedAt: admin.firestore.FieldValue.serverTimestamp()
                     });
                   }
                 }
               }
             }

            
            if (apiKey) {
              for (const item of domainItems) {
                const domain = item.id.replace('domain_', '');
                const years = item.termYears || 1;
                
                // Call Dynadot Register Command
                const dynadotUrl = `${baseUrl}?key=${apiKey}&command=register&domain=${domain}&duration=${years}`;
                try {
                  const regResponse = await fetch(dynadotUrl);
                  const regData = await regResponse.json();
                  
                  // Log Registration
                  await getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').collection('apiLogs').add({
                    action: 'auto_register',
                    domain,
                    orderId,
                    isSandbox,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    response: regData
                  });
                  
                  // Update domainOrders document if successful
                  // The UI created domainOrders with orderId matching this order
                  const dOrdersSnap = await getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').collection('domainOrders')
                    .where('orderId', '==', orderId)
                    .where('domain', '==', domain)
                    .get();
                    
                   if (!dOrdersSnap.empty) {
                     const dOrderRef = dOrdersSnap.docs[0].ref;
                     const isSuccess = regData?.RegisterResponse?.RegisterResults?.[0]?.Status?.toLowerCase() === 'success';
                     
                     await dOrderRef.update({
                       status: isSuccess ? 'active' : 'failed',
                       registrationResponse: JSON.stringify(regData),
                       provisioningStatus: isSuccess ? 'completed' : 'failed',
                       updatedAt: admin.firestore.FieldValue.serverTimestamp()
                     });
                   }
                   
                 } catch (e) {
                   console.error('Auto-registration failed for', domain, e);
                   const dOrdersSnap = await getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').collection('domainOrders')
                     .where('orderId', '==', orderId)
                     .where('domain', '==', domain)
                     .get();
                   if (!dOrdersSnap.empty) {
                     await updateDoc(dOrdersSnap.docs[0].ref, {
                       provisioningStatus: 'failed',
                       error: e.message,
                       updatedAt: admin.firestore.FieldValue.serverTimestamp()
                     });
                   }
                 }
               }
            }
          }

          // Provision hosting accounts if this order contains hosting items
          const hostingItems = orderData.items.filter(item => item.itemType === 'hosting');
          if (hostingItems.length > 0) {
            const hAccountsSnap = await getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').collection('hostingAccounts')
              .where('orderId', '==', orderId)
              .get();

            if (!hAccountsSnap.empty) {
              const hostingConfigSnap = await getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').collection('settings').doc('hostingApiConfig').get();
              const hostingConfig = hostingConfigSnap.exists ? hostingConfigSnap.data() : {};
              const hostingProviderType = hostingConfig?.hostingApiType || 'dummy';
              const hostingApiKey = hostingConfig?.hostingApiKey;
              const hostingApiUrl = hostingConfig?.hostingApiUrl;
              const isSandbox = hostingConfig?.isSandboxMode === true;

              let provider;
              if (hostingProviderType === 'cpanel' && hostingApiKey) {
                const { CpanelHostingProvider } = require('./providers/hosting/CpanelHostingProvider');
                provider = new CpanelHostingProvider(hostingApiKey, hostingApiUrl);
              } else if (hostingProviderType === 'resellerclub' && hostingApiKey) {
                const { ResellerClubHostingProvider } = require('./providers/hosting/ResellerClubHostingProvider');
                provider = new ResellerClubHostingProvider(hostingApiKey, hostingApiUrl);
              } else {
                provider = null;
              }

              const clnLogin = hostingConfig?.clnLogin;
              const clnSecretKey = hostingConfig?.clnSecretKey;

              for (const accountDoc of hAccountsSnap.docs) {
                const accountData = accountDoc.data();

                await updateDoc(accountDoc.ref, {
                  provisioningStatus: 'processing',
                  provider: hostingProviderType,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                if (!provider) {
                  await updateDoc(accountDoc.ref, {
                    provisioningStatus: 'failed',
                    status: 'failed',
                    provisioningError: 'Hosting provider not configured. Please configure cPanel or ResellerClub in admin settings.',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                  });
                  continue;
                }

                try {
                  const provisionResult = await provider.provisionAccount({
                    planCode: accountData.planId || 'default',
                    domain: accountData.domain || '',
                    contactEmail: orderData.customerEmail || '',
                    billingCycle: accountData.billingCycle || 'monthly',
                  });

                  if (provisionResult.success) {
                    await updateDoc(accountDoc.ref, {
                      status: 'active',
                      provisioningStatus: 'provider_created',
                      providerAccountId: provisionResult.providerAccountId || null,
                      cPanelUrl: provisionResult.cPanelUrl || null,
                      nameservers: provisionResult.nameservers || [],
                      activatedAt: admin.firestore.FieldValue.serverTimestamp(),
                      updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                  } else {
                    await updateDoc(accountDoc.ref, {
                      status: 'failed',
                      provisioningStatus: 'failed',
                      provisioningError: provisionResult.error || 'Provider returned failure',
                      updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    continue;
                  }
                } catch (providerError) {
                  await updateDoc(accountDoc.ref, {
                    status: 'failed',
                    provisioningStatus: 'failed',
                    provisioningError: providerError.message || 'Provider error',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                  });
                  continue;
                }

                const refreshedAccount = await accountDoc.ref.get();
                const refreshedData = refreshedAccount.data();
                const ip = refreshedData?.ipAddress || refreshedData?.ip;
                const licenseType = refreshedData?.licenseType || 1;

                if (!ip) {
                  console.warn('Hosting account missing IP address for CloudLinux provisioning:', accountDoc.id);
                  await updateDoc(accountDoc.ref, {
                    cloudLinuxStatus: 'skipped_no_ip',
                    provisioningStatus: 'completed',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                  });
                  continue;
                }

                if (!clnLogin || !clnSecretKey) {
                  console.warn('CloudLinux credentials not configured. Skipping provisioning.');
                  await updateDoc(accountDoc.ref, {
                    cloudLinuxStatus: 'CLOUDLINUX_NOT_CONFIGURED',
                    provisioningStatus: 'completed',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                  });
                  continue;
                }

                if (isSandbox) {
                  console.error('[CloudLinux] SANDBOX_MODE_ENABLED - Production provisioning blocked.');
                  await updateDoc(accountDoc.ref, {
                    cloudLinuxStatus: 'CLOUDLINUX_SANDBOX_MODE_ENABLED',
                    cloudLinuxError: 'Sandbox mode is enabled. Set isSandboxMode=false in settings/hostingApiConfig for production.',
                    provisioningStatus: 'completed',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                  });
                  continue;
                }

                const timestamp = Math.floor(Date.now() / 1000);
                const hash = crypto.createHash('sha1').update(clnSecretKey + timestamp).digest('hex');
                const token = `${clnLogin}|${timestamp}|${hash}`;
                const baseUrl = 'https://cln.cloudlinux.com/api';
                const endpoint = `/v2/ip-license/licenses?ip=${encodeURIComponent(ip)}&type=${licenseType}`;

                try {
                  const response = await fetch(`${baseUrl}${endpoint}`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    }
                  });

                  const rawText = await response.text();
                  let apiData;
                  try { apiData = JSON.parse(rawText); } catch (e) { apiData = {}; }

                  if (!response.ok) {
                    console.error('CloudLinux provisioning error:', apiData);
                    await updateDoc(accountDoc.ref, {
                      cloudLinuxStatus: 'failed',
                      cloudLinuxError: JSON.stringify(apiData),
                      provisioningStatus: 'completed',
                      updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                  } else {
                    
                    await updateDoc(accountDoc.ref, {
                      cloudLinuxStatus: 'active',
                      cloudLinuxLicenseId: apiData?.data?.id || apiData?.id || null,
                      cloudLinuxResponse: JSON.stringify(apiData),
                      provisioningStatus: 'completed',
                      updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                  }
                } catch (error) {
                  console.error('CloudLinux provisioning failed:', error);
                  await updateDoc(accountDoc.ref, {
                    cloudLinuxStatus: 'failed',
                    cloudLinuxError: error.message,
                    provisioningStatus: 'completed',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                  });
                }
              }

              await getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').collection('apiLogs').add({
                action: 'hosting_provisioning_completed',
                orderId,
                accountCount: hAccountsSnap.size,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                isSandbox,
                provider: hostingProviderType,
                note: isSandbox ? 'CloudLinux blocked due to sandbox mode.' : 'Provisioning executed.'
              });
            }

            // Mark order provisioning as completed
            await targetRef.update({
              provisioningStatus: 'completed',
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
      }

      return res.status(200).send({ message: "Payment status updated successfully" });
    } else {
      // Payment Failed or Cancelled - DELETE the order!
      let targetRef = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').collection("orders").doc(orderId);
      let docSnap = await targetRef.get();

      if (!docSnap.exists) {
        targetRef = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').collection("invoices").doc(orderId);
        docSnap = await targetRef.get();
      }

      if (docSnap.exists) {
        await targetRef.delete();

        // Also delete domainOrders
        const dOrdersSnap = await getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').collection('domainOrders')
          .where('orderId', '==', orderId)
          .get();
          
        if (!dOrdersSnap.empty) {
          const batch = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').batch();
          dOrdersSnap.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
        }

        // Also delete hostingAccounts
        const hAccountsSnap = await getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').collection('hostingAccounts')
          .where('orderId', '==', orderId)
          .get();
          
        if (!hAccountsSnap.empty) {
          const batch = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').batch();
          hAccountsSnap.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
        }
      }

      return res.status(200).send({ message: "Order deleted successfully due to failed payment" });
    }

  } catch (error) {
    console.error("Webhook Error:", error);
    return res.status(500).send("Internal Server Error");
  }
});



exports.dynadotSearchProxy = functions.https.onCall(async (data, context) => {
  try {
    const payload = data.data || data; 
    const domain = payload.domain;
    
    if (!domain) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing domain parameter');
    }

    const db = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277');
    const settingsSnap = await db.collection('settings').doc('api_keys').get();
    const apiKey = settingsSnap.exists ? settingsSnap.data()?.dynadotApiKey : null;
    const isSandbox = settingsSnap.exists ? settingsSnap.data()?.isSandboxMode === true : false;
    const apiKeysData = settingsSnap.exists ? settingsSnap.data() : {};
    const exchangeRate = parseFloat(apiKeysData.usdToBdtRate) || 120;
    const markupPercent = parseFloat(apiKeysData.domainMarkupPercent) || 15;

    console.log('[DynadotSearchProxy] Settings:', {
      hasApiKey: !!apiKey,
      isSandbox,
      exchangeRate,
      markupPercent,
      domain
    });

    if (!apiKey) {
      throw new functions.https.HttpsError('internal', 'Domain API key not configured.');
    }

    const baseUrl = isSandbox ? 'https://api-sandbox.dynadot.com/api3.json' : 'https://api.dynadot.com/api3.json';
    
    // Step 1: Check domain availability via search API
    const searchUrl = `${baseUrl}?key=${apiKey}&command=search&domain0=${domain}`;
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new functions.https.HttpsError('internal', `Dynadot API HTTP Error ${searchResponse.status}`);
    }
    const searchText = await searchResponse.text();
    let searchData;
    try { 
      searchData = JSON.parse(searchText); 
    } catch(e) { 
      throw new functions.https.HttpsError('internal', 'Failed to parse Dynadot search response.');
    }

    

    const searchResult = searchData?.SearchResponse?.SearchResults?.[0];
    if (!searchResult) {
      throw new functions.https.HttpsError('not-found', 'No search results found for domain.');
    }

    const isAvailable = searchResult.Available?.toLowerCase() === 'yes';
    const domainName = searchResult.Domain || searchResult.domain || domain;
    
    console.log('[DynadotSearchProxy] Availability:', {
      rawAvailable: searchResult.Available,
      isAvailable,
      domainName
    });
    
    // Extract TLD from domain
    const tldMatch = domainName.match(/\.[^.]+$/);
    const tld = tldMatch ? tldMatch[0] : '';
    
    console.log('[DynadotSearchProxy] Domain:', domainName, 'Available:', isAvailable, 'TLD:', tld);

    // Step 2: Fetch TLD pricing from tld_price API
    let registerPriceUsd = 0;
    
    if (tld) {
      const tldUrl = `${baseUrl}?key=${apiKey}&command=tld_price&tld=${encodeURIComponent(tld)}&currency=USD`;
      const tldResponse = await fetch(tldUrl);
      
      if (tldResponse.ok) {
        const tldText = await tldResponse.text();
        let tldData;
        try { 
          tldData = JSON.parse(tldText); 
        } catch(e) { 
          tldData = null; 
        }

        console.log('[DynadotSearchProxy] Extracted TLD:', tld);
        

        // Try multiple possible response structures
        const tldPriceArray = 
          tldData?.TldPriceResponse?.TldPrice ||
          tldData?.TLDPricing?.TldPrice ||
          tldData?.TldPrice ||
          (Array.isArray(tldData) ? tldData : null);

        if (tldPriceArray && Array.isArray(tldPriceArray)) {
          const matchedTld = tldPriceArray.find(
            item => item?.Tld?.toLowerCase() === tld.toLowerCase()
          );

          console.log('[DynadotSearchProxy] Matched TLD data:', JSON.stringify(matchedTld));

          if (matchedTld?.Price?.Register) {
            registerPriceUsd = parseFloat(matchedTld.Price.Register);
            console.log('[DynadotSearchProxy] Register price:', registerPriceUsd);
          } else if (matchedTld?.Price?.register) {
            registerPriceUsd = parseFloat(matchedTld.Price.register);
            console.log('[DynadotSearchProxy] Register price (lowercase):', registerPriceUsd);
          }
        }
      }
    }

    // Step 3: Calculate final price
    let priceUsd = 0;
    let priceBdt = 0;
    let status = isAvailable ? 'available' : 'taken';

    if (registerPriceUsd > 0) {
      const retailUsd = registerPriceUsd * (1 + markupPercent / 100);
      priceUsd = Math.round(retailUsd * 100) / 100;
      priceBdt = Math.round(retailUsd * exchangeRate);
      
      console.log('[DynadotSearchProxy] Calculated price:', {
        registerPriceUsd,
        retailUsd,
        priceUsd,
        priceBdt
      });
    } else {
      console.log('[DynadotSearchProxy] No register price available for TLD:', tld);
    }

    // Return result in the expected format
    return {
      SearchResponse: {
        ResponseCode: '0',
        SearchResults: [
          {
            DomainName: domainName,
            Status: isAvailable ? 'success' : 'success',
            Available: isAvailable ? 'yes' : 'no',
            Price: registerPriceUsd > 0 ? priceUsd.toFixed(2) : '0',
            priceBdt: priceBdt,
            Currency: 'USD',
            TLD: tld,
            RegisterPrice: registerPriceUsd
          }
        ]
      }
    };

  } catch (error) {
    console.error('Dynadot Search Proxy Error:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Domain search failed unexpectedly.');
  }
});

exports.dynadotTldPricing = functions.https.onCall(async (data, context) => {
  try {
    const { tld } = data;
    
    if (!tld) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing TLD parameter');
    }

    const db = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277');
    const settingsSnap = await db.collection('settings').doc('api_keys').get();
    const apiKey = settingsSnap.exists ? settingsSnap.data()?.dynadotApiKey : null;
    const isSandbox = settingsSnap.exists ? settingsSnap.data()?.isSandboxMode === true : false;

    if (!apiKey) {
      throw new functions.https.HttpsError('internal', 'Domain API key not configured.');
    }

    const baseUrl = isSandbox ? 'https://api-sandbox.dynadot.com/api3.json' : 'https://api.dynadot.com/api3.json';
    const dynadotUrl = `${baseUrl}?key=${apiKey}&command=tld_price&tld=${encodeURIComponent(tld)}&currency=USD`;

    const response = await fetch(dynadotUrl);
    if (!response.ok) {
      throw new functions.https.HttpsError('internal', `Dynadot API HTTP Error ${response.status}`);
    }
    const rawText = await response.text();
    
    let apiData;
    try {
      apiData = JSON.parse(rawText);
    } catch(e) {
      throw new functions.https.HttpsError('internal', 'Failed to parse JSON response from Dynadot.');
    }

    

    if (apiData?.ResponseCode === '0' && apiData?.TLDPricing) {
      const tldData = apiData.TLDPricing;
      return {
        success: true,
        tld: tld,
        currency: 'USD',
        registrationPrice: parseFloat(tldData.RegistrationPrice || tldData.registration_price || 0),
        renewalPrice: parseFloat(tldData.RenewalPrice || tldData.renewal_price || 0),
        transferPrice: parseFloat(tldData.TransferPrice || tldData.transfer_price || 0),
        restorePrice: parseFloat(tldData.RestorePrice || tldData.restore_price || 0),
      };
    }

    throw new functions.https.HttpsError('not-found', `TLD pricing not available for .${tld}`);
  } catch (error) {
    console.error('Dynadot TLD Pricing Error:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to fetch TLD pricing.');
  }
});

const DYNADOT_PRICING_UNAVAILABLE = 'Domain pricing is temporarily unavailable. Please try again shortly.';

function throwPricingError(category, details) {
  console.error('[dynadotTldPricingBatch]', category, details || '');
  throw new functions.https.HttpsError('internal', DYNADOT_PRICING_UNAVAILABLE);
}

function classifyDynadotFailure(apiData, httpStatus) {
  const responseCode =
    apiData?.TldPriceResponse?.ResponseCode ??
    apiData?.Response?.ResponseCode ??
    apiData?.ResponseCode;
  const errorText = String(
    apiData?.TldPriceResponse?.Error ||
    apiData?.Response?.Error ||
    apiData?.Error ||
    apiData?.TldPriceResponse?.Status ||
    apiData?.SearchResponse?.Status ||
    apiData?.SearchResponse?.Error ||
    ''
  ).toLowerCase();
  const codeNum = Number(responseCode);

  if (
    httpStatus === 401 ||
    httpStatus === 403 ||
    errorText.includes('invalid_key') ||
    errorText.includes('invalid key') ||
    errorText.includes('authentication') ||
    errorText.includes('unauthorized')
  ) {
    return 'DYNADOT_AUTHENTICATION_FAILURE';
  }
  if (
    errorText.includes('permission') ||
    errorText.includes('not authorized') ||
    errorText.includes('access denied') ||
    errorText.includes('not permitted')
  ) {
    return 'DYNADOT_PERMISSION_FAILURE';
  }
  if (
    errorText.includes('sandbox') ||
    errorText.includes('production key') ||
    errorText.includes('wrong environment')
  ) {
    return 'SANDBOX_PRODUCTION_MISMATCH';
  }
  if (responseCode !== undefined && responseCode !== null && responseCode !== '' && codeNum !== 0) {
    return 'DYNADOT_API_ERROR';
  }
  return null;
}

function extractTldPriceArray(apiData) {
  if (Array.isArray(apiData?.TldPriceResponse?.TldPrice)) return apiData.TldPriceResponse.TldPrice;
  if (Array.isArray(apiData?.TLDPricing?.TldPrice)) return apiData.TLDPricing.TldPrice;
  if (Array.isArray(apiData?.TldPrice)) return apiData.TldPrice;
  if (Array.isArray(apiData)) return apiData;
  return null;
}

function normalizeTld(tld) {
  return String(tld || '').trim().replace(/^\./, '').toLowerCase();
}

function matchTldEntry(tldPriceArray, tld) {
  const needle = normalizeTld(tld);
  return tldPriceArray.find((item) => normalizeTld(item?.Tld) === needle) || null;
}

function extractRegisterPriceUsd(matchedTld) {
  const raw =
    matchedTld?.Price?.Register ??
    matchedTld?.Price?.register ??
    matchedTld?.RegistrationPrice ??
    matchedTld?.registration_price ??
    0;
  const value = parseFloat(raw);
  return Number.isFinite(value) ? value : 0;
}

async function fetchDynadotTldPrice(baseUrl, apiKey, tld) {
  const tldParam = normalizeTld(tld);
  const dynadotUrl = `${baseUrl}?key=${apiKey}&command=tld_price&tld=${encodeURIComponent(tldParam)}&currency=USD`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(dynadotUrl, { signal: controller.signal });
    const rawText = await response.text();
    let apiData;
    try {
      apiData = JSON.parse(rawText);
    } catch (e) {
      return { category: 'UNEXPECTED_DYNADOT_RESPONSE', httpStatus: response.status };
    }

    const classified = classifyDynadotFailure(apiData, response.status);
    if (classified) {
      return { category: classified, httpStatus: response.status, responseCode: apiData?.TldPriceResponse?.ResponseCode ?? apiData?.ResponseCode };
    }

    if (!response.ok) {
      return { category: 'DYNADOT_API_ERROR', httpStatus: response.status };
    }

    const tldPriceArray = extractTldPriceArray(apiData);
    if (!tldPriceArray) {
      return { category: 'UNEXPECTED_DYNADOT_RESPONSE', httpStatus: response.status };
    }

    const matchedTld = matchTldEntry(tldPriceArray, tldParam);
    if (!matchedTld) {
      return { category: 'INVALID_TLD' };
    }

    const registerPriceUsd = extractRegisterPriceUsd(matchedTld);
    if (!(registerPriceUsd > 0)) {
      return { category: 'UNEXPECTED_DYNADOT_RESPONSE', httpStatus: response.status };
    }

    return { category: null, registerPriceUsd };
  } catch (error) {
    if (error?.name === 'AbortError') {
      return { category: 'NETWORK_TIMEOUT' };
    }
    return { category: 'NETWORK_TIMEOUT', details: error?.message };
  } finally {
    clearTimeout(timeout);
  }
}

exports.dynadotTldPricingBatch = functions.https.onCall(async (data, context) => {
  try {
    const payload = data?.data || data || {};
    const tlds = Array.isArray(payload.tlds) ? payload.tlds : [];

    if (!tlds.length) {
      throwPricingError('INVALID_TLD', 'Missing tlds array');
    }

    const db = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277');
    let settingsSnap;
    try {
      settingsSnap = await db.collection('settings').doc('api_keys').get();
    } catch (error) {
      throwPricingError('FIRESTORE_ACCESS_ERROR', error?.message);
    }

    const apiKeysData = settingsSnap.exists ? (settingsSnap.data() || {}) : {};
    const apiKey = typeof apiKeysData.dynadotApiKey === 'string' ? apiKeysData.dynadotApiKey.trim() : '';
    const exchangeRate = parseFloat(apiKeysData.usdToBdtRate);
    const parsedMarkup = parseFloat(apiKeysData.domainMarkupPercent);
    const markupConfigured = Number.isFinite(parsedMarkup) && parsedMarkup >= 0;
    const markupPercent = markupConfigured ? parsedMarkup : 15;
    const isSandbox = apiKeysData.isSandboxMode === true;

    console.log('[dynadotTldPricingBatch] Config:', {
      dynadotApiKeyConfigured: apiKey.length > 0 ? 'yes' : 'no',
      exchangeRateConfigured: Number.isFinite(exchangeRate) && exchangeRate > 0 ? 'yes' : 'no',
      markupConfigured: markupConfigured ? 'yes' : 'no',
      markupSource: markupConfigured ? 'firestore' : 'default_15',
      sandboxMode: isSandbox,
      tldCount: tlds.length,
    });

    if (!settingsSnap.exists || !apiKey || !(exchangeRate > 0) || (Number.isFinite(parsedMarkup) && parsedMarkup < 0)) {
      throwPricingError('FIRESTORE_CONFIGURATION_ERROR', {
        documentExists: !!settingsSnap.exists,
        dynadotApiKeyConfigured: apiKey.length > 0 ? 'yes' : 'no',
        exchangeRateConfigured: Number.isFinite(exchangeRate) && exchangeRate > 0 ? 'yes' : 'no',
        markupConfigured: markupConfigured ? 'yes' : 'no',
      });
    }

    const baseUrl = isSandbox
      ? 'https://api-sandbox.dynadot.com/api3.json'
      : 'https://api.dynadot.com/api3.json';

    const uniqueTlds = [];
    const seen = new Set();
    for (const tld of tlds) {
      const normalized = normalizeTld(tld);
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      uniqueTlds.push(normalized);
    }

    if (!uniqueTlds.length) {
      throwPricingError('INVALID_TLD', 'No valid TLDs after normalization');
    }

    const results = await Promise.all(
      uniqueTlds.map(async (tld) => {
        const fetched = await fetchDynadotTldPrice(baseUrl, apiKey, tld);
        if (fetched.category) {
          console.error('[dynadotTldPricingBatch] TLD failed', { tld, category: fetched.category, httpStatus: fetched.httpStatus || null });
          return { tld, category: fetched.category };
        }
        const retailUsd = fetched.registerPriceUsd * (1 + markupPercent / 100);
        const customerPriceBdt = Math.round(retailUsd * exchangeRate);
        return {
          tld: `.${tld}`,
          customerPriceBdt,
          currency: 'BDT',
        };
      })
    );

    const systemicCategories = new Set([
      'DYNADOT_AUTHENTICATION_FAILURE',
      'DYNADOT_PERMISSION_FAILURE',
      'SANDBOX_PRODUCTION_MISMATCH',
    ]);
    const systemic = results.find((item) => item.category && systemicCategories.has(item.category));
    if (systemic) {
      throwPricingError(systemic.category, { tld: systemic.tld });
    }

    const pricing = results
      .filter((item) => !item.category && item.customerPriceBdt > 0)
      .map(({ tld, customerPriceBdt, currency }) => ({ tld, customerPriceBdt, currency }));

    if (!pricing.length) {
      const firstFailure = results.find((item) => item.category);
      throwPricingError(firstFailure?.category || 'INTERNAL_FUNCTION_EXCEPTION', {
        failedTlds: results.map((item) => ({ tld: item.tld, category: item.category || null })),
      });
    }

    return {
      success: true,
      pricing,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throwPricingError('INTERNAL_FUNCTION_EXCEPTION', error?.message);
  }
});

exports.getDomainRenewalPrice = functions.https.onCall(async (data, context) => {
  try {
    const payload = data.data || data;
    const domain = payload.domain;
    
    if (!domain) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing domain parameter');
    }

    const db = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277');
    const settingsSnap = await db.collection('settings').doc('api_keys').get();
    const apiKey = settingsSnap.exists ? settingsSnap.data()?.dynadotApiKey : null;
    const isSandbox = settingsSnap.exists ? settingsSnap.data()?.isSandboxMode === true : false;
    const apiKeysData = settingsSnap.exists ? settingsSnap.data() : {};
    const exchangeRate = parseFloat(apiKeysData.usdToBdtRate) || 120;
    const markupPercent = parseFloat(apiKeysData.domainMarkupPercent) || 15;

    console.log('[DomainRenewalPrice] Settings:', {
      hasApiKey: !!apiKey,
      isSandbox,
      exchangeRate,
      markupPercent,
      domain
    });

    if (!apiKey) {
      throw new functions.https.HttpsError('internal', 'Domain API key not configured.');
    }

    const baseUrl = isSandbox ? 'https://api-sandbox.dynadot.com/api3.json' : 'https://api.dynadot.com/api3.json';
    
    const tldMatch = domain.match(/\.[^.]+$/);
    const tld = tldMatch ? tldMatch[0] : '';
    
    if (!tld) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid domain format');
    }

    console.log('[DomainRenewalPrice] Domain:', domain, 'TLD:', tld);

    const tldUrl = `${baseUrl}?key=${apiKey}&command=tld_price&tld=${encodeURIComponent(tld)}&currency=USD`;
    const tldResponse = await fetch(tldUrl);
    
    if (!tldResponse.ok) {
      throw new functions.https.HttpsError('internal', `Dynadot API HTTP Error ${tldResponse.status}`);
    }
    
    const tldText = await tldResponse.text();
    let tldData;
    try { 
      tldData = JSON.parse(tldText); 
    } catch(e) { 
      throw new functions.https.HttpsError('internal', 'Failed to parse Dynadot TLD pricing response.');
    }

    

    const tldPriceArray = 
      tldData?.TldPriceResponse?.TldPrice ||
      tldData?.TLDPricing?.TldPrice ||
      tldData?.TldPrice ||
      (Array.isArray(tldData) ? tldData : null);

    if (!tldPriceArray || !Array.isArray(tldPriceArray)) {
      throw new functions.https.HttpsError('not-found', `TLD pricing not available for ${tld}`);
    }

    const matchedTld = tldPriceArray.find(
      item => item?.Tld?.toLowerCase() === tld.toLowerCase()
    );

    if (!matchedTld) {
      throw new functions.https.HttpsError('not-found', `TLD ${tld} not found in Dynadot pricing`);
    }

    const renewPriceUsd = parseFloat(matchedTld.Price?.Renew || matchedTld.Price?.renew || 0);
    
    console.log('[DomainRenewalPrice] Matched TLD:', JSON.stringify(matchedTld));
    console.log('[DomainRenewalPrice] Renew price USD:', renewPriceUsd);

    if (renewPriceUsd <= 0) {
      throw new functions.https.HttpsError('not-found', `Renewal price not available for ${tld}`);
    }

    const retailUsd = renewPriceUsd * (1 + markupPercent / 100);
    const priceUsd = Math.round(retailUsd * 100) / 100;
    const priceBdt = Math.round(retailUsd * exchangeRate);

    const maxDuration = matchedTld.MaxDuration || matchedTld.maxDuration || 10;

    console.log('[DomainRenewalPrice] Calculated:', {
      renewPriceUsd,
      retailUsd,
      priceUsd,
      priceBdt,
      maxDuration
    });

    return {
      success: true,
      domain,
      tld,
      renewalPriceBdt: priceBdt,
      maxDuration: parseInt(maxDuration),
      discountPercent: parseFloat(apiKeysData.domainRenewalDiscountPercent) || 0,
    };

  } catch (error) {
    console.error('Domain Renewal Price Error:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to fetch renewal price.');
  }
});

exports.getDomainRenewalPriceBreakdown = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('unauthenticated', 'Admin access required');
  }

  try {
    const { domain } = data;
    
    if (!domain) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing domain parameter');
    }

    const db = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277');
    const settingsSnap = await db.collection('settings').doc('api_keys').get();
    const apiKey = settingsSnap.exists ? settingsSnap.data()?.dynadotApiKey : null;
    const isSandbox = settingsSnap.exists ? settingsSnap.data()?.isSandboxMode === true : false;
    const apiKeysData = settingsSnap.exists ? settingsSnap.data() : {};
    const exchangeRate = parseFloat(apiKeysData.usdToBdtRate) || 120;
    const markupPercent = parseFloat(apiKeysData.domainMarkupPercent) || 15;

    if (!apiKey) {
      throw new functions.https.HttpsError('internal', 'Domain API key not configured.');
    }

    const baseUrl = isSandbox ? 'https://api-sandbox.dynadot.com/api3.json' : 'https://api.dynadot.com/api3.json';
    
    const tldMatch = domain.match(/\.[^.]+$/);
    const tld = tldMatch ? tldMatch[0] : '';
    
    if (!tld) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid domain format');
    }

    const tldUrl = `${baseUrl}?key=${apiKey}&command=tld_price&tld=${encodeURIComponent(tld)}&currency=USD`;
    const tldResponse = await fetch(tldUrl);
    
    if (!tldResponse.ok) {
      throw new functions.https.HttpsError('internal', `Dynadot API HTTP Error ${tldResponse.status}`);
    }
    
    const tldText = await tldResponse.text();
    let tldData;
    try { 
      tldData = JSON.parse(tldText); 
    } catch(e) { 
      throw new functions.https.HttpsError('internal', 'Failed to parse Dynadot TLD pricing response.');
    }

    const tldPriceArray = 
      tldData?.TldPriceResponse?.TldPrice ||
      tldData?.TLDPricing?.TldPrice ||
      tldData?.TldPrice ||
      (Array.isArray(tldData) ? tldData : null);

    if (!tldPriceArray || !Array.isArray(tldPriceArray)) {
      throw new functions.https.HttpsError('not-found', `TLD pricing not available for ${tld}`);
    }

    const matchedTld = tldPriceArray.find(
      item => item?.Tld?.toLowerCase() === tld.toLowerCase()
    );

    if (!matchedTld) {
      throw new functions.https.HttpsError('not-found', `TLD ${tld} not found in Dynadot pricing`);
    }

    const renewPriceUsd = parseFloat(matchedTld.Price?.Renew || matchedTld.Price?.renew || 0);
    
    if (renewPriceUsd <= 0) {
      throw new functions.https.HttpsError('not-found', `Renewal price not available for ${tld}`);
    }

    const retailUsd = renewPriceUsd * (1 + markupPercent / 100);
    const priceUsd = Math.round(retailUsd * 100) / 100;
    const priceBdt = Math.round(retailUsd * exchangeRate);
    const markupAmount = retailUsd - renewPriceUsd;

    return {
      success: true,
      domain,
      tld,
      supplierPriceUsd: renewPriceUsd,
      markupPercent,
      markupAmountUsd: Math.round(markupAmount * 100) / 100,
      sellingPriceUsd: priceUsd,
      exchangeRate,
      sellingPriceBdt: priceBdt,
      isSandbox,
      discountPercent: parseFloat(apiKeysData.domainRenewalDiscountPercent) || 0,
    };

  } catch (error) {
    console.error('Domain Renewal Price Breakdown Error:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to fetch renewal price breakdown.');
  }
});

exports.createDomainRenewalOrder = functions.https.onCall(async (data, context) => {
  try {
    const { domain, renewalPeriod, customerName, customerEmail, customerPhone, paymentMethod, transactionId } = data;
    
    const missingFields = [];
    if (!domain) missingFields.push('domain');
    if (!renewalPeriod) missingFields.push('renewalPeriod');
    if (!customerName) missingFields.push('customerName');
    if (!customerEmail) missingFields.push('customerEmail');
    if (!customerPhone) missingFields.push('customerPhone');

    if (missingFields.length > 0) {
      throw new functions.https.HttpsError('invalid-argument', `Missing required fields: ${missingFields.join(', ')}`);
    }

    const db = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277');
    const settingsSnap = await db.collection('settings').doc('api_keys').get();
    const apiKey = settingsSnap.exists ? settingsSnap.data()?.dynadotApiKey : null;
    const isSandbox = settingsSnap.exists ? settingsSnap.data()?.isSandboxMode === true : false;
    const apiKeysData = settingsSnap.exists ? settingsSnap.data() : {};
    const exchangeRate = parseFloat(apiKeysData.usdToBdtRate) || 120;
    const markupPercent = parseFloat(apiKeysData.domainMarkupPercent) || 15;

    if (!apiKey) {
      throw new functions.https.HttpsError('internal', 'Domain API key not configured.');
    }

    const baseUrl = isSandbox ? 'https://api-sandbox.dynadot.com/api3.json' : 'https://api.dynadot.com/api3.json';
    
    const tldMatch = domain.match(/\.[^.]+$/);
    const tld = tldMatch ? tldMatch[0] : '';
    
    if (!tld) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid domain format');
    }

    const tldUrl = `${baseUrl}?key=${apiKey}&command=tld_price&tld=${encodeURIComponent(tld)}&currency=USD`;
    const tldResponse = await fetch(tldUrl);
    
    if (!tldResponse.ok) {
      throw new functions.https.HttpsError('internal', `Dynadot API HTTP Error ${tldResponse.status}`);
    }
    
    const tldText = await tldResponse.text();
    let tldData;
    try { 
      tldData = JSON.parse(tldText); 
    } catch(e) { 
      throw new functions.https.HttpsError('internal', 'Failed to parse Dynadot TLD pricing response.');
    }

    const tldPriceArray = 
      tldData?.TldPriceResponse?.TldPrice ||
      tldData?.TLDPricing?.TldPrice ||
      tldData?.TldPrice ||
      (Array.isArray(tldData) ? tldData : null);

    if (!tldPriceArray || !Array.isArray(tldPriceArray)) {
      throw new functions.https.HttpsError('not-found', `TLD pricing not available for ${tld}`);
    }

    const matchedTld = tldPriceArray.find(
      item => item?.Tld?.toLowerCase() === tld.toLowerCase()
    );

    if (!matchedTld) {
      throw new functions.https.HttpsError('not-found', `TLD ${tld} not found in Dynadot pricing`);
    }

    const renewPriceUsd = parseFloat(matchedTld.Price?.Renew || matchedTld.Price?.renew || 0);
    
    if (renewPriceUsd <= 0) {
      throw new functions.https.HttpsError('not-found', `Renewal price not available for ${tld}`);
    }

    const retailUsd = renewPriceUsd * (1 + markupPercent / 100);
    const priceUsd = Math.round(retailUsd * 100) / 100;
    const priceBdt = Math.round(retailUsd * exchangeRate);
    
    const discountPercent = parseFloat(apiKeysData.domainRenewalDiscountPercent) || 0;
    const discountMultiplier = renewalPeriod > 1 ? (1 - (discountPercent / 100)) : 1;
    const totalBdt = Math.round(priceBdt * renewalPeriod * discountMultiplier);

    const docType = 'INV';
    const docNumber = await generateDocumentNumber(docType);

    const orderData = {
      userId: context.auth?.uid || 'guest',
      type: 'domain_renewal',
      documentNumber: docNumber,
      domain,
      tld,
      renewalPriceBdt: priceBdt,
      renewalPeriod,
      totalBdt,
      status: 'pending_payment',
      paymentStatus: 'pending',
      renewalStatus: 'pending',
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod: paymentMethod || 'bkash',
      transactionId: transactionId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const orderRef = await addDoc(collection(db, 'domain_renewals'), orderData);

    return {
      success: true,
      orderId: orderRef.id,
      order: orderData,
    };

  } catch (error) {
    console.error('Create Domain Renewal Order Error:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to create renewal order.');
  }
});

exports.validateHostingPrice = functions.https.onCall(async (data, context) => {
  try {
    const { planId, billingCycle, licenseCostUsd } = data;
    
    if (!planId || !billingCycle || !licenseCostUsd) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: planId, billingCycle, licenseCostUsd');
    }

    const db = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277');
    const settingsSnap = await db.collection('settings').doc('api_keys').get();
    const apiKeysData = settingsSnap.exists ? settingsSnap.data() : {};
    const exchangeRate = parseFloat(apiKeysData.usdToBdtRate) || 120;
    const markupPercent = parseFloat(apiKeysData.hostingMarkupPercent) || 35;

    const calculatedMonthly = Math.round(licenseCostUsd * exchangeRate * (1 + markupPercent / 100));
    const finalPrice = billingCycle === 'yearly' ? calculatedMonthly * 10 : calculatedMonthly;

    return {
      success: true,
      planId,
      billingCycle,
      licenseCostUsd,
      exchangeRate,
      markupPercent,
      calculatedMonthly,
      finalPrice,
      currency: 'BDT',
    };

  } catch (error) {
    console.error('Hosting Price Validation Error:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to validate hosting price.');
  }
});

exports.dynadotProxy = functions.https.onCall(async (data, context) => {
  const { command, domain, extraParams } = data;
  
  if (!context.auth || context.auth.token.admin !== true) {
    throw new functions.https.HttpsError('unauthenticated', 'Admin access required for domain operations.');
  }

  if (!command || !domain) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing command or domain');
  }

  const adminCmds = ['register', 'renew', 'set_ns', 'delete'];
  if (!adminCmds.includes(command)) {
    throw new functions.https.HttpsError('invalid-argument', 'Command not allowed.');
  }

  const db = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277');

  try {
    const settingsSnap = await db.collection('settings').doc('api_keys').get();
    const apiKey = settingsSnap.exists ? settingsSnap.data()?.dynadotApiKey : null;
    const isSandbox = settingsSnap.exists ? settingsSnap.data()?.isSandboxMode === true : false;

    if (!apiKey) {
      throw new functions.https.HttpsError('internal', 'Domain action failed.');
    }

    const baseUrl = isSandbox ? 'https://api-sandbox.dynadot.com/api3.json' : 'https://api.dynadot.com/api3.json';
    let dynadotUrl = `${baseUrl}?key=${apiKey}&command=${command}&domain=${domain}`;
    
    if (extraParams && typeof extraParams === 'object') {
      for (const [k, v] of Object.entries(extraParams)) {
        dynadotUrl += `&${k}=${v}`;
      }
    }

    const response = await fetch(dynadotUrl);
    const rawText = await response.text(); 
    let apiData;
    try { apiData = JSON.parse(rawText); } catch(e) { throw new functions.https.HttpsError('internal', 'Domain action failed.'); }

    await db.collection('apiLogs').add({
      action: 'dynadot_' + command,
      domain,
      isSandbox,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      response: apiData
    });

    return apiData;
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Domain action failed.');
  }
});


exports.manageDomain = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to manage domains.');
  }

  console.log('RECEIVED DATA:', data); console.log('RECEIVED CONTEXT:', context); const { command, domain, extraParams } = data;
  const uid = context.auth.uid;

  if (!command || !domain) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing command or domain.');
  }

  // Allow only certain commands
  if (['set_ns', 'renew'].indexOf(command) === -1) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid command.');
  }

  // Verify ownership of the domain
  const dOrdersSnap = await getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').collection('domainOrders')
    .where('customerId', '==', uid)
    .where('domain', '==', domain)
    .get();

  if (dOrdersSnap.empty) {
    throw new functions.https.HttpsError('permission-denied', 'You do not own this domain.');
  }

  // Fetch API settings
  const settingsSnap = await getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').collection('settings').doc('api_keys').get();
  const apiSettings = settingsSnap.exists ? settingsSnap.data() : null;
  const apiKey = apiSettings?.dynadotApiKey;
  const isSandbox = apiSettings?.isSandboxMode === true;

  if (!apiKey) {
    throw new functions.https.HttpsError('internal', 'API key not configured.');
  }

  const baseUrl = isSandbox ? 'https://api-sandbox.dynadot.com/api3.json' : 'https://api.dynadot.com/api3.json';

  let dynadotUrl = `${actualBaseUrl}?key=${apiKey}&command=${command}&domain=${domain}`;
  
  if (extraParams && typeof extraParams === 'object') {
    for (const [k, v] of Object.entries(extraParams)) {
      dynadotUrl += `&${k}=${v}`;
    }
  }

  try {
    const response = await fetch(dynadotUrl);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('manageDomain Error:', error);
    throw new functions.https.HttpsError('internal', 'Error communicating with Dynadot API.');
  }
});








const crypto = require('crypto');

exports.cloudLinuxProxy = functions.https.onCall(async (data, context) => {
  // Only admins can interact with CloudLinux API for adding/removing licenses
  if (!context.auth || context.auth.token.admin !== true) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required for this action.');
  }

  const { method, endpoint, payload } = data;
  if (!method || !endpoint) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing HTTP method or endpoint.');
  }

  const db = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277');

  try {
    const settingsSnap = await db.collection('settings').doc('api_keys').get();
    const apiKeys = settingsSnap.exists ? settingsSnap.data() : null;
    
    const clnLogin = apiKeys?.clnLogin;
    const clnSecretKey = apiKeys?.clnSecretKey;

    if (!clnLogin || !clnSecretKey) {
      console.error('CloudLinux API keys missing in firestore');
      throw new functions.https.HttpsError('failed-precondition', 'CloudLinux credentials not configured.');
    }

    // Generate Token
    const timestamp = Math.floor(Date.now() / 1000);
    const hash = crypto.createHash('sha1').update(clnSecretKey + timestamp).digest('hex');
    const token = `${clnLogin}|${timestamp}|${hash}`;

    const baseUrl = 'https://cln.cloudlinux.com/api';
    const url = `${baseUrl}${endpoint}`;

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    if (payload && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      options.body = JSON.stringify(payload);
    }

    const response = await fetch(url, options);
    const rawText = await response.text();
    
    let apiData;
    try {
      apiData = JSON.parse(rawText);
    } catch (e) {
      console.error('CloudLinux non-JSON response:', rawText);
      throw new functions.https.HttpsError('internal', 'CloudLinux API returned invalid format.');
    }

    if (!response.ok) {
      console.error('CloudLinux API Error:', apiData);
      throw new functions.https.HttpsError('internal', apiData?.message || 'Error from CloudLinux API.');
    }

    // Log the API call
    await db.collection('apiLogs').add({
      action: 'cloudlinux_' + method.toLowerCase(),
      endpoint,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      response: apiData
    });

    return apiData;

  } catch (error) {
    console.error('CloudLinux Proxy Error:', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'CloudLinux API request failed.');
  }
});

// bKash Token Cache (simple in-memory cache for warm instances)
const bkashTokenCache = {
  token: null,
  expiresAt: 0
};

function getBkashBaseUrl(isSandbox) {
  return isSandbox ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta' : 'https://tokenized.pay.bka.sh/v1.2.0-beta';
}

async function getBkashCredentials(db) {
  const settingsSnap = await db.collection('settings').doc('api_keys').get();
  if (!settingsSnap.exists) {
    throw new functions.https.HttpsError('failed-precondition', 'Payment gateway credentials not configured.');
  }
  const data = settingsSnap.data();
  const isSandbox = data.isSandboxMode === true;
  const prefix = isSandbox ? 'sandbox_' : 'production_';
  
  return {
    appKey: data[`${prefix}bkashAppKey`] || data.bkashAppKey,
    appSecret: data[`${prefix}bkashAppSecret`] || data.bkashAppSecret,
    username: data[`${prefix}bkashUsername`] || data.bkashUsername,
    password: data[`${prefix}bkashPassword`] || data.bkashPassword,
    isSandbox,
    baseUrl: getBkashBaseUrl(isSandbox)
  };
}

async function getBkashAccessToken(db) {
  const now = Date.now();
  if (bkashTokenCache.token && now < bkashTokenCache.expiresAt) {
    return bkashTokenCache.token;
  }

  const creds = await getBkashCredentials(db);
  
  const authString = Buffer.from(`${creds.username}:${creds.password}`).toString('base64');
  
  const response = await fetch(`${creds.baseUrl}/tokenized/checkout/token/grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${authString}`,
      'X-APP-Key': creds.appKey
    },
    body: JSON.stringify({
      app_key: creds.appKey,
      app_secret: creds.appSecret
    })
  });

  const rawText = await response.text();
  let apiData;
  try {
    apiData = JSON.parse(rawText);
  } catch (e) {
    console.error('bKash non-JSON response:', rawText);
    throw new functions.https.HttpsError('internal', 'bKash API returned invalid format.');
  }

  if (!response.ok || apiData.status_code !== '0000') {
    console.error('bKash token error:', apiData);
    throw new functions.https.HttpsError('internal', apiData.status_message || 'Failed to get bKash access token.');
  }

  // Cache token (expires in ~1 hour, we refresh 5 mins before)
  bkashTokenCache.token = apiData.id_token;
  bkashTokenCache.expiresAt = now + (55 * 60 * 1000); // 55 minutes

  return bkashTokenCache.token;
}

exports.bkashGrantToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const db = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277');
  
  try {
    const token = await getBkashAccessToken(db);
    return { success: true, token };
  } catch (error) {
    console.error('bKash Grant Token Error:', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to get bKash access token.');
  }
});

exports.bkashCreatePayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const { orderId, amount, customerEmail, customerName, customerPhone } = data;
  
  if (!orderId || !amount || !customerEmail) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters: orderId, amount, customerEmail.');
  }

  const db = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277');
  
  try {
    // Verify order exists
    const orderSnap = await db.collection('orders').doc(orderId).get();
    if (!orderSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Order not found.');
    }

    const accessToken = await getBkashAccessToken(db);
    const creds = await getBkashCredentials(db);

    const response = await fetch(`${creds.baseUrl}/tokenized/checkout/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-APP-Key': creds.appKey
      },
      body: JSON.stringify({
        mode: '0011',
        payerReference: customerPhone || customerEmail,
        callbackURL: `https://e-commerce-chi-six.vercel.app/payment/return`,
        amount: amount.toString(),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: orderId
      })
    });

    const rawText = await response.text();
    let apiData;
    try {
      apiData = JSON.parse(rawText);
    } catch (e) {
      console.error('bKash create payment non-JSON:', rawText);
      throw new functions.https.HttpsError('internal', 'bKash API returned invalid format.');
    }

    if (!response.ok || apiData.status_code !== '0000') {
      console.error('bKash create payment error:', apiData);
      throw new functions.https.HttpsError('internal', apiData.status_message || 'Failed to create bKash payment.');
    }

    // Save paymentID to order
    await db.collection('orders').doc(orderId).update({
      bkashPaymentId: apiData.paymentID,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      paymentId: apiData.paymentID,
      paymentUrl: apiData.bkashURL
    };

  } catch (error) {
    console.error('bKash Create Payment Error:', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to create bKash payment.');
  }
});

exports.bkashExecutePayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const { paymentId, orderId } = data;
  
  if (!paymentId || !orderId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters: paymentId, orderId.');
  }

  const db = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277');
  
  try {
    const accessToken = await getBkashAccessToken(db);
    const creds = await getBkashCredentials(db);

    const response = await fetch(`${creds.baseUrl}/tokenized/checkout/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-APP-Key': creds.appKey
      },
      body: JSON.stringify({
        paymentID: paymentId
      })
    });

    const rawText = await response.text();
    let apiData;
    try {
      apiData = JSON.parse(rawText);
    } catch (e) {
      console.error('bKash execute payment non-JSON:', rawText);
      throw new functions.https.HttpsError('internal', 'bKash API returned invalid format.');
    }

    if (!response.ok || apiData.status_code !== '0000') {
      console.error('bKash execute payment error:', apiData);
      throw new functions.https.HttpsError('internal', apiData.status_message || 'Failed to execute bKash payment.');
    }

    // Update order with transaction details
    await db.collection('orders').doc(orderId).update({
      paymentStatus: 'paid',
      status: 'processing',
      transactionId: apiData.trxID || paymentId,
      paymentCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Log success
    await db.collection('apiLogs').add({
      action: 'bkash_payment_success',
      orderId,
      paymentId,
      trxId: apiData.trxID,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      response: apiData
    });

    return { success: true, trxId: apiData.trxID };

  } catch (error) {
    console.error('bKash Execute Payment Error:', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to execute bKash payment.');
  }
});

exports.bkashQueryPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const { paymentId, orderId } = data;
  
  if (!paymentId || !orderId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters: paymentId, orderId.');
  }

  const db = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277');
  
  try {
    const accessToken = await getBkashAccessToken(db);
    const creds = await getBkashCredentials(db);

    const response = await fetch(`${creds.baseUrl}/tokenized/checkout/payment/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-APP-Key': creds.appKey
      },
      body: JSON.stringify({
        paymentID: paymentId
      })
    });

    const rawText = await response.text();
    let apiData;
    try {
      apiData = JSON.parse(rawText);
    } catch (e) {
      console.error('bKash query payment non-JSON:', rawText);
      throw new functions.https.HttpsError('internal', 'bKash API returned invalid format.');
    }

    if (!response.ok || apiData.status_code !== '0000') {
      console.error('bKash query payment error:', apiData);
      throw new functions.https.HttpsError('internal', apiData.status_message || 'Failed to query bKash payment.');
    }

    return {
      success: true,
      status: apiData.status,
      transactionStatus: apiData.transactionStatus,
      amount: apiData.amount,
      currency: apiData.currency,
      trxId: apiData.trxID,
      merchantInvoiceNumber: apiData.merchantInvoiceNumber
    };

  } catch (error) {
    console.error('bKash Query Payment Error:', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to query bKash payment.');
  }
});

exports.bkashCallback = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  try {
    const { status, paymentId, orderId } = req.body || req.query;

    if (!orderId) {
      return res.status(400).send('Missing orderId');
    }

    const db = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277');
    const orderSnap = await db.collection('orders').doc(orderId).get();

    if (!orderSnap.exists) {
      return res.status(404).send('Order not found');
    }

    if (status === 'success' || status === 'completed') {
      // Execute payment if we have paymentId
      if (paymentId) {
        try {
          const accessToken = await getBkashAccessToken(db);
          const creds = await getBkashCredentials(db);
          
          const executeResponse = await fetch(`${creds.baseUrl}/tokenized/checkout/execute`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
              'X-APP-Key': creds.appKey
            },
            body: JSON.stringify({ paymentID: paymentId })
          });

          const rawText = await executeResponse.text();
          let executeData;
          try { executeData = JSON.parse(rawText); } catch (e) { executeData = {}; }

          if (executeData.status_code === '0000') {
            await db.collection('orders').doc(orderId).update({
              paymentStatus: 'paid',
              status: 'processing',
              transactionId: executeData.trxID || paymentId,
              paymentCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          } else {
            console.error('bKash execute failed on callback:', executeData);
          }
        } catch (e) {
          console.error('bKash execute error on callback:', e);
        }
      }
    } else {
      // Failed or cancelled - update order status
      await db.collection('orders').doc(orderId).update({
        paymentStatus: 'failed',
        status: 'cancelled',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return res.status(200).send({ message: 'Callback processed' });
  } catch (error) {
    console.error('bKash Callback Error:', error);
    return res.status(500).send('Internal Server Error');
  }
});

// Force deploy update 2

exports.testApiConnection = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can test API connections.');
  }

  const { type } = data;
  const db = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277');

  if (type === 'domain') {
    try {
      const settingsSnap = await db.collection('settings').doc('api_keys').get();
      const apiKey = settingsSnap.exists ? settingsSnap.data()?.dynadotApiKey : null;
      if (!apiKey) {
        return { success: false, message: 'Dynadot API key is not configured.' };
      }
      
      const isSandbox = settingsSnap.exists ? settingsSnap.data()?.isSandboxMode === true : false;
      const baseUrl = isSandbox ? 'https://api-sandbox.dynadot.com/api3.json' : 'https://api.dynadot.com/api3.json';
      
      const url = baseUrl + '?key=' + apiKey + '&command=search&domain0=test-click2itbd.com';
      const response = await fetch(url);
      
      if (!response.ok) {
        return { success: false, message: 'HTTP error from Dynadot API.' };
      }
      
      const rawText = await response.text();
      try {
        const apiData = JSON.parse(rawText);
        if (apiData?.ResponseCode === '0' || apiData?.SearchResponse?.ResponseCode === '0') {
          return { success: true, message: 'Connected to Dynadot successfully.' };
        } else {
          return { success: false, message: apiData?.SearchResponse?.Status || 'Dynadot returned error code.' };
        }
      } catch (e) {
        return { success: false, message: 'Invalid JSON response from Dynadot.' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  } else {
    try {
      const hostingSnap = await db.collection('settings').doc('hostingApiConfig').get();
      const config = hostingSnap.data();
      
      if (!config || !config.hostingApiKey || !config.hostingApiUrl) {
        return { success: false, message: 'WHM API key or URL is not configured.' };
      }

      const url = config.hostingApiUrl + '/json-api/version';
      const response = await fetch(url, {
        headers: { 'Authorization': 'whm root:' + config.hostingApiKey }
      });
      
      if (response.ok) {
        return { success: true, message: 'Connected to WHM server successfully.' };
      } else {
        return { success: false, message: 'WHM connection failed: ' + response.statusText };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
});

exports.manageHosting = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required.');
  }

  const { action, providerAccountId, params = {} } = data;
  if (!action || !providerAccountId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing action or providerAccountId.');
  }

  const validActions = ['suspendacct', 'unsuspendacct', 'killacct', 'accountsummary'];
  if (!validActions.includes(action)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid action.');
  }

  const db = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277');
  const hostingSnap = await db.collection('settings').doc('hostingApiConfig').get();
  const config = hostingSnap.data();

  if (!config || !config.hostingApiKey || !config.hostingApiUrl) {
    throw new functions.https.HttpsError('failed-precondition', 'WHM API key or URL is not configured.');
  }

  const apiUrl = config.hostingApiUrl.replace(/\/$/, '');
  const url = new URL(apiUrl + '/' + action);
  url.searchParams.set('api.version', '1');
  url.searchParams.set('user', providerAccountId);
  
  if (action === 'killacct') {
    url.searchParams.set('preserve_dns', '1');
  }

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': 'whm root:' + config.hostingApiKey,
        'Accept': 'application/json',
      }
    });

    const rawText = await response.text();
    let resData;
    try {
      resData = JSON.parse(rawText);
    } catch (e) {
      throw new Error('Invalid WHM response: ' + rawText);
    }

    if (!response.ok || resData?.metadata?.result?.message) {
      const message = resData?.metadata?.result?.message || 'WHM API error: ' + response.statusText;
      throw new Error(message);
    }

    return { success: true, data: resData };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message || 'Hosting operation failed.');
  }
});
exports.adminApiConfig = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required.');
  }

  const { method, payload } = data;
  const db = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277');
  const docRef = db.collection('settings').doc('api_keys');

  const secretFields = [
    'dynadotApiKey', 'hostingApiKey', 'whmApiToken', 'resendApiKey',
    'bkashAppKey', 'bkashAppSecret', 'bkashUsername', 'bkashPassword',
    'sandbox_bkashAppKey', 'sandbox_bkashAppSecret', 'sandbox_bkashUsername', 'sandbox_bkashPassword',
    'production_bkashAppKey', 'production_bkashAppSecret', 'production_bkashUsername', 'production_bkashPassword',
    'clnSecretKey', 'smtpPassword', 'smsApiKey', 'whatsappAccessToken'
  ];

  if (method === 'GET') {
    const snap = await docRef.get();
    const currentData = snap.exists ? snap.data() : {};
    const sanitized = { ...currentData };

    for (const key of Object.keys(sanitized)) {
      if (secretFields.includes(key)) {
        const value = sanitized[key];
        if (typeof value === 'string' && value.length > 0) {
          sanitized[key] = '****************' + value.slice(-4);
        }
      }
    }
    return sanitized;
  } 
  
  if (method === 'POST') {
    const snap = await docRef.get();
    const existing = snap.exists ? snap.data() : {};
    const updates = { ...payload };

    for (const key of Object.keys(updates)) {
      if (secretFields.includes(key)) {
        const value = updates[key];
        if (typeof value === 'string' && value.startsWith('****************')) {
          updates[key] = existing[key];
        }
      }
    }

    await docRef.set(updates, { merge: true });
    return { success: true };
  }

  throw new functions.https.HttpsError('invalid-argument', 'Invalid method');
});

exports.sendEmail = functions.https.onCall(async (data, context) => {
  const { to, subject, html } = data;

  if (!to || !subject || !html) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing to, subject, or html.');
  }

  const db = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277');
  const settingsSnap = await db.collection('settings').doc('api_keys').get();
  const apiKeys = settingsSnap.exists ? settingsSnap.data() : null;

  if (!apiKeys || !apiKeys.resendApiKey) {
    throw new functions.https.HttpsError('failed-precondition', 'Email service not configured.');
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKeys.resendApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Star Tech <onboarding@resend.dev>',
        to: Array.isArray(to) ? to : [to],
        subject,
        html
      })
    });

    const resData = await response.json();

    if (!response.ok) {
      throw new Error(resData.message || 'Resend API error');
    }

    return { success: true, data: resData };
  } catch (error) {
    console.error('Send Email Error:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to send email.');
  }
});
