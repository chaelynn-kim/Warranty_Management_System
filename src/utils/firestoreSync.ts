import { readFirestoreDoc, writeFirestoreDoc, hasLegacyAppDataRootFields } from '../lib/firestoreStore'
import { isFirestoreEnabled } from '../lib/firebase'
import {
  decryptJsonPayload,
  encryptJsonPayload,
  isEncryptedBlob,
} from './storageEncryption'
import { maskEmail } from './piiMasking'

type AppDataStore = {
  docId: string
  storageKey: string
  versionKey: string
  /**
   * Firestore에는 암호문으로만 저장. 로컬(localStorage)은 평문 유지 → 앱 동작용.
   * (권한 매칭·메일 발송 등에 원본 필요)
   */
  confidential?: boolean
  /**
   * 로컬에도 이미 암호문인 저장소(보증연한). push/pull 시 재암호화하지 않음.
   */
  localAlreadyEncrypted?: boolean
}

export const APP_DATA_STORES: readonly AppDataStore[] = [
  {
    docId: 'external-test-records',
    storageKey: 'external-test-records',
    versionKey: 'external-test-version',
    confidential: true,
  },
  {
    docId: 'warranty-issuance-requests',
    storageKey: 'warranty-issuance-requests',
    versionKey: 'warranty-issuance-requests-version',
    confidential: true,
  },
  {
    docId: 'warranty-issuance-records',
    storageKey: 'warranty-issuance-records',
    versionKey: 'warranty-issuance-version',
    confidential: true,
  },
  {
    docId: 'warranty-period-data',
    storageKey: 'warranty-period-data',
    versionKey: 'warranty-period-version',
    localAlreadyEncrypted: true,
  },
  {
    docId: 'warranty-guide-file',
    storageKey: 'warranty-guide-file',
    versionKey: 'warranty-guide-file-version',
  },
  {
    docId: 'warranty-certificate-templates',
    storageKey: 'warranty-certificate-templates',
    versionKey: 'warranty-certificate-templates-version',
  },
  {
    docId: 'warranty-email-mail-config',
    storageKey: 'warranty-email-mail-config',
    versionKey: 'warranty-email-mail-config-version',
    confidential: true,
  },
  {
    docId: 'warranty-permission-config',
    storageKey: 'warranty-permission-config',
    versionKey: 'warranty-permission-config-version',
    confidential: true,
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

function maskedActor(email: string | undefined): string | undefined {
  if (!email) return undefined
  return maskEmail(email)
}

/** 로컬 값 → Firestore 저장 형태 */
async function toFirestorePayloadData(store: AppDataStore, localData: unknown): Promise<unknown> {
  if (store.localAlreadyEncrypted) return localData
  if (store.confidential) {
    if (isEncryptedBlob(localData)) return localData
    return encryptJsonPayload(localData)
  }
  return localData
}

/** Firestore 값 → 로컬 저장 형태 */
async function fromFirestorePayloadData(store: AppDataStore, remoteData: unknown): Promise<unknown> {
  if (store.localAlreadyEncrypted) return remoteData
  if (store.confidential && isEncryptedBlob(remoteData)) {
    return decryptJsonPayload(remoteData)
  }
  return remoteData
}

export async function pullAllFromFirestore(userEmail?: string): Promise<void> {
  if (!isFirestoreEnabled) return

  const actor = maskedActor(userEmail ?? currentUserEmail)

  await Promise.all(
    APP_DATA_STORES.map(async (store) => {
      const remote = await readFirestoreDoc(store.docId)
      const local = readLocalStore(store.storageKey, store.versionKey)
      const replace = Boolean(store.confidential || store.localAlreadyEncrypted)

      if (remote?.data != null) {
        try {
          const localData = await fromFirestorePayloadData(store, remote.data)
          writeLocalStore(store.storageKey, store.versionKey, localData, remote.version)

          // 레거시 평문·merge로 남은 옛 필드 → 암호문으로 문서 전체 교체
          const needsConfidentialRewrite =
            (store.confidential || store.localAlreadyEncrypted) &&
            (!isEncryptedBlob(remote.data) || hasLegacyAppDataRootFields(remote.rootKeys))

          if (needsConfidentialRewrite) {
            const dataToWrite = isEncryptedBlob(localData)
              ? localData
              : await encryptJsonPayload(localData)
            await writeFirestoreDoc(
              store.docId,
              {
                version: remote.version,
                data: dataToWrite,
                updatedBy: actor,
              },
              { replace: true }
            )
          }
        } catch (error) {
          console.error(`[Firestore] ${store.docId} 복호화 실패`, error)
        }
        return
      }

      if (local) {
        const data = await toFirestorePayloadData(store, local.data)
        await writeFirestoreDoc(
          store.docId,
          {
            version: local.version,
            data,
            updatedBy: actor,
          },
          { replace }
        )
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

  const data = await toFirestorePayloadData(store, local.data)
  await writeFirestoreDoc(
    store.docId,
    {
      version: local.version,
      data,
      updatedBy: maskedActor(userEmail ?? currentUserEmail),
    },
    { replace: Boolean(store.confidential || store.localAlreadyEncrypted) }
  )
}

export function queueFirestorePush(docId: AppDataDocId): void {
  if (!isFirestoreEnabled) return

  void pushStoreToFirestore(docId).catch((error) => {
    console.error(`[Firestore] ${docId} 업로드 실패`, error)
  })
}

/** 개별 모듈이 Firestore에 직접 쓸 때 — 암호문 + updatedBy 마스킹 */
export async function writeConfidentialAppData(
  docId: AppDataDocId,
  payload: { version: string; data: unknown; updatedBy?: string }
): Promise<void> {
  if (!isFirestoreEnabled) return
  const store = APP_DATA_STORES.find((item) => item.docId === docId)
  if (!store) return

  const data = await toFirestorePayloadData(store, payload.data)
  await writeFirestoreDoc(
    docId,
    {
      version: payload.version,
      data,
      updatedBy: maskedActor(payload.updatedBy),
    },
    { replace: true }
  )
}
/**
 * 로그인 직후 호출 — 기밀 문서가 평문이면 즉시 암호문으로 교체.
 * (배포 후에도 콘솔에 templates 평문이 남는 문제 방지)
 */
export async function forceMigrateConfidentialAppData(userEmail?: string): Promise<void> {
  if (!isFirestoreEnabled) return

  const actor = maskedActor(userEmail ?? currentUserEmail)

  for (const store of APP_DATA_STORES) {
    if (!store.confidential && !store.localAlreadyEncrypted) continue

    try {
      const remote = await readFirestoreDoc(store.docId)
      if (remote?.data == null) {
        const local = readLocalStore(store.storageKey, store.versionKey)
        if (!local) continue
        const data = await toFirestorePayloadData(store, local.data)
        await writeFirestoreDoc(
          store.docId,
          { version: local.version, data, updatedBy: actor },
          { replace: true }
        )
        console.info(`[Firestore] ${store.docId} 로컬→암호문 업로드 완료`)
        continue
      }

      const needsRewrite =
        !isEncryptedBlob(remote.data) || hasLegacyAppDataRootFields(remote.rootKeys)

      if (!needsRewrite) {
        console.info(`[Firestore] ${store.docId} 이미 기밀화됨`)
        continue
      }

      const plain = await fromFirestorePayloadData(store, remote.data)
      writeLocalStore(store.storageKey, store.versionKey, plain, remote.version)

      const dataToWrite = isEncryptedBlob(plain) ? plain : await encryptJsonPayload(plain)
      await writeFirestoreDoc(
        store.docId,
        {
          version: remote.version,
          data: dataToWrite,
          updatedBy: actor,
        },
        { replace: true }
      )
      console.info(`[Firestore] ${store.docId} 평문→암호문 마이그레이션 완료`)
    } catch (error) {
      console.error(`[Firestore] ${store.docId} 기밀화 마이그레이션 실패`, error)
    }
  }
}

/** 개별 모듈이 Firestore에서 직접 읽을 때 — 복호화 */
export async function readConfidentialAppData<T>(
  docId: AppDataDocId
): Promise<{ version: string; data: T; updatedAt?: string } | null> {
  if (!isFirestoreEnabled) return null
  const store = APP_DATA_STORES.find((item) => item.docId === docId)
  if (!store) return null

  const remote = await readFirestoreDoc(docId)
  if (remote?.data == null) return null

  const data = (await fromFirestorePayloadData(store, remote.data)) as T
  return {
    version: remote.version,
    data,
    updatedAt: remote.updatedAt,
  }
}

