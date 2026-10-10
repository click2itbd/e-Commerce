const fs = require('fs');
let code = fs.readFileSync('backend/src/providers/domain/OpenproviderDomainProvider.ts', 'utf8');

const newMethods = `
  async getDnsZone(domain: string): Promise<any> {
    await this.authenticate();
    try {
      const response = await this.fetchApi(\`/dns/zones/\${domain}?with_records=true\`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('[Openprovider] getDnsZone error:', error);
      return { success: false, error: error.message };
    }
  }

  async updateDnsRecords(domain: string, records: any[]): Promise<{ success: boolean; error?: string }> {
    await this.authenticate();
    try {
      await this.fetchApi(\`/dns/zones/\${domain}\`, {
        method: 'PUT',
        body: JSON.stringify({ records })
      });
      return { success: true };
    } catch (error: any) {
      console.error('[Openprovider] updateDnsRecords error:', error);
      return { success: false, error: error.message };
    }
  }

  async getDomainDetails(domain: string): Promise<any> {`;

if (!code.includes('getDnsZone(')) {
  code = code.replace("  async getDomainDetails(domain: string): Promise<any> {", newMethods);
  fs.writeFileSync('backend/src/providers/domain/OpenproviderDomainProvider.ts', code);
}
