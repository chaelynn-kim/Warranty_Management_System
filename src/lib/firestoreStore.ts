import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, isFirestoreEnabled } from './firebase'

export const FIRESTORE_APP_DATA_COLLECTION = 'app-data'

export interface FirestoreStoredPayload<T = unknown> {
  version: string
  data: T
  updatedAt: string
  updatedBy?: string
}

export async function readFirestoreDoc<T>(docId: string): Promise<FirestoreStoredPayload<T> | null> {
  if (!isFirestoreEnabled || !db) return null

  const snapshot = await getDoc(doc(db, FIRESTORE_APP_DATA_COLLECTION, docId))
  if (!snapshot.exists()) return null

  return snapshot.data() as FirestoreStoredPayload<T>
}

export async function writeFirestoreDoc<T>(
  docId: string,
  payload: Omit<FirestoreStoredPayload<T>, 'updatedAt'> & { updatedAt?: string }
): Promise<void> {
  if (!isFirestoreEnabled || !db) return

  await setDoc(
    doc(db, FIRESTORE_APP_DATA_COLLECTION, docId),
    {
      ...payload,
      updatedAt: payload.updatedAt ?? new Date().toISOString(),
    },
    { merge: true }
  )
}
