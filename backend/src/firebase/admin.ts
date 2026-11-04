import { initializeApp as initAdminApp, getApps as getAdminApps, cert } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuthSdk } from 'firebase-admin/auth';
import { initializeApp as initClientApp, getApps as getClientApps } from 'firebase/app';
import { 
  initializeFirestore, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  writeBatch 
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let adminDb: any = null;
let adminAuth: any = null;
let clientAdapterDb: any = null;
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

function getFirebaseClientConfig(): any {
  const candidatePaths = [
    path.resolve(process.cwd(), 'firebase-applet-config.json'),
    path.resolve(__dirname, '..', '..', 'firebase-applet-config.json'),
    path.resolve(__dirname, '..', '..', '..', 'firebase-applet-config.json')
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch (err) {
        console.warn('[Firebase] Error reading config from', p, err);
      }
    }
  }

  return {
    projectId: process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0990631330',
    firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || process.env.FIRESTORE_DATABASE_ID || 'ai-studio-422fbad2-d827-4e69-8599-aed85390d277'
  };
}

function wrapDocSnapshot(snap: any) {
  const exists = typeof snap.exists === 'function' ? snap.exists() : Boolean(snap.exists);
  const data = exists ? snap.data() : undefined;
  return {
    id: snap.id,
    exists,
    data: () => data,
    get: (field: string) => data?.[field],
    ref: wrapDocRef(snap.ref)
  };
}

function wrapDocRef(rawRef: any) {
  return {
    id: rawRef.id,
    path: rawRef.path,
    _webDocRef: rawRef,
    get: async () => wrapDocSnapshot(await getDoc(rawRef)),
    set: async (data: any, opts?: any) => setDoc(rawRef, data, opts || {}),
    update: async (data: any) => updateDoc(rawRef, data),
    delete: async () => deleteDoc(rawRef)
  };
}

class QueryAdapter {
  protected ref: any;
  protected constraints: any[];

  constructor(ref: any, constraints: any[] = []) {
    this.ref = ref;
    this.constraints = constraints;
  }

  where(field: string, op: any, val: any) {
    return new QueryAdapter(this.ref, [...this.constraints, where(field, op, val)]);
  }

  orderBy(field: string, dir: 'asc' | 'desc' = 'asc') {
    return new QueryAdapter(this.ref, [...this.constraints, orderBy(field, dir)]);
  }

  limit(n: number) {
    return new QueryAdapter(this.ref, [...this.constraints, limit(n)]);
  }

  async get() {
    const q = query(this.ref, ...this.constraints);
    const snap = await getDocs(q);
    const docs = snap.docs.map(wrapDocSnapshot);
    return {
      empty: snap.empty,
      size: snap.size,
      docs,
      forEach: (cb: (doc: any) => void) => docs.forEach(cb)
    };
  }
}

class CollectionAdapter extends QueryAdapter {
  private name: string;
  private webDb: any;

  constructor(name: string, webDb: any) {
    const colRef = collection(webDb, name);
    super(colRef, []);
    this.name = name;
    this.webDb = webDb;
  }

  doc(id?: string) {
    const dRef = id ? doc(this.webDb, this.name, id) : doc(collection(this.webDb, this.name));
    return wrapDocRef(dRef);
  }

  async add(data: any) {
    const newDoc = doc(collection(this.webDb, this.name));
    await setDoc(newDoc, data);
    return wrapDocRef(newDoc);
  }
}

function createClientFirestoreAdapter() {
  const config = getFirebaseClientConfig();
  const clientApp = getClientApps().length > 0 
    ? getClientApps()[0] 
    : initClientApp(config, 'backend-client-adapter');
  
  const webDb = initializeFirestore(clientApp, {}, config.firestoreDatabaseId || 'ai-studio-422fbad2-d827-4e69-8599-aed85390d277');

  return {
    collection: (name: string) => new CollectionAdapter(name, webDb),
    batch: () => {
      const batch = writeBatch(webDb);
      const unwrap = (target: any) => target?._webDocRef || target?.ref?._webDocRef || target?.ref || target;
      return {
        set: (target: any, data: any, opts?: any) => batch.set(unwrap(target), data, opts || {}),
        update: (target: any, data: any) => batch.update(unwrap(target), data),
        delete: (target: any) => batch.delete(unwrap(target)),
        commit: () => batch.commit()
      };
    }
  };
}

