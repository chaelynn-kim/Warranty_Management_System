import type { WarrantyFileAttachment } from '../types'
import { readFirestoreDoc, writeFirestoreDoc } from '../lib/firestoreStore'
import { deleteStorageAttachment, uploadWarrantyGuideFile } from '../lib/storageAttachments'
import { queueFirestorePush } from './firestoreSync'

const STORAGE_KEY = 'warranty-guide-file'
const VERSION_KEY = 'warranty-guide-file-version'
const CURRENT_VERSION = '1'
const FIRESTORE_DOC_ID = 'warranty-guide-file'

export interface WarrantyGuideFileRecord {
  file: WarrantyFileAttachment | null
}

const EMPTY_RECORD: WarrantyGuideFileRecord = { file: null }

function isValidFile(value: unknown): value is WarrantyFileAttachment {
  if (!value || typeof value !== 'object') return false
  const file = value as WarrantyFileAttachment
  return (
    typeof file.id === 'string' &&
    typeof file.name === 'string' &&
    typeof file.size === 'number' &&
    typeof file.type === 'string' &&
    typeof file.storagePath === 'string' &&
    file.storagePath.length > 0
  )
}

function normalizeRecord(data: unknown): WarrantyGuideFileRecord {
  if (!data || typeof data !== 'object') return EMPTY_RECORD
  const file = (data as WarrantyGuideFileRecord).file
  return { file: isValidFile(file) ? file : null }
}

function readLocalRecord(): WarrantyGuideFileRecord {
  try {
    const version = localStorage.getItem(VERSION_KEY)
    const saved = localStorage.getItem(STORAGE_KEY)
    if (version === CURRENT_VERSION && saved) {
      return normalizeRecord(JSON.parse(saved))
    }
  } catch {
    // fall through
  }
  return EMPTY_RECORD
}

function writeLocalRecord(record: WarrantyGuideFileRecord): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  localStorage.setItem(VERSION_KEY, CURRENT_VERSION)
}

export async function loadWarrantyGuideFile(): Promise<WarrantyGuideFileRecord> {
  try {
    const remote = await readFirestoreDoc<WarrantyGuideFileRecord>(FIRESTORE_DOC_ID)
    if (remote?.data != null) {
      const record = normalizeRecord(remote.data)
      writeLocalRecord(record)
      return record
    }
  } catch {
    // fall through to local cache
  }
  return readLocalRecord()
}

export async function saveWarrantyGuideFile(
  record: WarrantyGuideFileRecord,
  updatedBy?: string
): Promise<void> {
  writeLocalRecord(record)
  try {
    await writeFirestoreDoc(FIRESTORE_DOC_ID, {
      version: CURRENT_VERSION,
      data: record,
      updatedBy,
    })
  } catch {
    queueFirestorePush('warranty-guide-file')
  }
}

const MAX_WARRANTY_GUIDE_BYTES = 100 * 1024 * 1024

export async function replaceWarrantyGuideFile(
  file: File,
  previous: WarrantyFileAttachment | null,
  updatedBy?: string
): Promise<WarrantyGuideFileRecord> {
  if (file.size > MAX_WARRANTY_GUIDE_BYTES) {
    throw new Error('파일 크기는 100MB 이하여야 합니다.')
  }

  const attachment = await uploadWarrantyGuideFile(file)
  const record: WarrantyGuideFileRecord = { file: attachment }
  await saveWarrantyGuideFile(record, updatedBy)

  if (previous?.storagePath && previous.storagePath !== attachment.storagePath) {
    await deleteStorageAttachment(previous.storagePath)
  }

  return record
}
