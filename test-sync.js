require('dotenv').config({ path: './backend/.env' });
const { OpenproviderDomainProvider } = require('./backend/dist/providers/domain/OpenproviderDomainProvider.js');
const provider = new OpenproviderDomainProvider(process.env.OPENPROVIDER_USERNAME, process.env.OPENPROVIDER_PASSWORD, process.env.OPENPROVIDER_SANDBOX_MODE === 'true');

async function test() {
  try {
    const res = await provider.getTldPricing('com');
    console.log(res);
  } catch (e) {
    console.error('Error:', e);
  }
}
test();
