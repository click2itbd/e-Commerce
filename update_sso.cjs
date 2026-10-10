const fs = require('fs');

// 1. IHostingProvider.ts
let iProv = fs.readFileSync('backend/src/providers/hosting/IHostingProvider.ts', 'utf8');
if (!iProv.includes('createLoginSession')) {
  iProv = iProv.replace('changePlan(providerAccountId: string, newPlanCode: string): Promise<void>;', 'changePlan(providerAccountId: string, newPlanCode: string): Promise<void>;\n  createLoginSession?(providerAccountId: string): Promise<string>;');
  fs.writeFileSync('backend/src/providers/hosting/IHostingProvider.ts', iProv);
}

// 2. cpanelHostingProvider.ts
let cProv = fs.readFileSync('backend/src/providers/hosting/CpanelHostingProvider.ts', 'utf8');
const createLoginSessionStr = `
  async createLoginSession(providerAccountId: string): Promise<string> {
    if (!providerAccountId) {
      throw new ProviderError('validation_error', 'Provider account ID is required');
    }

    try {
      const result = await this.whmRequest('create_user_session', {
        api.version: '1', // WHM v1 api for this endpoint
        user: providerAccountId,
        service: 'cpaneld'
      });
      // Wait, whmRequest translates params to form-urlencoded, but the key is 'api.version'. 
      // Actually, create_user_session is a UAPI / WHM API 1 endpoint. 
      // It's api.version=1.
      
      const url = result?.data?.url || result?.metadata?.url || result?.url;
      // Depending on whmRequest response wrapping
      return url;
    } catch (error: any) {
      throw new ProviderError('whm_api_error', error.message || 'Failed to create cPanel login session');
    }
  }
`;
// Let me verify whmRequest syntax.
// `whmRequest` in CpanelHostingProvider actually takes `command`, `params`.
// The command `create_user_session` in WHM API 1 returns `data: { url: ... }`.
// Wait, the param key is `api.version`. JS object syntax `api.version` is invalid without quotes. Let me fix the string.

let fixedCreateLoginSessionStr = `
  async createLoginSession(providerAccountId: string): Promise<string> {
    if (!providerAccountId) {
      throw new ProviderError('validation_error', 'Provider account ID is required');
    }

    try {
      const result = await this.whmRequest('create_user_session', {
        'api.version': '1',
        user: providerAccountId,
        service: 'cpaneld'
      });
      
      const url = result?.data?.url || (result?.metadata && result.metadata.url) || (result?.data && result.data.cp_security_token ? \`\${this.apiUrl.split('/json-api')[0]}/login/?session=\${result.data.session}&login=\${result.data.cp_security_token}\` : null);
      if (!url) {
        // If WHM returns success but url is nested
        if (result?.data && result.data.url) return result.data.url;
        throw new Error('Failed to generate session URL from WHM');
      }
      return url;
    } catch (error: any) {
      throw new ProviderError('whm_api_error', error.message || 'Failed to create cPanel login session');
    }
  }
`;

if (!cProv.includes('createLoginSession')) {
  cProv = cProv.replace('async suspendAccount(providerAccountId: string): Promise<void> {', fixedCreateLoginSessionStr + '\n  async suspendAccount(providerAccountId: string): Promise<void> {');
  fs.writeFileSync('backend/src/providers/hosting/CpanelHostingProvider.ts', cProv);
}

// 3. services/hosting.ts
let serv = fs.readFileSync('backend/src/services/hosting.ts', 'utf8');
const servSessionStr = `
export async function createHostingLoginSession(providerAccountId: string): Promise<string> {
  const { provider } = await getHostingProviderWithSettings();
  if (!provider.createLoginSession) {
    throw new Error('This hosting provider does not support automated SSO login.');
  }
  return provider.createLoginSession(providerAccountId);
}
`;
if (!serv.includes('createHostingLoginSession')) {
  serv += '\n' + servSessionStr;
  fs.writeFileSync('backend/src/services/hosting.ts', serv);
}
