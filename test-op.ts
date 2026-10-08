import 'dotenv/config';
import { config } from 'dotenv';
config({ path: 'backend/.env' });
import { OpenproviderDomainProvider } from './backend/src/providers/domain/OpenproviderDomainProvider';

async function test() {
  const provider = new OpenproviderDomainProvider(
    process.env.OPENPROVIDER_USERNAME || '',
    process.env.OPENPROVIDER_PASSWORD || '',
    false // live mode
  );
  const result = await provider.getTldPricing('com');
  console.log('Result:', JSON.stringify(result, null, 2));
}
test();
