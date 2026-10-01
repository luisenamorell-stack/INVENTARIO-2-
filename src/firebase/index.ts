import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, memoryLocalCache, memoryLruGarbageCollector } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Use initializeFirestore with forceLongPolling to avoid connectivity issues in some environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true,
  localCache: memoryLocalCache({ garbageCollector: memoryLruGarbageCollector() })
});

export const auth = getAuth();
export const firebaseApp = app;

import { useMemo, useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';

export const FirebaseContext = createContext<any>(null);

export function useFirebase() {
  return useContext(FirebaseContext);
}

export function useFirestore() {
  return db;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsUserLoading(false);
    });
  }, []);

  return { user, isUserLoading };
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
    const path = (queryRef as any).path || 'unknown-query';
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
