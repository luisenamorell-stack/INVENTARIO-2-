import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, memoryLocalCache, memoryLruGarbageCollector } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Use initializeFirestore with the correct databaseId and forceLongPolling
const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
console.log("Initializing Firestore with Database ID:", dbId);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true,
  localCache: memoryLocalCache({ garbageCollector: memoryLruGarbageCollector() })
}, dbId);

import { doc, getDocFromServer, getDocs, collection, limit, query } from 'firebase/firestore';

async function testConnection() {
  try {
    // Attempt to reach the server to verify the database ID and connectivity
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore health check successful.");
    
    // Check if products collection has anything
    const snap = await getDocs(query(collection(db, "products"), limit(1)));
    if (snap.empty) {
      console.warn("Products collection is empty in database:", dbId);
    } else {
      console.log("Found data in products collection.");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore is operating in offline mode. Please check your internet connection.");
    } else {
      console.error("Firestore connection/permission error:", error);
    }
  }
}
testConnection();

export const auth = getAuth();
export const firebaseApp = app;

import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { useMemo, useState, useEffect, createContext, useContext } from 'react';

export const FirebaseContext = createContext<any>(null);

export function useFirebase() {
  return useContext(FirebaseContext);
}

export function useFirestore() {
  return db;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [isUserLoading, setIsUserLoading] = useState(!auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsUserLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return { user, isUserLoading, loginWithGoogle, logout };
}

import { onSnapshot, DocumentData, CollectionReference, Query } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './non-blocking-updates';

export function useCollection(queryRef: any) {
  const [data, setData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!queryRef || isUserLoading || !user) {
      if (!isUserLoading && !user) {
        setIsLoading(false);
      }
      return;
    }
    setIsLoading(true);
    const path = (queryRef as any).path || (queryRef as any).id || (queryRef as any)._query?.path?.segments?.join('/') || 'unknown-query';
    const unsubscribe = onSnapshot(queryRef, (snapshot: any) => {
      const results = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id }));
      setData(results);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [queryRef, user, isUserLoading]);

  return { data, isLoading };
}

export function useMemoFirebase(factory: any, deps: any[]) {
  return useMemo(factory, deps);
}
