import admin from 'firebase-admin';
import { Request, Response, NextFunction } from "express";
import { getAdminDb } from '../admin';

export async function requireFirebaseAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization token' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  
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
  
  try {
    getAdminDb();
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    
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
