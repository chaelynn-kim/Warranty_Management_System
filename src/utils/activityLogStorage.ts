import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db, isFirestoreEnabled } from '../lib/firebase'
import {
  ACTIVITY_ACTION_LABELS,
  type ActivityAction,
  type ActivityLogEntry,
  type ActivityLogWriteInput,
} from './activityLogTypes'
import {
  decryptJsonPayload,
  encryptJsonPayload,
  isEncryptedBlob,
  type EncryptedBlob,
} from './storageEncryption'

export const ACTIVITY_LOGS_COLLECTION = 'activity-logs'
const DEFAULT_FETCH_LIMIT = 300

/** Firestore에만 저장되는 민감 필드 (웹 표시 시 복호화) */
interface ActivityLogPii {
  userEmail: string
  userName: string
  detail: string
  meta: Record<string, string | number | boolean | null>
}

function normalizeEmail(email: string | undefined | null): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

export async function writeActivityLog(input: ActivityLogWriteInput): Promise<string | null> {
  if (!isFirestoreEnabled || !db) return null

  const current = auth?.currentUser
  const userEmail = normalizeEmail(input.userEmail ?? current?.email)
  const userName = input.userName?.trim() || current?.displayName?.trim() || ''
  const actionLabel =
    ACTIVITY_ACTION_LABELS[input.action as ActivityAction] ?? String(input.action)
  const createdAt = new Date().toISOString()
  const detail = input.detail?.trim() || ''
  const meta = input.meta ?? {}

  try {
    // 웹에서는 원문 사용 → Firestore에는 민감정보만 AES 암호문으로 저장
    const pii = await encryptJsonPayload({
      userEmail,
      userName,
      detail,
      meta,
    } satisfies ActivityLogPii)

    const ref = await addDoc(collection(db, ACTIVITY_LOGS_COLLECTION), {
      createdAt,
      createdAtServer: serverTimestamp(),
      action: input.action,
      actionLabel,
      pii,
      // 레거시 필드 비움 — 콘솔에 평문/마스킹 이메일이 보이지 않도록
      userEmail: '',
      userName: '',
      detail: '',
      meta: {},
    })
    return ref.id
  } catch (error) {
    console.warn('[activity-log] write failed', error)
    return null
  }
}

/** UI를 막지 않도록 fire-and-forget */
export function logActivity(input: ActivityLogWriteInput): void {
  void writeActivityLog(input)
}

async function resolveLogEntry(
  id: string,
  data: Record<string, unknown>
): Promise<ActivityLogEntry> {
  const base = {
    id,
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : '',
    action: typeof data.action === 'string' ? data.action : '',
    actionLabel:
      typeof data.actionLabel === 'string'
        ? data.actionLabel
        : String(data.action ?? ''),
  }

  const piiField = data.pii
  if (isEncryptedBlob(piiField)) {
    try {
      const pii = await decryptJsonPayload<ActivityLogPii>(piiField as EncryptedBlob)
      return {
        ...base,
        userEmail: pii.userEmail ?? '',
        userName: pii.userName || undefined,
        detail: pii.detail || undefined,
        meta: pii.meta,
      }
    } catch (error) {
      console.warn('[activity-log] decrypt failed', id, error)
      return {
        ...base,
        userEmail: '(복호화 실패)',
        userName: undefined,
        detail: undefined,
      }
    }
  }

  // 레거시(마스킹/평문) 문서 — 웹에 저장된 값 그대로 표시
  return {
    ...base,
    userEmail: typeof data.userEmail === 'string' ? data.userEmail : '',
    userName: typeof data.userName === 'string' && data.userName ? data.userName : undefined,
    detail: typeof data.detail === 'string' && data.detail ? data.detail : undefined,
    meta:
      data.meta && typeof data.meta === 'object'
        ? (data.meta as Record<string, string | number | boolean | null>)
        : undefined,
  }
}

export async function fetchActivityLogs(
  maxItems = DEFAULT_FETCH_LIMIT
): Promise<ActivityLogEntry[]> {
  if (!isFirestoreEnabled || !db) return []

  const snapshot = await getDocs(
    query(
      collection(db, ACTIVITY_LOGS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(maxItems)
    )
  )

  const rows = await Promise.all(
    snapshot.docs.map((item) => resolveLogEntry(item.id, item.data() as Record<string, unknown>))
  )

  return rows.filter(
    (item) => item.action !== 'tab.view' && item.actionLabel !== '탭 이동'
  )
}

export async function deleteActivityLog(id: string): Promise<void> {
  if (!isFirestoreEnabled || !db) return
  await deleteDoc(doc(db, ACTIVITY_LOGS_COLLECTION, id))
}
