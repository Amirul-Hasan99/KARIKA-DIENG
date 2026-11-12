import { initializeApp, getApps, getApp, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

let adminApp: App | null = null;
let adminDb: Firestore | null = null;
let adminAuth: Auth | null = null;

function initFirebaseAdmin() {
  if (getApps().length > 0) {
    adminApp = getApp();
    adminDb = getFirestore(adminApp);
    adminAuth = getAuth(adminApp);
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, "\n") : undefined;

  try {
    if (projectId && clientEmail && privateKey) {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      adminDb = getFirestore(adminApp);
      adminAuth = getAuth(adminApp);
    } else {
      // Without credentials, keep adminDb null so that serverless environments (Vercel)
      // do not attempt Google Cloud Application Default Credentials (ADC) lookup.
      adminApp = null;
      adminDb = null;
      adminAuth = null;
    }
  } catch (error) {
    console.warn("Firebase Admin initialized in local memory mode:", error);
    adminApp = null;
    adminDb = null;
    adminAuth = null;
  }
}

initFirebaseAdmin();

export { adminApp, adminDb, adminAuth };
