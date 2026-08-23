import { Request, Response, NextFunction } from 'express';
import { getAdminDb } from '../firebase/admin';
import { getApps } from 'firebase-admin';

function isDevWithoutServiceAccount(): boolean {
  return process.env.NODE_ENV !== 'production' && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
}

function decodeDevToken(idToken: string): any {
  try {
    const payload = idToken.split('.')[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function requireFirebaseAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization token' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  if (isDevWithoutServiceAccount()) {
    const decoded = decodeDevToken(idToken);
    if (decoded?.user_id || decoded?.sub) {
      (req as any).user = { uid: decoded.user_id || decoded.sub, email: decoded.email || '' };
      return next();
    }
    return res.status(401).json({ error: 'Invalid token format' });
  }

  try {
    const adminInstance = getApps()[0] as any;
    if (!adminInstance) {
      throw new Error('Firebase Admin not initialized');
    }
    const decodedToken = await adminInstance.auth().verifyIdToken(idToken);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization token' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  if (isDevWithoutServiceAccount()) {
    const decoded = decodeDevToken(idToken);
    if (decoded?.user_id || decoded?.sub) {
      (req as any).user = { uid: decoded.user_id || decoded.sub, email: decoded.email || '' };
      const db = getAdminDb();
      const userDoc = db.collection('users').doc(decoded.user_id || decoded.sub);
      const snap = await userDoc.get();
      if (snap.exists && snap.data()?.role === 'admin') {
        return next();
      }
      return res.status(403).json({ error: 'Admin access required' });
    }
    return res.status(401).json({ error: 'Invalid token format' });
  }

  try {
    const adminInstance = getApps()[0] as any;
    if (!adminInstance) {
      throw new Error('Firebase Admin not initialized');
    }
    const decodedToken = await adminInstance.auth().verifyIdToken(idToken);
    (req as any).user = decodedToken;

    const db = getAdminDb();
    const userDoc = db.collection('users').doc(decodedToken.uid);
    const snap = await userDoc.get();
    if (snap.exists && snap.data()?.role === 'admin') {
      return next();
    }

    return res.status(403).json({ error: 'Admin access required' });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
