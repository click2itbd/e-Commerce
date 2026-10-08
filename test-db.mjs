import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./backend/firebase-service-account.json', 'utf8'));
initializeApp({
  credential: cert(serviceAccount)
});

async function run() {
  const db = getFirestore();
  const doc = await db.collection('settings').doc('api_keys').get();
  console.log('API Keys Settings:', doc.data());
}
run();