export function getAdminDb(): any {
  // Check if a service account was provided and validated
  if (!adminDb && !clientAdapterDb) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
    let serviceAccount: any = null;

    if (serviceAccountKey) {
      if (serviceAccountKey.endsWith('.json') || serviceAccountKey.startsWith('.') || serviceAccountKey.includes('/') || serviceAccountKey.includes('\\')) {
        const candidatePaths = [
          path.isAbsolute(serviceAccountKey) ? serviceAccountKey : path.resolve(process.cwd(), serviceAccountKey),
          path.resolve(__dirname, '..', '..', serviceAccountKey),
          path.resolve(__dirname, '..', '..', '..', serviceAccountKey),
        ];
        const foundPath = candidatePaths.find(p => fs.existsSync(p));
        if (foundPath) {
          try {
            const fileContent = fs.readFileSync(foundPath, 'utf8');
            serviceAccount = JSON.parse(fileContent);
            validateServiceAccountStructure(serviceAccount);
          } catch (err) {
            console.warn('[Firebase Admin] Could not parse service account file:', err);
            serviceAccount = null;
          }
        }
      } else {
        try {
          serviceAccount = JSON.parse(serviceAccountKey);
          validateServiceAccountStructure(serviceAccount);
        } catch {
          serviceAccount = null;
        }
      }
    }

    if (!serviceAccount) {
      const defaultPaths = [
        path.resolve(process.cwd(), 'firebase-service-account.json'),
        path.resolve(__dirname, '..', '..', 'firebase-service-account.json'),
        path.resolve(__dirname, '..', '..', '..', 'firebase-service-account.json'),
        '/home/click2itbd/backend_app/firebase-service-account.json',
      ];
      const foundPath = defaultPaths.find(p => fs.existsSync(p));
      if (foundPath) {
        try {
          const fileContent = fs.readFileSync(foundPath, 'utf8');
          serviceAccount = JSON.parse(fileContent);
          validateServiceAccountStructure(serviceAccount);
          console.log('[Firebase Admin] Loaded service account from:', foundPath);
        } catch (err) {
          console.warn('[Firebase Admin] Could not parse default service account file:', err);
          serviceAccount = null;
        }
      }
    }

    if (!serviceAccount) {
      // Robust built-in service account fallback so the production server never fails Firestore rules
      serviceAccount = {
        type: "service_account",
        project_id: "gen-lang-client-0990631330",
        private_key_id: "46a8c425f107e8c262715c3f3406a617b4c8c01b",
        private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCZQO1G5qphdfpu\nZ9BFbsrlO7J/35DeYDLBZilbK7CEIFC0KEJoakL6ofkoqhht+mBm2sGYqYVwLTNC\nDKo0nCcSciDXcG7KhPdkE4VdNM6h3xJfW4ukNDB6oUGpgC+dlmRPIlsj2m8f2KD8\nfw7ByFQgmgYOTIFvhQI9Uk6hEhbCYAOziC5gx8IPM0MRNaVbDjTEraX8fvM/eF01\nRHc3o4nb6b39nIIJNbMuVWSWpkmD2RVMAql+rylqTjVqOCqaFoSxRQ/Cb1meVZPN\nHgp1XdZVq8tKgIFkjPYINDxu5WunUjjemvqqB2gH17la5tgKbnm3/XoTewj6lDhV\naZlXTbZ5AgMBAAECggEAMcsYLRC2LCtmfmfJkj2wu7FdSlHr4mzUIOVeK4qy9AMB\n5b8s8HsSHxfwegdmH5mZp+GMxFrUCcIN5PhzdtuDkGk3hXg47yErtj7ndoS5XHu7\nnvMCGIyCcd2iFX4aOnQKTHHnter7bxf2GoP32fuKZftVW2D9LyxCsYTkGk5jyaxi\n02U+yM+ho5/f095mbAVVVw4Tjr2g+l2ib+7LW1rJXqi0H7lAKBo6RSxXHsTzZuEj\n8WwYN+7TncK5vhKx0H3zPIH4dZwapKFUlbKa2ACqErMmZV2cHgS4lXMJspZgx/vM\nxK/zNmcrPm4myArfjunL51HY17oSgGtq0YLezhanRwKBgQDL1fZ8xrEk6RJwGZN3\n5OwYKUTVEJoR7xiCyFKLCznY9KLX/86QHWCFmGG7jpqXNvPobhNA8uC6pl4vMg5i\nibPftNQy6FMRAAkvkVa0cdmgqimI8UvZtunEeMtqiuqHX0C5DGVrBWUafdfdFNZj\nsKiNdHuN7tN/IBMmpgdHvYjs2wKBgQDAeSOEk8DmgcBKWOkQgBWzQv9S4uYm4cXG\noTpUjPOORf6zQGX4ZabNkdUxHkMna0mWwP8n9hD1U1lpvNTpDq/eMH1Uk5qkf0G7\nJkMf58lcoudx6Lk9HyxkfcJQL1LlysBbVUmPyHr4PRTCSOrxeIpS5d+o1al3IPBM\nQ+zWbNdgOwKBgAp3SPmtJglUIks5NPYx/eFbtRoPiSmkkiic6ogTInw+S2I100BZ\nEcyqP1JnBw7+llV32Ws7TUioJCveMRjkIyU4XrDidulnjBEyMDaBpf/23L0YTqG2\nH5ij7yXgThx3SpZ1yXtOQpuynHPQjxV9S5o/wdxOx/M+DV2tprALTk2DAoGAbvmp\nw/hZQc7QK03mW7AuUuSvSIAxCXwlx6gQdM2sZHzxJTNdWAJsUZzjGmYDfEf87yIq\nPEVBc+Hx7OiGrjXcqzS0Hr7YbD4/jQO7sjq3vGTlI6V2oMpHk017azZOCtaDYGXl\nezSxyk2VmYvngwDoaHHIKpW/F0PzqVWEygGJkR8CgYEAjHX+vG7i0oVnM278/knu\nB7X28+HdmZbQ0xaNO0YFU6y0OUSx6ue8JJxqTnn+K05Kd7O2gVRDtT0FqENpoJDF\nHaIyBqLGl8OO5+FLEPhx2WEu44FmkSYVrrM7yg8P+kV1Y3qH6hAjV5QE6OcODvYR\np7Z0coM3FH0QQZiQmV1PTNk=\n-----END PRIVATE KEY-----\n",
        client_email: "firebase-adminsdk-fbsvc@gen-lang-client-0990631330.iam.gserviceaccount.com",
        client_id: "114818038547971951107",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40gen-lang-client-0990631330.iam.gserviceaccount.com",
        universe_domain: "googleapis.com"
      };
    }

    if (serviceAccount) {
      try {
        let app = getAdminApps()[0];
        if (!app) {
          app = initAdminApp({ credential: cert(serviceAccount) });
        }
        const dbId = process.env.FIREBASE_DATABASE_ID || process.env.FIRESTORE_DATABASE_ID || 'ai-studio-422fbad2-d827-4e69-8599-aed85390d277';
        adminDb = getAdminFirestore(app, dbId);
        return adminDb;
      } catch (err) {
        console.warn('[Firebase Admin] Falling back to Web SDK adapter:', err);
      }
    }

    // Fallback: Initialize Firestore Client SDK adapter (100% full read/write via client config)
    try {
      clientAdapterDb = createClientFirestoreAdapter();
      return clientAdapterDb;
    } catch (adapterErr) {
      console.error('[Firebase Admin] Failed to initialize Firestore adapter:', adapterErr);
      initializationFailed = true;
      throw adapterErr;
    }
  }

  return adminDb || clientAdapterDb;
}

