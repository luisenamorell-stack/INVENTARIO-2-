import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  DocumentReference,
  CollectionReference,
  SetOptions
} from 'firebase/firestore';
import { auth } from './core';

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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Not throwing to avoid blocking the UI loading state, but logging the required JSON for AI Studio
}

export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options?: SetOptions) {
  const path = docRef.path;
  if (options) {
    setDoc(docRef, data, options).catch(e => handleFirestoreError(e, OperationType.WRITE, path));
  } else {
    setDoc(docRef, data).catch(e => handleFirestoreError(e, OperationType.WRITE, path));
  }
}

export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const path = colRef.path;
  return addDoc(colRef, data).catch(e => handleFirestoreError(e, OperationType.WRITE, path));
}

export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  const path = docRef.path;
  updateDoc(docRef, data).catch(e => handleFirestoreError(e, OperationType.WRITE, path));
}

export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  const path = docRef.path;
  deleteDoc(docRef).catch(e => handleFirestoreError(e, OperationType.WRITE, path));
}
