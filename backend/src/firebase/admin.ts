import { initializeApp, getApps, cert } from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let adminDb: ReturnType<typeof getFirestore> | null = null;
let initializationFailed = false;

export function validateServiceAccountStructure(serviceAccount: any): void {
  if (!serviceAccount || typeof serviceAccount !== 'object') {
    throw new Error('Invalid Firebase service account key format.');
  }

  const requiredFields = [
    'type',
    'project_id',
    'private_key_id',
    'private_key',
    'client_email',
    'client_id',
    'auth_uri',
    'token_uri',
    'auth_provider_x509_cert_url',
    'client_x509_cert_url',
  ];

  for (const field of requiredFields) {
    if (!(field in serviceAccount) || typeof serviceAccount[field] !== 'string' || serviceAccount[field].trim() === '') {
      throw new Error('Invalid Firebase service account key format.');
    }
  }

  if (serviceAccount.type !== 'service_account') {
    throw new Error('Invalid Firebase service account key format.');
  }

  if (!serviceAccount.private_key.includes('-----BEGIN PRIVATE KEY-----') || !serviceAccount.private_key.includes('-----END PRIVATE KEY-----')) {
    throw new Error('Invalid Firebase service account key format.');
  }
}

export function getAdminDb() {
  if (initializationFailed) {
    throw new Error('Firebase Admin SDK is not available. Configure FIREBASE_SERVICE_ACCOUNT_KEY.');
  }

  if (!adminDb) {
    if (getApps().length === 0) {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();

      if (serviceAccountKey) {
        try {
          let serviceAccount: any;
          if (serviceAccountKey.endsWith('.json') || serviceAccountKey.startsWith('.') || serviceAccountKey.includes('/') || serviceAccountKey.includes('\\')) {
            // It's a file path. Resolve it relative to backend root
            const absolutePath = path.isAbsolute(serviceAccountKey)
              ? serviceAccountKey
              : path.resolve(__dirname, '..', '..', serviceAccountKey);
            console.log('[Firebase Admin] Reading service account key from file:', absolutePath);
            const fileContent = fs.readFileSync(absolutePath, 'utf8');
            serviceAccount = JSON.parse(fileContent);
          } else {
            // It's raw JSON string
            serviceAccount = JSON.parse(serviceAccountKey);
          }
          validateServiceAccountStructure(serviceAccount);
          initializeApp({ credential: cert(serviceAccount) });
        } catch (error) {
          initializationFailed = true;
          console.error('[Firebase Admin] Failed to initialize Firebase Admin SDK:', error);
          throw new Error('Invalid Firebase service account key. Check FIREBASE_SERVICE_ACCOUNT_KEY format.');
        }
      } else {
        initializationFailed = true;
        console.warn('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_KEY is not set. Firestore Admin features will be unavailable.');
      }
    }
    const dbId = process.env.FIREBASE_DATABASE_ID || process.env.FIRESTORE_DATABASE_ID;
    adminDb = dbId ? getFirestore(dbId) : getFirestore();
  }
  return adminDb;
}

export function isAdminDbAvailable(): boolean {
  if (initializationFailed) return false;
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  return Boolean(key && key.length > 10);
}

export async function getAdminDocument(collection: string, docId: string) {
  const db = getAdminDb();
  const docRef = db.collection(collection).doc(docId);
  const snap = await docRef.get();
  if (snap.exists) {
    return { exists: true, data: snap.data() };
  }
  return { exists: false, data: null };
}

export async function setAdminDocument(collection: string, docId: string, data: any) {
  const db = getAdminDb();
  const docRef = db.collection(collection).doc(docId);
  await docRef.set(data);
}

export async function isUserAdmin(uid: string): Promise<boolean> {
  try {
    const db = getAdminDb();
    const userDoc = db.collection('users').doc(uid);
    const snap = await userDoc.get();
    if (snap.exists) {
      const data = snap.data();
      return data?.role === 'admin';
    }
    return false;
  } catch (error) {
    console.error('[Firebase Admin] Failed to check admin status:', error);
    return false;
  }
}
