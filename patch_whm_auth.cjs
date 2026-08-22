const fs = require('fs');

// ============================================================
// PATCH 1: functions/index.js
// Fix 1: testApiConnection WHM section
//   - Fix URL from /listaccts → /json-api/listaccts
//   - Fix auth header from `whm ${key}` → `whm ${username}:${key}`
//   - Read hostingApiUsername from Firestore config
// Fix 2: manageHosting WHM section
//   - Use hostingApiUsername from config (falls back to 'root')
// ============================================================
let indexJs = fs.readFileSync('functions/index.js', 'utf8');

// Fix 1a: URL path in testApiConnection
indexJs = indexJs.replace(
  "const url = new URL(`${baseUrl}/listaccts`);",
  "const username = config.hostingApiUsername ? config.hostingApiUsername.trim() : 'root';\n" +
  "          const url = new URL('/json-api/listaccts', baseUrl + '/');"
);

// Fix 1b: Auth header in testApiConnection (currently: `whm ${config.hostingApiKey}`)
indexJs = indexJs.replace(
  "'Authorization': `whm ${config.hostingApiKey}`,\n              'Accept': 'application/json',\n            },\n            signal: controller.signal,",
  "'Authorization': `whm ${username}:${config.hostingApiKey}`,\n              'Accept': 'application/json',\n            },\n            signal: controller.signal,"
);

// Fix 2: manageHosting auth header (currently: 'whm root:' + config.hostingApiKey)
// Make it use hostingApiUsername from config
indexJs = indexJs.replace(
  "'Authorization': 'whm root:' + config.hostingApiKey,",
  "'Authorization': 'whm ' + (config.hostingApiUsername || 'root') + ':' + config.hostingApiKey,"
);

fs.writeFileSync('functions/index.js', indexJs);
console.log('✅ functions/index.js patched.');

// ============================================================
// PATCH 2: server/providers/hosting/CpanelHostingProvider.ts
// Add hostingApiUsername support so the server-side provider
// also uses the correct `whm username:token` auth format.
// ============================================================
let provider = fs.readFileSync('server/providers/hosting/CpanelHostingProvider.ts', 'utf8');

// Update class fields and constructor
provider = provider.replace(
  `export class CpanelHostingProvider implements IHostingProvider {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiKey: string, apiUrl?: string) {
    if (!apiKey) {
      throw new Error('WHM API token is required');
    }
    if (!apiUrl) {
      throw new Error('WHM API URL is required. Expected format: https://your-whm-server.com:2087');
    }
    this.apiKey = apiKey;
    this.apiUrl = apiUrl.replace(/\\/$/, '');
  }`,
  `export class CpanelHostingProvider implements IHostingProvider {
  private apiUrl: string;
  private apiKey: string;
  private apiUsername: string;

  constructor(apiKey: string, apiUrl?: string, apiUsername?: string) {
    if (!apiKey) {
      throw new Error('WHM API token is required');
    }
    if (!apiUrl) {
      throw new Error('WHM API URL is required. Expected format: https://your-whm-server.com:2087');
    }
    this.apiKey = apiKey;
    this.apiUrl = apiUrl.replace(/\\/$/, '');
    this.apiUsername = (apiUsername || 'root').trim();
  }`
);

// Fix URL construction: /action → /json-api/action
provider = provider.replace(
  "const url = new URL(`${this.apiUrl}/${action}`);",
  "const url = new URL(`/json-api/${action}`, this.apiUrl + '/');"
);

// Fix auth header: `whm ${this.apiKey}` → `whm ${this.apiUsername}:${this.apiKey}`
provider = provider.replace(
  "'Authorization': `whm ${this.apiKey}`,",
  "'Authorization': `whm ${this.apiUsername}:${this.apiKey}`,"
);

fs.writeFileSync('server/providers/hosting/CpanelHostingProvider.ts', provider);
console.log('✅ CpanelHostingProvider.ts patched.');

// ============================================================
// PATCH 3: server/providers/providerFactory.ts
// Pass hostingApiUsername when constructing CpanelHostingProvider
// ============================================================
let factory = fs.readFileSync('server/providers/providerFactory.ts', 'utf8');

factory = factory.replace(
  "export function getHostingProvider(config: { hostingApiType: string; hostingApiKey?: string; hostingApiUrl?: string }): IHostingProvider {",
  "export function getHostingProvider(config: { hostingApiType: string; hostingApiKey?: string; hostingApiUrl?: string; hostingApiUsername?: string }): IHostingProvider {"
);

factory = factory.replace(
  "return new CpanelHostingProvider(config.hostingApiKey, config.hostingApiUrl);",
  "return new CpanelHostingProvider(config.hostingApiKey, config.hostingApiUrl, config.hostingApiUsername);"
);

fs.writeFileSync('server/providers/providerFactory.ts', factory);
console.log('✅ providerFactory.ts patched.');

// ============================================================
// PATCH 4: server/routes/hosting.ts
// Pass hostingApiUsername from config to getHostingProvider
// ============================================================
let routes = fs.readFileSync('server/routes/hosting.ts', 'utf8');

// Update getHostingConfig return type to include username
routes = routes.replace(
  "return result.data as { hostingApiType?: string; hostingApiKey?: string; hostingApiUrl?: string };",
  "return result.data as { hostingApiType?: string; hostingApiKey?: string; hostingApiUrl?: string; hostingApiUsername?: string };"
);

// Update all getHostingProvider calls to pass username
routes = routes.replace(
  /getHostingProvider\(\{ hostingApiType: config\.hostingApiType \|\| 'dummy', hostingApiKey: config\.hostingApiKey, hostingApiUrl: config\.hostingApiUrl \}\)/g,
  "getHostingProvider({ hostingApiType: config.hostingApiType || 'dummy', hostingApiKey: config.hostingApiKey, hostingApiUrl: config.hostingApiUrl, hostingApiUsername: config.hostingApiUsername })"
);

// Also fix test-connection route
routes = routes.replace(
  "const provider = getHostingProvider({\n      hostingApiType: config.hostingApiType,\n      hostingApiKey: config.hostingApiKey,\n      hostingApiUrl: config.hostingApiUrl,\n    });",
  "const provider = getHostingProvider({\n      hostingApiType: config.hostingApiType,\n      hostingApiKey: config.hostingApiKey,\n      hostingApiUrl: config.hostingApiUrl,\n      hostingApiUsername: (config as any).hostingApiUsername,\n    });"
);

fs.writeFileSync('server/routes/hosting.ts', routes);
console.log('✅ server/routes/hosting.ts patched.');

console.log('\n✅ ALL PATCHES APPLIED. Now update HostingApiSettings.tsx manually for the UI field.');
