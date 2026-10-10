const fs = require('fs');
let code = fs.readFileSync('backend/src/providers/domain/OpenproviderDomainProvider.ts', 'utf8');

const privacyMethod = `
  async updateWhoisPrivacy(domain: string, isEnabled: boolean): Promise<{ success: boolean; error?: string }> {
    const domainObj = this.splitDomain(domain);
    await this.authenticate();
    try {
      await this.fetchApi(\`/domains/\${domainObj.name}/\${domainObj.extension}\`, {
        method: 'PUT',
        body: JSON.stringify({ is_whois_privacy_enabled: isEnabled })
      });
      return { success: true };
    } catch (error: any) {
      console.error('[Openprovider] updateWhoisPrivacy error:', error);
      return { success: false, error: error.message };
    }
  }
`;

if (!code.includes('updateWhoisPrivacy')) {
  code = code.replace("async updateDomainLock", privacyMethod + "\n  async updateDomainLock");
  fs.writeFileSync('backend/src/providers/domain/OpenproviderDomainProvider.ts', code);
}
