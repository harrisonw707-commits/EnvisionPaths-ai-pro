import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

console.log('[FIREBASE] Initializing with project:', firebaseConfig.projectId);
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('[FIREBASE] Initialized successfully');
} catch (error) {
  console.error('[FIREBASE] Initialization failed:', error);
  throw error;
}

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

export default app;
