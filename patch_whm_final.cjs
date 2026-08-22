const fs = require('fs');
let content = fs.readFileSync('functions/index.js', 'utf8');

// Find the testApiConnection export and replace the entire thing
const startMarker = '// Force deploy update 2\n\nexports.testApiConnection = functions.https.onCall(async (data, context) => {';
const endMarker = 'exports.manageHosting = functions.https.onCall(async (data, context) => {';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1) {
  console.log('❌ startMarker not found');
  process.exit(1);
}
if (endIdx === -1) {
  console.log('❌ endMarker not found');
  process.exit(1);
}

const newTestApiConnection = `// Force deploy update 2

exports.testApiConnection = functions.https.onCall(async (data, context) => {
  try {
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
      // Hosting / WHM test
      try {
        const hostingSnap = await db.collection('settings').doc('hostingApiConfig').get();
        const config = hostingSnap.data();
        
        if (!config || !config.hostingApiKey || !config.hostingApiUrl) {
          return { success: false, message: 'WHM API key or URL is not configured.' };
        }

        const baseUrl = config.hostingApiUrl.replace(/\\/$/, '');
        const username = config.hostingApiUsername ? config.hostingApiUsername.trim() : 'root';
        const url = new URL('/json-api/listaccts', baseUrl + '/');
        url.searchParams.set('api.version', '1');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        let response;
        try {
          response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
              'Authorization': \`whm \${username}:\${config.hostingApiKey}\`,
              'Accept': 'application/json',
            },
            signal: controller.signal,
          });
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            return { success: false, message: 'WHM connection timed out after 15 seconds. Verify server URL, port 2087, firewall, and API token.' };
          }
          const msg = String(fetchError.message || '');
          if (msg.includes('self-signed certificate') || msg.includes('unable to verify the first certificate') || msg.includes('CERT_HAS_EXPIRED')) {
            return { success: false, message: 'WHM server TLS/SSL certificate error. The server may be using a self-signed certificate.' };
          }
          if (msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')) {
            return { success: false, message: 'Cannot reach WHM server. Check URL, port 2087, and firewall.' };
          }
          if (msg.includes('ETIMEDOUT') || msg.includes('ESOCKETTIMEDOUT')) {
            return { success: false, message: 'WHM server connection timed out. Verify network/firewall.' };
          }
          return { success: false, message: fetchError.message || 'WHM connection test failed' };
        }

        clearTimeout(timeoutId);

        if (response.ok) {
          return { success: true, message: 'WHM connection successful.' };
        } else {
          const status = response.status;
          if (status === 401 || status === 403) {
            return { success: false, message: 'WHM authentication failed. Verify the WHM username and API token.' };
          }
          if (status === 404) {
            return { success: false, message: 'WHM API endpoint not found. Verify the WHM URL and port 2087.' };
          }
          const text = await response.text().catch(() => '');
          return { success: false, message: \`WHM connection failed: \${response.status} \${response.statusText}\${text ? ' - ' + text.slice(0, 200) : ''}\` };
        }
      } catch (error) {
        return { success: false, message: error.message || 'WHM connection test failed' };
      }
    }
  } catch (error) {
    console.error('testApiConnection unhandled error:', error);
    return { success: false, message: error.message || 'Internal server error' };
  }
});

`;

const before = content.substring(0, startIdx);
const after = content.substring(endIdx);
const newContent = before + newTestApiConnection + after;

fs.writeFileSync('functions/index.js', newContent);
console.log('✅ testApiConnection fully rewritten with correct WHM auth (username:token) and /json-api/listaccts endpoint.');
console.log(`File length: ${newContent.length} chars`);
