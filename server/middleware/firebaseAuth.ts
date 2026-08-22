import admin from 'firebase-admin';
import { Request, Response, NextFunction } from "express";
import { getAdminDb } from '../admin';

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
      req.user = { uid: decoded.user_id || decoded.sub, email: decoded.email || '' } as any;
      return next();
    }
    return res.status(401).json({ error: 'Invalid token format' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
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
      req.user = { uid: decoded.user_id || decoded.sub, email: decoded.email || '', admin: decoded.admin } as any;
      
      // In local dev without a service account, we cannot query Firestore.
      // We assume the local developer has admin rights to avoid blocking them.
      return next();
    }
    return res.status(401).json({ error: 'Invalid token format' });
  }

  try {
    getAdminDb();
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;

    // First check custom claim to avoid DB query if possible
    if (decodedToken.admin === true) {
      return next();
    }

    const isAdmin = await checkAdminRole(decodedToken.uid);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function checkAdminRole(uid: string): Promise<boolean> {
  try {
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      return data?.role === 'admin';
    }
    return false;
  } catch (error) {
    console.error('Failed to check admin role:', error);
    return false;
  }
}
