const fs = require('fs');
let code = fs.readFileSync('backend/src/providers/domain/OpenproviderDomainProvider.ts', 'utf8');

const contactMethods = `
  async createCustomerHandle(contact: any): Promise<string> {
    await this.authenticate();
    try {
      const response = await this.fetchApi('/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: {
            first_name: contact.firstName,
            last_name: contact.lastName
          },
          company_name: contact.companyName || '',
          address: {
            street: contact.address,
            city: contact.city,
            state: contact.state || contact.city,
            zipcode: contact.zipcode,
            country: contact.country || 'BD'
          },
          phone: {
            country_code: contact.phoneCountryCode || '+880',
            area_code: '',
            subscriber_number: contact.phoneNumber || ''
          },
          email: contact.email
        })
      });
      return response.data.handle;
    } catch (error: any) {
      console.error('[Openprovider] createCustomerHandle error:', error);
      throw new Error(error.message || 'Failed to create customer handle');
    }
  }

  async updateDomainContacts(domain: string, handle: string): Promise<{ success: boolean; error?: string }> {
    const domainObj = this.splitDomain(domain);
    await this.authenticate();
    try {
      await this.fetchApi(\`/domains/\${domainObj.name}/\${domainObj.extension}\`, {
        method: 'PUT',
        body: JSON.stringify({
          owner_handle: handle,
          admin_handle: handle,
          tech_handle: handle,
          billing_handle: handle
        })
      });
      return { success: true };
    } catch (error: any) {
      console.error('[Openprovider] updateDomainContacts error:', error);
      return { success: false, error: error.message };
    }
  }
`;

if (!code.includes('createCustomerHandle')) {
  code = code.replace("async updateDomainLock", contactMethods + "\n  async updateDomainLock");
  fs.writeFileSync('backend/src/providers/domain/OpenproviderDomainProvider.ts', code);
}
