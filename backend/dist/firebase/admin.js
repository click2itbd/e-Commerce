import { initializeApp as initAdminApp, getApps as getAdminApps, cert } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuthSdk } from 'firebase-admin/auth';
import { initializeApp as initClientApp, getApps as getClientApps } from 'firebase/app';
import { initializeFirestore, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, query, where, orderBy, limit, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let adminDb = null;
let adminAuth = null;
let clientAdapterDb = null;
let initializationFailed = false;
export function validateServiceAccountStructure(serviceAccount) {
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
function getFirebaseClientConfig() {
    const candidatePaths = [
        path.resolve(process.cwd(), 'firebase-applet-config.json'),
        path.resolve(__dirname, '..', '..', 'firebase-applet-config.json'),
        path.resolve(__dirname, '..', '..', '..', 'firebase-applet-config.json')
    ];
    for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
            try {
                return JSON.parse(fs.readFileSync(p, 'utf8'));
            }
            catch (err) {
                console.warn('[Firebase] Error reading config from', p, err);
            }
        }
    }
    return {
        projectId: process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0990631330',
        firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || process.env.FIRESTORE_DATABASE_ID || 'ai-studio-422fbad2-d827-4e69-8599-aed85390d277'
    };
}
function wrapDocSnapshot(snap) {
    const exists = typeof snap.exists === 'function' ? snap.exists() : Boolean(snap.exists);
    const data = exists ? snap.data() : undefined;
    return {
        id: snap.id,
        exists,
        data: () => data,
        get: (field) => data?.[field],
        ref: wrapDocRef(snap.ref)
    };
}
function wrapDocRef(rawRef) {
    return {
        id: rawRef.id,
        path: rawRef.path,
        _webDocRef: rawRef,
        get: async () => wrapDocSnapshot(await getDoc(rawRef)),
        set: async (data, opts) => setDoc(rawRef, data, opts || {}),
        update: async (data) => updateDoc(rawRef, data),
        delete: async () => deleteDoc(rawRef)
    };
}
class QueryAdapter {
    ref;
    constraints;
    constructor(ref, constraints = []) {
        this.ref = ref;
        this.constraints = constraints;
    }
    where(field, op, val) {
        return new QueryAdapter(this.ref, [...this.constraints, where(field, op, val)]);
    }
    orderBy(field, dir = 'asc') {
        return new QueryAdapter(this.ref, [...this.constraints, orderBy(field, dir)]);
    }
    limit(n) {
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
            forEach: (cb) => docs.forEach(cb)
        };
    }
}
class CollectionAdapter extends QueryAdapter {
    name;
    webDb;
    constructor(name, webDb) {
        const colRef = collection(webDb, name);
        super(colRef, []);
        this.name = name;
        this.webDb = webDb;
    }
    doc(id) {
        const dRef = id ? doc(this.webDb, this.name, id) : doc(collection(this.webDb, this.name));
        return wrapDocRef(dRef);
    }
    async add(data) {
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
        collection: (name) => new CollectionAdapter(name, webDb),
        batch: () => {
            const batch = writeBatch(webDb);
            const unwrap = (target) => target?._webDocRef || target?.ref?._webDocRef || target?.ref || target;
            return {
                set: (target, data, opts) => batch.set(unwrap(target), data, opts || {}),
                update: (target, data) => batch.update(unwrap(target), data),
                delete: (target) => batch.delete(unwrap(target)),
                commit: () => batch.commit()
            };
        }
    };
}
export function getAdminDb() {
    // Check if a service account was provided and validated
    if (!adminDb && !clientAdapterDb) {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
        let serviceAccount = null;
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
                    }
                    catch (err) {
                        console.warn('[Firebase Admin] Could not parse service account file:', err);
                        serviceAccount = null;
                    }
                }
            }
            else {
                try {
                    serviceAccount = JSON.parse(serviceAccountKey);
                    validateServiceAccountStructure(serviceAccount);
                }
                catch {
                    serviceAccount = null;
                }
            }
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
            }
            catch (err) {
                console.warn('[Firebase Admin] Falling back to Web SDK adapter:', err);
            }
        }
        // Fallback: Initialize Firestore Client SDK adapter (100% full read/write via client config)
        try {
            clientAdapterDb = createClientFirestoreAdapter();
            return clientAdapterDb;
        }
        catch (adapterErr) {
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
            }
            catch {
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
            }
            catch {
                app = getAdminApps()[0];
            }
        }
        if (app) {
            try {
                adminAuth = getAdminAuthSdk(app);
            }
            catch {
                adminAuth = null;
            }
        }
    }
    return adminAuth;
}
export function isAdminDbAvailable() {
    if (initializationFailed)
        return false;
    if (adminDb || clientAdapterDb)
        return true;
    try {
        const db = getAdminDb();
        return Boolean(db);
    }
    catch {
        return false;
    }
}
export async function getAdminDocument(collectionName, docId) {
    const db = getAdminDb();
    const docRef = db.collection(collectionName).doc(docId);
    const snap = await docRef.get();
    if (snap.exists) {
        return { exists: true, data: snap.data() };
    }
    return { exists: false, data: null };
}
export async function setAdminDocument(collectionName, docId, data) {
    const db = getAdminDb();
    const docRef = db.collection(collectionName).doc(docId);
    await docRef.set(data);
}
const OFFICIAL_SUPER_ADMIN_EMAILS = new Set([
    'click2itbd@gmail.com',
    'admin@click2itbd.com',
    'info@click2itbd.com',
]);
/**
 * Checks whether the user is a primary/super Administrator (`role === 'admin'` or `isAdmin === true`).
 * General `staff` accounts do NOT pass this check unless they explicitly hold `manage_settings`.
 */
export async function isUserAdmin(uid, email) {
    if (!uid && !email)
        return false;
    const cleanEmail = (email || '').toLowerCase().trim();
    if (OFFICIAL_SUPER_ADMIN_EMAILS.has(cleanEmail))
        return true;
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
    }
    catch (error) {
        console.error('[Firebase Admin] Failed to check admin status:', error);
        return false;
    }
}
/**
 * Checks whether the user is an Admin OR an authorized Staff/Manager member.
 * Optional `requiredPermission` enforces granular staff permission (e.g. 'manage_orders', 'manage_services', 'manage_finances').
 */
export async function isStaffOrAdmin(uid, email, requiredPermission) {
    if (await isUserAdmin(uid, email))
        return true;
    if (!uid && !email)
        return false;
    try {
        const db = getAdminDb();
        let data = null;
        if (uid) {
            const snap = await db.collection('users').doc(uid).get();
            if (snap.exists)
                data = snap.data();
        }
        if (!data && email) {
            const userSnap = await db.collection('users').where('email', '==', email.toLowerCase().trim()).limit(1).get();
            if (!userSnap.empty)
                data = userSnap.docs[0].data();
        }
        if (!data)
            return false;
        const role = data.role;
        const perms = Array.isArray(data.permissions) ? data.permissions : [];
        if (requiredPermission) {
            return (role === 'manager' || role === 'staff') && perms.includes(requiredPermission);
        }
        if (role === 'manager' || role === 'staff') {
            return true;
        }
        return (perms.includes('manage_services') ||
            perms.includes('manage_settings') ||
            perms.includes('manage_finances') ||
            perms.includes('manage_orders'));
    }
    catch (error) {
        console.error('[Firebase Admin] Failed to check staff/admin status:', error);
        return false;
    }
}
