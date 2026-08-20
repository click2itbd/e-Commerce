const fs = require('fs');
let code = fs.readFileSync('functions/index.js', 'utf8');

const newProxies = `
exports.dynadotSearchProxy = functions.https.onCall(async (data, context) => {
  const { domain } = data;
  if (!domain) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing domain');
  }

  const db = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277');

  try {
    const settingsSnap = await db.collection('settings').doc('api_keys').get();
    const apiKey = settingsSnap.exists ? settingsSnap.data()?.dynadotApiKey : null;
    const isSandbox = settingsSnap.exists ? settingsSnap.data()?.isSandboxMode === true : false;

    if (!apiKey) {
      throw new functions.https.HttpsError('internal', 'Domain search failed, please try again.');
    }

    const baseUrl = isSandbox ? 'https://api-sandbox.dynadot.com/api3.json' : 'https://api.dynadot.com/api3.json';
    const dynadotUrl = \`\${baseUrl}?key=\${apiKey}&command=search&domain0=\${domain}\`;

    const response = await fetch(dynadotUrl);
    const rawText = await response.text(); 
    
    let apiData;
    try { apiData = JSON.parse(rawText); } catch(e) { throw new functions.https.HttpsError('internal', 'Domain search failed.'); }

    const publicConfigSnap = await db.collection('settings').doc('public_config').get();
    const rate = publicConfigSnap.exists ? (parseFloat(publicConfigSnap.data().usdToBdtRate) || 120) : 120;

    if (apiData?.SearchResponse?.SearchResults) {
        apiData.SearchResponse.SearchResults = apiData.SearchResponse.SearchResults.map(res => {
          const priceUsd = res.Price ? parseFloat(res.Price) : 0;
          res.priceBdt = priceUsd * rate;
          return res;
        });
    }
    return apiData;
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Domain search failed, please try again.');
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
    let dynadotUrl = \`\${baseUrl}?key=\${apiKey}&command=\${command}&domain0=\${domain}\`;
    
    if (extraParams && typeof extraParams === 'object') {
      for (const [k, v] of Object.entries(extraParams)) {
        dynadotUrl += \`&\${k}=\${v}\`;
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
`;

// use a more robust replacement by replacing everything between exports.dynadotProxy and exports.manageDomain
const startIdx = code.indexOf('exports.dynadotProxy =');
const endIdx = code.indexOf('exports.manageDomain =');
code = code.substring(0, startIdx) + newProxies + '\n\n' + code.substring(endIdx);
fs.writeFileSync('functions/index.js', code);
