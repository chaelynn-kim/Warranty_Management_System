import { readFirestoreDoc, writeFirestoreDoc } from '../lib/firestoreStore'
import { isFirestoreEnabled } from '../lib/firebase'

export const APP_DATA_STORES = [
  {
    docId: 'external-test-records',
    storageKey: 'external-test-records',
    versionKey: 'external-test-version',
  },
  {
    docId: 'warranty-issuance-requests',
    storageKey: 'warranty-issuance-requests',
    versionKey: 'warranty-issuance-requests-version',
  },
  {
    docId: 'warranty-issuance-records',
    storageKey: 'warranty-issuance-records',
    versionKey: 'warranty-issuance-version',
  },
  {
    docId: 'warranty-period-data',
    storageKey: 'warranty-period-data',
    versionKey: 'warranty-period-version',
  },
] as const

export type AppDataDocId = (typeof APP_DATA_STORES)[number]['docId']

let currentUserEmail: string | undefined

export function setFirestoreSyncUser(email: string | undefined): void {
  currentUserEmail = email
}

function readLocalStore(storageKey: string, versionKey: string): { data: unknown; version: string } | null {
  const raw = localStorage.getItem(storageKey)
  if (!raw) return null

  try {
    return {
      data: JSON.parse(raw) as unknown,
      version: localStorage.getItem(versionKey) ?? '1',
    }
  } catch {
    return null
  }
}

function writeLocalStore(storageKey: string, versionKey: string, data: unknown, version: string): void {
  localStorage.setItem(storageKey, JSON.stringify(data))
  localStorage.setItem(versionKey, version)
}

export async function pullAllFromFirestore(userEmail?: string): Promise<void> {
  if (!isFirestoreEnabled) return

  await Promise.all(
    APP_DATA_STORES.map(async (store) => {
      const remote = await readFirestoreDoc(store.docId)
      const local = readLocalStore(store.storageKey, store.versionKey)

      if (remote?.data != null) {
        writeLocalStore(store.storageKey, store.versionKey, remote.data, remote.version)
        return
      }

      if (local) {
        await writeFirestoreDoc(store.docId, {
          version: local.version,
          data: local.data,
          updatedBy: userEmail ?? currentUserEmail,
        })
      }
    })
  )
}

export async function pushStoreToFirestore(docId: AppDataDocId, userEmail?: string): Promise<void> {
  if (!isFirestoreEnabled) return

  const store = APP_DATA_STORES.find((item) => item.docId === docId)
  if (!store) return

  const local = readLocalStore(store.storageKey, store.versionKey)
  if (!local) return

  await writeFirestoreDoc(store.docId, {
    version: local.version,
    data: local.data,
    updatedBy: userEmail ?? currentUserEmail,
  })
}

export function queueFirestorePush(docId: AppDataDocId): void {
  if (!isFirestoreEnabled) return

  void pushStoreToFirestore(docId).catch((error) => {
    console.error(`[Firestore] ${docId} 업로드 실패`, error)
  })
}
