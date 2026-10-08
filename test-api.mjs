import 'dotenv/config';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize firebase admin
const serviceAccount = JSON.parse(readFileSync('./backend/firebase-service-account.json', 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function run() {
  try {
    // Mint a custom token for an admin user (replace with actual admin UID if needed, but we can just use a dummy one and set admin claims? No, isUserAdmin checks the database. Let's find an admin user UID first.)
    const usersSnap = await admin.firestore().collection('users').where('role', '==', 'admin').limit(1).get();
    if (usersSnap.empty) {
      console.log('No admin user found');
      process.exit(1);
    }
    const adminUid = usersSnap.docs[0].id;
    console.log('Found admin UID:', adminUid);

    const customToken = await admin.auth().createCustomToken(adminUid);
    
    // We need an ID token, not a custom token, to pass to the API. 
    // To get an ID token, we would need to sign in using the client SDK. 
    // Alternatively, I can just modify the route temporarily to skip auth for testing!
  } catch(e) {
    console.error(e);
  }
}
run();
