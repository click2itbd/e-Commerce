const fs = require('fs');
let code = fs.readFileSync('functions/index.js', 'utf8');

const newFunc = `exports.dynadotSearchProxy = functions.https.onCall(async (data, context) => {
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

    if (!apiKey) {
      throw new functions.https.HttpsError('internal', 'Domain API key not configured.');
    }

    const baseUrl = isSandbox ? 'https://api-sandbox.dynadot.com/api3.json' : 'https://api.dynadot.com/api3.json';
    const dynadotUrl = \`\${baseUrl}?key=\${apiKey}&command=search&domain0=\${domain}\`;

    const response = await fetch(dynadotUrl);
    if (!response.ok) {
      throw new Error(\`HTTP Error \${response.status}\`);
    }
    const rawText = await response.text(); 
    
    let apiData;
    try { 
      apiData = JSON.parse(rawText); 
    } catch(e) { 
      throw new functions.https.HttpsError('internal', 'Failed to parse JSON response from Dynadot.'); 
    }

    const publicConfigSnap = await db.collection('settings').doc('public_config').get();
    const rate = publicConfigSnap.exists ? (parseFloat(publicConfigSnap.data().usdToBdtRate) || 120) : 120;

    if (apiData?.SearchResponse?.SearchResults) {
        apiData.SearchResponse.SearchResults = apiData.SearchResponse.SearchResults.map(res => {
          const priceUsd = res.Price ? parseFloat(res.Price) : 0;
          res.priceBdt = priceUsd * rate;
          return { ...res }; // Ensure plain objects
        });
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
});`;

const startIdx = code.indexOf('exports.dynadotSearchProxy =');
const endIdx = code.indexOf('exports.dynadotProxy =');
code = code.substring(0, startIdx) + newFunc + '\n\n' + code.substring(endIdx);
fs.writeFileSync('functions/index.js', code);