export function getAdminAuth() {
  if (!adminAuth) {
    let app = getAdminApps()[0];
    if (!app) {
      // Attempt to initialize Admin SDK via getAdminDb() first
      try {
        getAdminDb();
      } catch {
        // Ignore DB init error here, check if app was created
      }
      app = getAdminApps()[0];
    }
    if (!app) {
      // Initialize with projectId so verifyIdToken can verify Google public keys even without a service account file
      const config = getFirebaseClientConfig();
      try {
        app = initAdminApp({
          projectId: process.env.GOOGLE_CLOUD_PROJECT || config.projectId,
        });
      } catch {
        app = getAdminApps()[0];
      }
    }
    if (app) {
      try {
        adminAuth = getAdminAuthSdk(app);
      } catch {
        adminAuth = null;
      }
    }
  }
  return adminAuth;
}

export function isAdminDbAvailable(): boolean {
  if (initializationFailed) return false;
  if (adminDb || clientAdapterDb) return true;
  try {
    const db = getAdminDb();
    return Boolean(db);
  } catch {
    return false;
  }
}

export async function getAdminDocument(collectionName: string, docId: string) {
  const db = getAdminDb();
  const docRef = db.collection(collectionName).doc(docId);
  const snap = await docRef.get();
  if (snap.exists) {
    return { exists: true, data: snap.data() };
  }
  return { exists: false, data: null };
}

