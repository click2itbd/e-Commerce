const fs = require('fs');
let file = fs.readFileSync('functions/index.js', 'utf8');

const newFunction = `
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
    const token = \`\${clnLogin}|\${timestamp}|\${hash}\`;

    const baseUrl = 'https://cln.cloudlinux.com/api';
    const url = \`\${baseUrl}\${endpoint}\`;

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${token}\`
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
`;

file = file + '\n' + newFunction;
fs.writeFileSync('functions/index.js', file);
