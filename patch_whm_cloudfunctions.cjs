const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'functions', 'index.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace the else block of testApiConnection
const oldTestApiConnectionWHM = `      try {
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
      }`;

const newTestApiConnectionWHM = `      try {
        const hostingSnap = await db.collection('settings').doc('hostingApiConfig').get();
        const config = hostingSnap.data();
        
        if (!config || !config.hostingApiKey || !config.hostingApiUrl) {
          return { success: false, message: 'WHM API URL or API token is not configured.' };
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
            return { success: false, message: 'WHM connection timed out after 15 seconds. Verify the server, port 2087, and firewall.' };
          }
          const msg = String(fetchError.message || '');
          if (msg.includes('self-signed certificate') || msg.includes('unable to verify the first certificate') || msg.includes('CERT_HAS_EXPIRED')) {
            return { success: false, message: 'Secure connection to WHM failed. Verify the server certificate and hostname.' };
          }
          if (msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')) {
            return { success: false, message: 'Could not connect to WHM. Verify the server, port 2087, and firewall.' };
          }
          if (msg.includes('ETIMEDOUT') || msg.includes('ESOCKETTIMEDOUT')) {
            return { success: false, message: 'WHM connection timed out after 15 seconds.' };
          }
          return { success: false, message: fetchError.message || 'WHM connection test failed' };
        }

        clearTimeout(timeoutId);

        if (response.ok) {
          const rawText = await response.text();
          try {
            JSON.parse(rawText);
            return { success: true, message: 'WHM connection successful.' };
          } catch(e) {
            return { success: false, message: 'WHM returned an unexpected response.' };
          }
        } else {
          const status = response.status;
          if (status === 401 || status === 403) {
            return { success: false, message: 'WHM authentication failed. Verify the WHM username and API token.' };
          }
          if (status === 404) {
            return { success: false, message: 'WHM API endpoint not found. Verify the WHM URL and port.' };
          }
          return { success: false, message: \`WHM connection failed: \${response.status} \${response.statusText}\` };
        }
      } catch (error) {
        return { success: false, message: error.message || 'WHM connection test failed' };
      }`;

// 2. Replace URL and Auth header in manageHosting
const oldManageHostingURL = `const url = new URL(apiUrl + '/' + action);`;
const newManageHostingURL = `const url = new URL('/json-api/' + action, apiUrl + '/');`;

const oldManageHostingAuth = `'Authorization': 'whm root:' + config.hostingApiKey,`;
const newManageHostingAuth = `'Authorization': 'whm ' + (config.hostingApiUsername ? config.hostingApiUsername.trim() : 'root') + ':' + config.hostingApiKey,`;

content = content.replace(oldTestApiConnectionWHM, newTestApiConnectionWHM);
content = content.replace(oldManageHostingURL, newManageHostingURL);
content = content.replace(oldManageHostingAuth, newManageHostingAuth);

fs.writeFileSync(filePath, content);
console.log('Successfully patched functions/index.js');
