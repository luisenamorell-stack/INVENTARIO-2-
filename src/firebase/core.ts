import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const databaseId = (firebaseConfig as any).firestoreDatabaseId || '(default)';

// Simple initialization is often more reliable
const db = getFirestore(app, databaseId);

export { app, auth, db, firebaseConfig };
