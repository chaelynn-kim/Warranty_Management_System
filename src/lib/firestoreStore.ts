import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, isFirestoreEnabled } from './firebase'
import {
  encryptJsonPayload,
  isEncryptedBlob,
} from '../utils/storageEncryption'
import { maskEmail } from '../utils/piiMasking'

export const FIRESTORE_APP_DATA_COLLECTION = 'app-data'

/** Firestore에 평문으로 남기면 안 되는 app-data 문서 */
export const CONFIDENTIAL_APP_DATA_DOC_IDS = new Set([
  'external-test-records',
  'warranty-issuance-requests',
  'warranty-issuance-records',
  'warranty-period-data',
  'warranty-email-mail-config',
  'warranty-permission-config',
])

export interface FirestoreStoredPayload<T = unknown> {
  version: string
  data: T
  updatedAt: string
  updatedBy?: string
  /** 문서 루트 키 — merge로 남은 레거시 평문 필드 감지용 */
  rootKeys?: string[]
}

const APP_DATA_ROOT_KEYS = new Set(['version', 'data', 'updatedAt', 'updatedBy'])

export function hasLegacyAppDataRootFields(rootKeys: string[] | undefined): boolean {
  if (!rootKeys?.length) return false
  return rootKeys.some((key) => !APP_DATA_ROOT_KEYS.has(key))
}

export async function readFirestoreDoc<T>(docId: string): Promise<FirestoreStoredPayload<T> | null> {
  if (!isFirestoreEnabled || !db) return null

  const snapshot = await getDoc(doc(db, FIRESTORE_APP_DATA_COLLECTION, docId))
  if (!snapshot.exists()) return null

  const raw = snapshot.data() as Record<string, unknown>
  return {
    version: typeof raw.version === 'string' ? raw.version : '1',
    data: raw.data as T,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
    updatedBy: typeof raw.updatedBy === 'string' ? raw.updatedBy : undefined,
    rootKeys: Object.keys(raw),
  }
}

export async function writeFirestoreDoc<T>(
  docId: string,
  payload: Omit<FirestoreStoredPayload<T>, 'updatedAt'> & { updatedAt?: string },
  options?: { replace?: boolean }
): Promise<void> {
  if (!isFirestoreEnabled || !db) return

  const confidential = CONFIDENTIAL_APP_DATA_DOC_IDS.has(docId)
  let data: unknown = payload.data

  // 안전망: 기밀 문서는 어떤 호출 경로든 Firestore에 평문 data를 올리지 않음
  if (confidential && data != null && !isEncryptedBlob(data)) {
    data = await encryptJsonPayload(data)
  }

  let updatedBy = payload.updatedBy
  if (confidential && typeof updatedBy === 'string' && updatedBy.includes('@') && !updatedBy.includes('*')) {
    updatedBy = maskEmail(updatedBy)
  }

  const body = {
    version: payload.version,
    data,
    updatedAt: payload.updatedAt ?? new Date().toISOString(),
    ...(updatedBy != null ? { updatedBy } : {}),
  }

  // 기밀 문서는 항상 전체 교체 (merge로 옛 평문 필드가 남는 것 방지)
  if (options?.replace || confidential) {
    await setDoc(doc(db, FIRESTORE_APP_DATA_COLLECTION, docId), body)
    return
  }

  await setDoc(doc(db, FIRESTORE_APP_DATA_COLLECTION, docId), body, { merge: true })
}
