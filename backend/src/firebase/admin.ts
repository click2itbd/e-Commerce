import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let adminDb: ReturnType<typeof getFirestore> | null = null;
let adminAuth: ReturnType<typeof getAuth> | null = null;
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
  if (initializationFailed && !adminDb) {
    throw new Error('Firebase Admin SDK is not available.');
  }

  if (!adminDb) {
    let app = getApps()[0];
    if (!app) {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
      let serviceAccount: any = null;

      if (serviceAccountKey) {
        if (serviceAccountKey.endsWith('.json') || serviceAccountKey.startsWith('.') || serviceAccountKey.includes('/') || serviceAccountKey.includes('\\')) {
          // It's a file path. Check candidate locations
          const candidatePaths = [
            path.isAbsolute(serviceAccountKey) ? serviceAccountKey : path.resolve(process.cwd(), serviceAccountKey),
            path.resolve(__dirname, '..', '..', serviceAccountKey),
            path.resolve(__dirname, '..', '..', '..', serviceAccountKey),
          ];
          const foundPath = candidatePaths.find(p => fs.existsSync(p));
          if (foundPath) {
            try {
              console.log('[Firebase Admin] Reading service account key from file:', foundPath);
              const fileContent = fs.readFileSync(foundPath, 'utf8');
              serviceAccount = JSON.parse(fileContent);
              validateServiceAccountStructure(serviceAccount);
            } catch (err) {
              console.warn('[Firebase Admin] Could not parse service account file:', err);
              serviceAccount = null;
            }
          } else {
            console.log(`[Firebase Admin] Service account file "${serviceAccountKey}" not on disk. Using cloud environment credentials.`);
          }
        } else {
          // Raw JSON string
          try {
            serviceAccount = JSON.parse(serviceAccountKey);
            validateServiceAccountStructure(serviceAccount);
          } catch (err) {
            console.warn('[Firebase Admin] Invalid JSON in FIREBASE_SERVICE_ACCOUNT_KEY:', err);
            serviceAccount = null;
          }
        }
      }

      try {
        if (serviceAccount) {
          app = initializeApp({ credential: cert(serviceAccount) });
        } else {
          const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'gen-lang-client-0990631330';
          app = initializeApp({ projectId });
        }
      } catch (error: any) {
        if (getApps().length > 0) {
          app = getApps()[0];
        } else {
          initializationFailed = true;
          console.error('[Firebase Admin] Failed to initialize Firebase Admin SDK:', error);
          throw new Error('Failed to initialize Firebase Admin SDK.');
        }
      }
    }

    const dbId = process.env.FIREBASE_DATABASE_ID || process.env.FIRESTORE_DATABASE_ID || 'ai-studio-422fbad2-d827-4e69-8599-aed85390d277';
    try {
      adminDb = getFirestore(app, dbId);
    } catch {
      adminDb = getFirestore(app);
    }
  }
  return adminDb;
}

export function getAdminAuth() {
  getAdminDb();
  if (!adminAuth) {
    const app = getApps()[0];
    adminAuth = app ? getAuth(app) : getAuth();
  }
  return adminAuth;
}

export function isAdminDbAvailable(): boolean {
  if (initializationFailed) return false;
  return Boolean(adminDb || getApps().length > 0);
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

export async function isUserAdmin(uid: string, email?: string): Promise<boolean> {
  if (!uid && !email) return false;
  if (email && email.toLowerCase() === 'click2itbd@gmail.com') return true;
  try {
    const db = getAdminDb();
    if (uid) {
      const userDoc = db.collection('users').doc(uid);
      const snap = await userDoc.get();
      if (snap.exists) {
        const data = snap.data();
        const role = data?.role;
        if (role === 'admin' || role === 'manager' || role === 'staff' || data?.isAdmin === true) {
          return true;
        }
        if (Array.isArray(data?.permissions) && (
          data.permissions.includes('manage_services') ||
          data.permissions.includes('manage_settings') ||
          data.permissions.includes('manage_finances') ||
          data.permissions.includes('manage_orders')
        )) {
          return true;
        }
      }
    }
    // Check if email matches any admin user in users collection
    if (email) {
      const userSnap = await db.collection('users').where('email', '==', email.toLowerCase()).limit(1).get();
      if (!userSnap.empty) {
        const data = userSnap.docs[0].data();
        const role = data?.role;
        if (role === 'admin' || role === 'manager' || role === 'staff' || data?.isAdmin === true) {
          return true;
        }
      }
    }
    // In development mode, if user is authenticated with a valid token, allow admin access
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }
    return false;
  } catch (error) {
    console.error('[Firebase Admin] Failed to check admin status:', error);
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }
    return false;
  }
}
