import 'dotenv/config';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./backend/firebase-service-account.json', 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

import { getDomainPricingSettings, calculateCustomerPriceBdt } from './backend/src/services/domainPricing';

async function test() {
  const settings = await getDomainPricingSettings();
  console.log('Settings:', settings);
  const cost = 10.99;
  const bdt = calculateCustomerPriceBdt(cost, settings);
  console.log('USD:', cost, '=> BDT:', bdt);
}
test();
