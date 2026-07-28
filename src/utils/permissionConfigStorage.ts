import { readFirestoreDoc, writeFirestoreDoc } from '../lib/firestoreStore'
import { queueFirestorePush } from './firestoreSync'
import {
  PERMISSION_ROLE_ORDER,
  createDefaultPermissionConfig,
  type PermissionConfigRecord,
  type PermissionRoleConfig,
  type PermissionRoleId,
} from './permissionConfigTypes'

const STORAGE_KEY = 'warranty-permission-config'
const VERSION_KEY = 'warranty-permission-config-version'
const CURRENT_VERSION = '1'
const FIRESTORE_DOC_ID = 'warranty-permission-config'

function normalizeEmailList(emails: unknown): string[] {
  if (!Array.isArray(emails)) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of emails) {
    if (typeof item !== 'string') continue
    const email = item.trim().toLowerCase()
    if (!email || seen.has(email)) continue
    seen.add(email)
    result.push(email)
  }
  return result
}

function isRoleConfig(value: unknown): value is PermissionRoleConfig {
  if (!value || typeof value !== 'object') return false
  const item = value as PermissionRoleConfig
  return typeof item.id === 'string' && Array.isArray(item.emails)
}

export function normalizePermissionConfig(data: unknown): PermissionConfigRecord {
  const defaults = createDefaultPermissionConfig()
  if (!data || typeof data !== 'object') return defaults

  const roles = (data as PermissionConfigRecord).roles
  if (!roles || typeof roles !== 'object') return defaults

  const next = createDefaultPermissionConfig()
  for (const id of PERMISSION_ROLE_ORDER) {
    const incoming = roles[id]
    if (!isRoleConfig(incoming)) continue
    // 라벨·설명은 코드(기본값)를 유지하고, 이메일만 저장된 값을 반영
    next.roles[id] = {
      ...next.roles[id],
      emails: normalizeEmailList(incoming.emails),
    }
  }
  return next
}

export function readPermissionConfigLocal(): PermissionConfigRecord {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return normalizePermissionConfig(JSON.parse(saved))
  } catch {
    // fall through
  }
  return createDefaultPermissionConfig()
}

function writePermissionConfigLocal(record: PermissionConfigRecord): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  localStorage.setItem(VERSION_KEY, CURRENT_VERSION)
}

export async function loadPermissionConfig(): Promise<PermissionConfigRecord> {
  try {
    const remote = await readFirestoreDoc<PermissionConfigRecord>(FIRESTORE_DOC_ID)
    if (remote?.data != null) {
      const record = normalizePermissionConfig(remote.data)
      writePermissionConfigLocal(record)
      return record
    }
  } catch {
    // fall through
  }
  return readPermissionConfigLocal()
}

export async function savePermissionConfig(
  record: PermissionConfigRecord,
  updatedBy?: string
): Promise<void> {
  const normalized = normalizePermissionConfig(record)
  writePermissionConfigLocal(normalized)
  try {
    await writeFirestoreDoc(FIRESTORE_DOC_ID, {
      version: CURRENT_VERSION,
      data: normalized,
      updatedBy,
    })
  } catch {
    queueFirestorePush('warranty-permission-config')
  }
}

export function parsePermissionEmailInput(raw: string): string[] {
  return normalizeEmailList(
    raw
      .split(/[,;\n]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  )
}

export function formatPermissionEmailInput(emails: string[]): string {
  return emails.join('\n')
}

export function getRoleEmailSet(roleId: PermissionRoleId): Set<string> {
  const record = readPermissionConfigLocal()
  return new Set(record.roles[roleId].emails.map((email) => email.trim().toLowerCase()))
}
