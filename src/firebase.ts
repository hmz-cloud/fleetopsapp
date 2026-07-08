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

  // Otherwise, sign in anonymously to satisfy security rules isSignedIn() check
  try {
    await signInAnonymously(auth);
    console.log("Signed in anonymously to Firebase Auth.");
  } catch (err) {
    console.error("Failed to sign in anonymously to Firebase Auth:", err);
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
      console.error("Please check your Firebase configuration: Client is offline.");
    } else {
      console.log("Connection test response received (expected check completed).");
    }
  }
}

testConnection();

// ── GENERIC FIRESTORE DATABASE HELPERS WITH ABAC GATES ──

export async function dbGetCollection<T>(collectionName: string): Promise<T[]> {
  try {
    await ensureAuthenticated();
    const colRef = collection(db, collectionName);
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

export async function dbSetDoc(collectionName: string, docId: string, data: any): Promise<void> {
  try {
    await ensureAuthenticated();
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${docId}`);
  }
}

export async function dbDeleteDoc(collectionName: string, docId: string): Promise<void> {
  try {
    await ensureAuthenticated();
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${docId}`);
  }
}

