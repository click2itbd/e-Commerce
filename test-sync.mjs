import 'dotenv/config';
import { getDomainProvider } from './backend/src/providers/providerFactory.js';
import { OpenproviderDomainProvider } from './backend/src/providers/domain/OpenproviderDomainProvider.js';

async function test() {
  try {
    const config = {
      domainApiType: 'openprovider',
      domainApiKey: process.env.OPENPROVIDER_USERNAME,
      openproviderPassword: process.env.OPENPROVIDER_PASSWORD
    };
    
    // Test provider factory
    console.log('Testing provider factory...');
    const provider = getDomainProvider(config);
    
    if (!provider.getTldPricing) {
      throw new Error('Provider missing getTldPricing');
    }
    
    console.log('Fetching pricing for .com...');
    const result = await provider.getTldPricing('com');
    console.log('Result:', result);
  } catch (e) {
    console.error('Error occurred:', e);
  }
}
test();
