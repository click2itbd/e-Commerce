import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

let adminDb: ReturnType<typeof getFirestore> | null = null;

export function getAdminDb() {
  if (!adminDb) {
    if (!admin.apps.length) {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      
      if (serviceAccountKey) {
        try {
          const serviceAccount = JSON.parse(serviceAccountKey);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
        } catch (error) {
          console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error);
          throw new Error('Invalid Firebase service account key');
        }
      } else {
        admin.initializeApp();
      }
    }
    adminDb = getFirestore();
  }
  return adminDb;
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
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      return data?.role === 'admin';
    }
    return false;
  } catch (error) {
    console.error('Failed to check admin status:', error);
    return false;
  }
}