export async function setAdminDocument(collectionName: string, docId: string, data: any) {
  const db = getAdminDb();
  const docRef = db.collection(collectionName).doc(docId);
  await docRef.set(data);
}

const OFFICIAL_SUPER_ADMIN_EMAILS = new Set([
  'click2itbd@gmail.com',
  'admin@click2itbd.com',
  'info@click2itbd.com',
  'muntasiralamresti@gmail.com',
]);

/**
 * Checks whether the user is a primary/super Administrator (`role === 'admin'` or `isAdmin === true`).
 * General `staff` accounts do NOT pass this check unless they explicitly hold `manage_settings`.
 */
export async function isUserAdmin(uid: string, email?: string): Promise<boolean> {
  if (!uid && !email) return false;
  const cleanEmail = (email || '').toLowerCase().trim();
  if (OFFICIAL_SUPER_ADMIN_EMAILS.has(cleanEmail)) return true;
  try {
    const db = getAdminDb();
    if (uid) {
      const userDoc = db.collection('users').doc(uid);
      const snap = await userDoc.get();
      if (snap.exists) {
        const data = snap.data();
        const role = data?.role;
        if (role === 'admin' || data?.isAdmin === true) {
          return true;
        }
        if (Array.isArray(data?.permissions) && data.permissions.includes('manage_settings')) {
          return true;
        }
      }
    }
    if (email) {
      const userSnap = await db.collection('users').where('email', '==', cleanEmail).limit(1).get();
      if (!userSnap.empty) {
        const data = userSnap.docs[0].data();
        const role = data?.role;
        if (role === 'admin' || data?.isAdmin === true) {
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    console.error('[Firebase Admin] Failed to check admin status:', error);
    return false;
  }
}

/**
 * Checks whether the user is an Admin OR an authorized Staff/Manager member.
 * Optional `requiredPermission` enforces granular staff permission (e.g. 'manage_orders', 'manage_services', 'manage_finances').
 */
export async function isStaffOrAdmin(
  uid: string,
  email?: string,
  requiredPermission?: 'manage_orders' | 'manage_services' | 'manage_finances' | 'manage_settings'
): Promise<boolean> {
  if (await isUserAdmin(uid, email)) return true;
  if (!uid && !email) return false;

  try {
    const db = getAdminDb();
    let data: any = null;

    if (uid) {
      const snap = await db.collection('users').doc(uid).get();
      if (snap.exists) data = snap.data();
    }
    if (!data && email) {
      const userSnap = await db.collection('users').where('email', '==', email.toLowerCase().trim()).limit(1).get();
      if (!userSnap.empty) data = userSnap.docs[0].data();
    }
    if (!data) return false;

    const role = data.role;
    const perms: string[] = Array.isArray(data.permissions) ? data.permissions : [];

    if (requiredPermission) {
      return (role === 'manager' || role === 'staff') && perms.includes(requiredPermission);
    }

    if (role === 'manager' || role === 'staff') {
      return true;
    }

    return (
      perms.includes('manage_services') ||
      perms.includes('manage_settings') ||
      perms.includes('manage_finances') ||
      perms.includes('manage_orders')
    );
  } catch (error) {
    console.error('[Firebase Admin] Failed to check staff/admin status:', error);
    return false;
  }
}
