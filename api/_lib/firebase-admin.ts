import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

let app: App;
let db: Firestore;
let adminAuth: Auth;

function init() {
  if (getApps().length > 0) {
    app = getApps()[0];
  } else {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
      throw new Error(
        'Missing FIREBASE_SERVICE_ACCOUNT env var. ' +
        'Go to Firebase Console > Project Settings > Service Accounts > Generate New Private Key, ' +
        'then paste the entire JSON as the env var value in Vercel.',
      );
    }
    const serviceAccount = JSON.parse(raw);
    app = initializeApp({ credential: cert(serviceAccount) });
  }
  db = getFirestore(app);
  adminAuth = getAuth(app);
}

init();

export { db, adminAuth };
