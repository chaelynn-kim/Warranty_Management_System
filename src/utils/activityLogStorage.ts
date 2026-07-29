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

export const ACTIVITY_LOGS_COLLECTION = 'activity-logs'
const DEFAULT_FETCH_LIMIT = 300

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

  try {
    const ref = await addDoc(collection(db, ACTIVITY_LOGS_COLLECTION), {
      createdAt,
      createdAtServer: serverTimestamp(),
      userEmail,
      userName,
      action: input.action,
      actionLabel,
      detail: input.detail?.trim() || '',
      meta: input.meta ?? {},
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

  return snapshot.docs
    .map((item) => {
      const data = item.data() as Omit<ActivityLogEntry, 'id'>
      return {
        id: item.id,
        createdAt: typeof data.createdAt === 'string' ? data.createdAt : '',
        userEmail: data.userEmail ?? '',
        userName: data.userName || undefined,
        action: data.action ?? '',
        actionLabel: data.actionLabel || String(data.action ?? ''),
        detail: data.detail || undefined,
        meta: data.meta,
      }
    })
    // 과거 기록: 탭 이동은 더 이상 남기지 않으며 조회에서도 제외
    .filter(
      (item) =>
        item.action !== 'tab.view' &&
        item.actionLabel !== '탭 이동'
    )
}

export async function deleteActivityLog(id: string): Promise<void> {
  if (!isFirestoreEnabled || !db) return
  await deleteDoc(doc(db, ACTIVITY_LOGS_COLLECTION, id))
}
