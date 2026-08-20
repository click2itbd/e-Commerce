const fs = require('fs');
let fn = fs.readFileSync('functions/index.js', 'utf8');

const newFn = `exports.dynadotProxy = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to use this service.');
  }

  const { command, domain, extraParams } = data;
  if (!command || !domain) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing command or domain');
  }

  const adminCmds = ['register', 'renew', 'set_ns', 'delete'];
  if (adminCmds.includes(command)) {
    if (context.auth.token.admin !== true) {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required for this action.');
    }
  } else if (command !== 'search') {
    throw new functions.https.HttpsError('invalid-argument', 'Command not allowed.');
  }

  const db = getFirestore('ai-studio-422fbad2-d827-4e69-8599-aed85390d277');

  try {
    const settingsSnap = await db.collection('settings').doc('api_keys').get();
    const apiKey = settingsSnap.exists ? settingsSnap.data()?.dynadotApiKey : null;
    const isSandbox = settingsSnap.exists ? settingsSnap.data()?.isSandboxMode === true : false;

    if (!apiKey) {
      console.error('Dynadot API key missing in firestore api_keys document');
      throw new functions.https.HttpsError('internal', 'Domain search failed, please try again.');
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
    try { 
      apiData = JSON.parse(rawText); 
    } catch(e) { 
      console.error('JSON PARSE ERROR - RAW RESPONSE:', rawText, e); 
      throw new functions.https.HttpsError('internal', 'Domain search failed, please try again.');
    }

    if (command === 'search') {
      const publicConfigSnap = await db.collection('settings').doc('public_config').get();
      const rate = publicConfigSnap.exists ? (parseFloat(publicConfigSnap.data().usdToBdtRate) || 120) : 120;

      if (apiData?.SearchResponse?.SearchResults) {
         apiData.SearchResponse.SearchResults = apiData.SearchResponse.SearchResults.map(res => {
           const priceUsd = res.Price ? parseFloat(res.Price) : 0;
           res.priceBdt = priceUsd * rate;
           return res;
         });
      }
    }

    if (command === 'register') {
      await db.collection('apiLogs').add({
        action: 'dynadot_register',
        domain,
        isSandbox,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        response: apiData
      });
    }

    return apiData;

  } catch (error) {
    console.error('Dynadot Proxy Error:', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Domain search failed, please try again.');
  }
});

exports.manageDomain`;

fn = fn.replace(/exports\.dynadotProxy = functions\.https\.onRequest\([\s\S]*?exports\.manageDomain/, newFn);
fs.writeFileSync('functions/index.js', fn);
console.log('done2');
