const fs = require('fs');
let code = fs.readFileSync('backend/src/providers/domain/OpenproviderDomainProvider.ts', 'utf8');

const newMethods = `
  async getDomainDetails(domain: string): Promise<any> {
    const domainObj = this.splitDomain(domain);
    await this.authenticate();
    try {
      const response = await this.fetchApi(\`/domains/\${domainObj.name}/\${domainObj.extension}?with_auth_code=true\`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('[Openprovider] getDomainDetails error:', error);
      return { success: false, error: error.message };
    }
  }

  async updateDomainLock(domain: string, isLocked: boolean): Promise<{ success: boolean; error?: string }> {
    const domainObj = this.splitDomain(domain);
    await this.authenticate();
    try {
      await this.fetchApi(\`/domains/\${domainObj.name}/\${domainObj.extension}\`, {
        method: 'PUT',
        body: JSON.stringify({ is_locked: isLocked })
      });
      return { success: true };
    } catch (error: any) {
      console.error('[Openprovider] updateDomainLock error:', error);
      return { success: false, error: error.message };
    }
  }

  async getWhois(domain: string): Promise<WhoisResult> {`;

code = code.replace("  async getWhois(domain: string): Promise<WhoisResult> {", newMethods);
fs.writeFileSync('backend/src/providers/domain/OpenproviderDomainProvider.ts', code);
