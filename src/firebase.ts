import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

const isBrowser = typeof window !== 'undefined';
const isDev = isBrowser && window.location.hostname === 'localhost';

if (isBrowser) {
  if (isDev) {
    try {
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(firebaseConfig.appCheck?.siteKey || ''),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (e) {
      console.warn('App Check init skipped:', e);
    }
  } else {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(firebaseConfig.appCheck?.siteKey || ''),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (e) {
      console.warn('App Check init skipped:', e);
    }
  }
}

export { app };
export { firebaseConfig };
