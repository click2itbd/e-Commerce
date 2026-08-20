const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

admin.initializeApp();

exports.paymentWebhook = functions.https.onRequest(async (req, res) => {
  // CORS Support
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

    if (status === "success") {
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

      // Securely update using Admin SDK (bypasses Firestore Rules)
      await targetRef.update({
        status: "processing",
        paymentStatus: "paid",
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
            const baseUrl = 'https://api-sandbox.dynadot.com/api3.json';

            if (apiKey) {

            
              for (const item of transferItems) {
                const domain = item.domain || item.id.replace('domain_transfer_', '');
                const authCode = item.authCode || '';
                
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
                  
                  // Update domainOrders document if successful
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
                      updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                  }
                  
                } catch (e) {
                  console.error('Auto-transfer failed for', domain, e);
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
                      updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                  }
                  
                } catch (e) {
                  console.error('Auto-renewal failed for', domain, e);
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
                      updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                  }
                  
                } catch (e) {
                  console.error('Auto-registration failed for', domain, e);
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
              const batch = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').batch();
              hAccountsSnap.docs.forEach(doc => {
                batch.update(doc.ref, {
                  status: 'active',
                  activatedAt: admin.firestore.FieldValue.serverTimestamp(),
                  updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
              });
              await batch.commit();

              // CloudLinux provisioning
              const settingsSnap = await getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').collection('settings').doc('api_keys').get();
              const apiKeys = settingsSnap.exists ? settingsSnap.data() : {};
              const clnLogin = apiKeys?.clnLogin;
              const clnSecretKey = apiKeys?.clnSecretKey;
              const isSandbox = apiKeys?.isSandboxMode === true;

              if (clnLogin && clnSecretKey) {
                const timestamp = Math.floor(Date.now() / 1000);
                const hash = crypto.createHash('sha1').update(clnSecretKey + timestamp).digest('hex');
                const token = `${clnLogin}|${timestamp}|${hash}`;
                const baseUrl = 'https://cln.cloudlinux.com/api';

                for (const account of hAccountsSnap.docs) {
                  const accountData = account.data();
                  const ip = accountData.ipAddress || accountData.ip;
                  const licenseType = accountData.licenseType || 1; // 1 = CloudLinux OS

                  if (!ip) {
                    console.warn('Hosting account missing IP address for CloudLinux provisioning:', account.id);
                    continue;
                  }

                  const endpoint = `/v2/ip-license/licenses?ip=${encodeURIComponent(ip)}&type=${licenseType}`;

                  if (isSandbox) {
                    console.log('[CloudLinux TEST MODE] Would provision license:', {
                      ip,
                      licenseType,
                      endpoint,
                      method: 'POST',
                      token: token.substring(0, 10) + '...'
                    });
                  } else {
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
                      } else {
                        console.log('CloudLinux provisioning success:', { ip, licenseType, response: apiData });
                      }
                    } catch (error) {
                      console.error('CloudLinux provisioning failed:', error);
                    }
                  }
                }
              } else {
                console.warn('CloudLinux credentials not configured. Skipping provisioning.');
              }

              await getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277').collection('apiLogs').add({
                action: 'hosting_provisioning_completed',
                orderId,
                accountCount: hAccountsSnap.size,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                isSandbox,
                note: isSandbox ? 'TEST MODE: Provisioning logged, not executed.' : 'Provisioning executed.'
              });
            }
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
    // In Gen2/v7, data might be a CallableRequest. We extract domain safely.
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
    const dynadotUrl = `${baseUrl}?key=${apiKey}&command=search&domain0=${domain}`;

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

    console.log('[DynadotSearchProxy] Raw Dynadot response:', JSON.stringify(apiData));

    if (apiData?.SearchResponse?.SearchResults) {
        console.log('[DynadotSearchProxy] Processing', apiData.SearchResponse.SearchResults.length, 'results');
        apiData.SearchResponse.SearchResults = apiData.SearchResponse.SearchResults.map(res => {
          const wholesaleUsd = res.Price ? parseFloat(res.Price) : 0;
          console.log('[DynadotSearchProxy] Result:', {
            domain: res.Domain || res.domain,
            Available: res.Available,
            Price: res.Price,
            wholesaleUsd,
            exchangeRate,
            markupPercent
          });
          
          if (wholesaleUsd > 0) {
            const retailUsd = wholesaleUsd * (1 + markupPercent / 100);
            res.Price = retailUsd.toFixed(2);
            res.priceBdt = Math.round(retailUsd * exchangeRate);
            console.log('[DynadotSearchProxy] Calculated price:', {
              retailUsd,
              priceBdt: res.priceBdt
            });
          } else {
            res.Price = '0';
            res.priceBdt = 0;
            console.log('[DynadotSearchProxy] Price is 0, setting priceBdt to 0');
          }

          return { ...res };
        });
    } else {
      console.log('[DynadotSearchProxy] No SearchResults found in response');
    }
    
    // Return completely serialized plain JSON object
    return JSON.parse(JSON.stringify(apiData));
  } catch (error) {
    console.error('Dynadot Search Proxy Error:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Domain search failed unexpectedly.');
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

  const baseUrl = isSandbox ? 'https://api-sandbox.dynadot.com/api3.json' : 'https://api-sandbox.dynadot.com/api3.json'; // wait, for testing let's just use the correct one
  const actualBaseUrl = isSandbox ? 'https://api-sandbox.dynadot.com/api3.json' : 'https://api-sandbox.dynadot.com/api3.json';

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
