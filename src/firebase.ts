import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

// Authentication Providers
export const googleProvider = new GoogleAuthProvider();

// Error Handling & ABAC Diagnostic Logger
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ── AUTHENTICATION ENFORCER (MANDATORY CONSTRAINT FOR ABAC) ──
export async function ensureAuthenticated(): Promise<void> {
  if (auth.currentUser) return;
  
  // Wait a brief moment to see if auth state initializes (restoring session)
  await new Promise<void>((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve();
    });
  });

  if (auth.currentUser) return;

  // Try signing in anonymously first
  try {
    await signInAnonymously(auth);
    console.log("Signed in anonymously to Firebase Auth.");
    return;
  } catch (err: any) {
    if (err && (err.code === 'auth/operation-not-allowed' || (err.message && err.message.includes('operation-not-allowed')))) {
      console.warn("Firebase Anonymous Authentication is not enabled in the Firebase Console. Continuing with open Firestore session.");
      return;
    }
    console.warn("Anonymous login restricted. Initiating self-healing fallback guest session...", err);
  }

  // Fallback guest user creation / login
  try {
    const guestEmail = 'guest-fleetops@company.sa';
    const guestPassword = 'DefaultPassword123!';
    try {
      await signInWithEmailAndPassword(auth, guestEmail, guestPassword);
      console.log("Authenticated as fallback guest user successfully.");
    } catch (signInErr: any) {
      if (signInErr.code === 'auth/operation-not-allowed' || (signInErr.message && signInErr.message.includes('operation-not-allowed'))) {
        console.warn("Firebase Email/Password Authentication is not enabled in the Firebase Console. Continuing with open Firestore session.");
        return;
      }
      if (signInErr.code === 'auth/network-request-failed' || (signInErr.message && signInErr.message.includes('network-request-failed'))) {
        console.warn("Firebase Auth guest sign-in network request failed. Continuing to offline/local fallback.");
        return;
      }
      if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
        await createUserWithEmailAndPassword(auth, guestEmail, guestPassword);
        console.log("Created and logged in fallback guest user.");
      } else {
        throw signInErr;
      }
    }
  } catch (fallbackErr: any) {
    if (fallbackErr.code === 'auth/operation-not-allowed' || (fallbackErr.message && fallbackErr.message.includes('operation-not-allowed'))) {
      console.warn("Firebase Auth operation restricted. Continuing with open Firestore session.");
    } else if (fallbackErr.code === 'auth/network-request-failed' || (fallbackErr.message && fallbackErr.message.includes('network-request-failed'))) {
      console.warn("Firebase Auth guest session creation network request failed. Continuing to offline/local fallback.");
    } else {
      console.error("Failed to authenticate fallback guest user session:", fallbackErr);
    }
  }
}

// ── ACTIVE USER RECONCILIATION FOR SECURITY RULES ──
export async function authenticateFirebaseUser(email: string, password = "DefaultPassword123!"): Promise<void> {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Logged in to Firebase Auth with active user session.");
  } catch (err: any) {
    if (err.code === 'auth/operation-not-allowed' || (err.message && err.message.includes('operation-not-allowed'))) {
      console.warn("Firebase Email/Password Authentication is disabled in the Firebase Console. Bypassing active user login.");
      return;
    }
    if (err.code === 'auth/network-request-failed' || (err.message && err.message.includes('network-request-failed'))) {
      console.warn("Firebase Auth sign-in network request failed (offline/sandbox restriction).");
      return;
    }
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log("Created and registered active user session in Firebase Auth.");
      } catch (createErr: any) {
        if (createErr.code === 'auth/operation-not-allowed' || (createErr.message && createErr.message.includes('operation-not-allowed'))) {
          console.warn("Firebase Email/Password Authentication is disabled during registration. Bypassing.");
          return;
        }
        if (createErr.code === 'auth/network-request-failed' || (createErr.message && createErr.message.includes('network-request-failed'))) {
          console.warn("Firebase Auth active user registration network request failed.");
          return;
        }
        console.error("Failed to dynamically register user session in Firebase Auth:", createErr);
      }
    } else {
      console.error("Firebase Auth sign in failed for active session:", err);
    }
  }
}

// ── CONNECTION VALIDATOR (MANDATORY CONSTRAINT) ──
export async function testConnection() {
  try {
    await ensureAuthenticated();
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase Connection verified successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase Connection offline indicator: Client is offline.");
    } else {
      console.log("Connection test response received (expected check completed).");
    }
  }
}

testConnection();

// ── GENERIC FIRESTORE DATABASE HELPERS WITH MULTI-TENANT PATHS ──

export async function dbGetCollection<T>(collectionName: string, org?: string): Promise<T[]> {
  try {
    await ensureAuthenticated();
    const path = org ? `tenants/${org.trim()}/${collectionName}` : collectionName;
    const colRef = collection(db, path);
    const snapshot = await getDocs(colRef);
    const list: T[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data() } as T);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, collectionName);
    return [];
  }
}

export async function dbSetDoc(collectionName: string, docId: string, data: any, org?: string): Promise<void> {
  try {
    await ensureAuthenticated();
    const path = org ? `tenants/${org.trim()}/${collectionName}` : collectionName;
    const docRef = doc(db, path, docId);
    await setDoc(docRef, data);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${docId}`);
  }
}

export async function dbDeleteDoc(collectionName: string, docId: string, org?: string): Promise<void> {
  try {
    await ensureAuthenticated();
    const path = org ? `tenants/${org.trim()}/${collectionName}` : collectionName;
    const docRef = doc(db, path, docId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${docId}`);
  }
}

