const fs = require('fs');

let content = fs.readFileSync('functions/index.js', 'utf8');

const manageDomainCode = `
exports.manageDomain = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to manage domains.');
  }

  const { command, domain, extraParams } = data;
  const uid = context.auth.uid;

  if (!command || !domain) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing command or domain.');
  }

  // Allow only certain commands
  if (['set_ns', 'renew'].indexOf(command) === -1) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid command.');
  }

  // Verify ownership of the domain
  const dOrdersSnap = await admin.firestore().collection('domainOrders')
    .where('customerId', '==', uid)
    .where('domain', '==', domain)
    .get();

  if (dOrdersSnap.empty) {
    throw new functions.https.HttpsError('permission-denied', 'You do not own this domain.');
  }

  // Fetch API settings
  const settingsSnap = await admin.firestore().collection('settings').doc('api_keys').get();
  const apiSettings = settingsSnap.exists ? settingsSnap.data() : null;
  const apiKey = apiSettings?.dynadotApiKey;
  const isSandbox = apiSettings?.isSandboxMode === true;

  if (!apiKey) {
    throw new functions.https.HttpsError('internal', 'API key not configured.');
  }

  const baseUrl = isSandbox ? 'https://api.sandbox.dynadot.com/api3.json' : 'https://api.sandbox.dynadot.com/api3.json'; // wait, for testing let's just use the correct one
  const actualBaseUrl = isSandbox ? 'https://api.sandbox.dynadot.com/api3.json' : 'https://api.dynadot.com/api3.json';

  let dynadotUrl = \`\${actualBaseUrl}?key=\${apiKey}&command=\${command}&domain0=\${domain}\`;
  
  if (extraParams && typeof extraParams === 'object') {
    for (const [k, v] of Object.entries(extraParams)) {
      dynadotUrl += \`&\${k}=\${v}\`;
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
`;

if (!content.includes('exports.manageDomain =')) {
    content += '\n' + manageDomainCode;
    
    // Also, let's restrict dynadotProxy to only search
    content = content.replace("const { command, domain, extraParams } = req.body;", 
        "const { command, domain, extraParams } = req.body;\n    if (command !== 'search') {\n      return res.status(403).send({ error: 'This proxy only allows search command.' });\n    }");
        
    fs.writeFileSync('functions/index.js', content, 'utf8');
    console.log('Added manageDomain and secured dynadotProxy.');
} else {
    console.log('Already patched.');
}
