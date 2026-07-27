import {
  deleteStorageAttachment,
  getAttachmentBytes,
  uploadWarrantyCertificateTemplateFile,
} from '../../lib/storageAttachments'
import { readFirestoreDoc, writeFirestoreDoc } from '../../lib/firestoreStore'
import { queueFirestorePush } from '../firestoreSync'
import { WARRANTY_TEMPLATE_URLS } from './templateAssets'
import {
  buildCertificateTemplateSlot,
  type WarrantyCertificateTemplateEntry,
  type WarrantyCertificateTemplateLanguage,
  type WarrantyCertificateTemplateSlot,
  type WarrantyCertificateTemplatesRecord,
} from './certificateTemplateTypes'

const STORAGE_KEY = 'warranty-certificate-templates'
const VERSION_KEY = 'warranty-certificate-templates-version'
const CURRENT_VERSION = '2'
const FIRESTORE_DOC_ID = 'warranty-certificate-templates'

const MAX_TEMPLATE_BYTES = 50 * 1024 * 1024

const EMPTY_RECORD: WarrantyCertificateTemplatesRecord = { templates: {} }

const templateBufferCache = new Map<string, ArrayBuffer>()

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

function isValidEntry(value: unknown): value is WarrantyCertificateTemplateEntry {
  if (!value || typeof value !== 'object') return false
  const file = value as WarrantyCertificateTemplateEntry
  return (
    typeof file.id === 'string' &&
    typeof file.name === 'string' &&
    typeof file.size === 'number' &&
    typeof file.type === 'string' &&
    typeof file.storagePath === 'string' &&
    file.storagePath.length > 0
  )
}

function normalizeRecord(data: unknown): WarrantyCertificateTemplatesRecord {
  if (!data || typeof data !== 'object') return EMPTY_RECORD
  const templates = (data as WarrantyCertificateTemplatesRecord).templates
  if (!templates || typeof templates !== 'object') return EMPTY_RECORD

  const normalized: WarrantyCertificateTemplatesRecord['templates'] = {}
  for (const [slot, file] of Object.entries(templates)) {
    normalized[slot as WarrantyCertificateTemplateSlot] = isValidEntry(file) ? file : null
  }
  return { templates: normalized }
}

/** localStorage 용량 절약 — dataBase64는 Firestore에서만 유지 */
function stripBase64ForLocal(
  record: WarrantyCertificateTemplatesRecord
): WarrantyCertificateTemplatesRecord {
  const templates: WarrantyCertificateTemplatesRecord['templates'] = {}
  for (const [slot, entry] of Object.entries(record.templates)) {
    if (!entry) {
      templates[slot as WarrantyCertificateTemplateSlot] = null
      continue
    }
    const { dataBase64: _removed, ...rest } = entry
    templates[slot as WarrantyCertificateTemplateSlot] = rest
  }
  return { templates }
}

function readLocalRecord(): WarrantyCertificateTemplatesRecord {
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

function writeLocalRecord(record: WarrantyCertificateTemplatesRecord): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stripBase64ForLocal(record)))
  localStorage.setItem(VERSION_KEY, CURRENT_VERSION)
}

function clearTemplateCaches(): void {
  templateBufferCache.clear()
}

function storagePathVariants(storagePath: string): string[] {
  const variants = new Set<string>([storagePath])
  variants.add(storagePath.replace(/:/g, '_'))
  variants.add(storagePath.replace(/PAINT_ko/g, 'PAINT:ko').replace(/PAINT_en/g, 'PAINT:en').replace(/PRINT_ko/g, 'PRINT:ko').replace(/PRINT_en/g, 'PRINT:en'))
  return [...variants]
}

async function loadBytesFromStorage(storagePath: string): Promise<ArrayBuffer | null> {
  for (const path of storagePathVariants(storagePath)) {
    try {
      return await getAttachmentBytes(path)
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code === 'storage/object-not-found') continue
      console.warn('[CertificateTemplate] Storage 로드 실패', path, error)
    }
  }
  return null
}

export async function loadWarrantyCertificateTemplates(): Promise<WarrantyCertificateTemplatesRecord> {
  try {
    const remote = await readFirestoreDoc<WarrantyCertificateTemplatesRecord>(FIRESTORE_DOC_ID)
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

export async function saveWarrantyCertificateTemplates(
  record: WarrantyCertificateTemplatesRecord,
  updatedBy?: string
): Promise<void> {
  writeLocalRecord(record)
  clearTemplateCaches()
  try {
    await writeFirestoreDoc(FIRESTORE_DOC_ID, {
      version: CURRENT_VERSION,
      data: record,
      updatedBy,
    })
  } catch {
    queueFirestorePush('warranty-certificate-templates')
  }
}

export async function replaceWarrantyCertificateTemplate(
  slot: WarrantyCertificateTemplateSlot,
  file: File,
  previous: WarrantyCertificateTemplateEntry | null,
  updatedBy?: string
): Promise<WarrantyCertificateTemplatesRecord> {
  if (!file.name.toLowerCase().endsWith('.pptx')) {
    throw new Error('PPTX 파일만 업로드할 수 있습니다.')
  }
  if (file.size > MAX_TEMPLATE_BYTES) {
    throw new Error('파일 크기는 50MB 이하여야 합니다.')
  }

  const fileBuffer = await file.arrayBuffer()
  const dataBase64 = arrayBufferToBase64(fileBuffer)

  const attachment = await uploadWarrantyCertificateTemplateFile(file, slot)
  const entry: WarrantyCertificateTemplateEntry = {
    ...attachment,
    dataBase64,
  }

  const current = await loadWarrantyCertificateTemplates()
  const record: WarrantyCertificateTemplatesRecord = {
    templates: {
      ...current.templates,
      [slot]: entry,
    },
  }
  await saveWarrantyCertificateTemplates(record, updatedBy)

  if (previous?.storagePath && previous.storagePath !== attachment.storagePath) {
    await deleteStorageAttachment(previous.storagePath)
  }

  return record
}

export async function clearWarrantyCertificateTemplate(
  slot: WarrantyCertificateTemplateSlot,
  updatedBy?: string
): Promise<WarrantyCertificateTemplatesRecord> {
  const current = await loadWarrantyCertificateTemplates()
  const previous = current.templates[slot] ?? null
  const record: WarrantyCertificateTemplatesRecord = {
    templates: {
      ...current.templates,
      [slot]: null,
    },
  }
  await saveWarrantyCertificateTemplates(record, updatedBy)

  if (previous?.storagePath) {
    await deleteStorageAttachment(previous.storagePath)
  }

  return record
}

export function getBundledTemplateUrl(
  productItem: string,
  language: WarrantyCertificateTemplateLanguage
): string | null {
  return WARRANTY_TEMPLATE_URLS[productItem]?.[language] ?? null
}

async function loadBundledTemplateBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`기본 양식 파일을 불러오지 못했습니다. (HTTP ${response.status})`)
  }
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('text/html')) {
    throw new Error('기본 양식 경로가 잘못되었습니다. 앱을 다시 빌드·배포해 주세요.')
  }
  return response.arrayBuffer()
}

async function loadCustomTemplateBuffer(
  entry: WarrantyCertificateTemplateEntry
): Promise<ArrayBuffer | null> {
  if (entry.dataBase64) {
    return base64ToArrayBuffer(entry.dataBase64)
  }

  if (entry.storagePath) {
    return loadBytesFromStorage(entry.storagePath)
  }

  return null
}

/**
 * 보증서 자동 작성에 사용할 PPTX 바이트.
 * 1) Firestore에 저장된 dataBase64 (가장 안정적)
 * 2) Firebase Storage getBytes
 * 3) 번들된 기본 양식
 */
export async function loadWarrantyTemplateBuffer(
  productItem: string,
  language: WarrantyCertificateTemplateLanguage
): Promise<ArrayBuffer> {
  const cacheKey = `${productItem}:${language}`
  const cached = templateBufferCache.get(cacheKey)
  if (cached) return cached

  const slot = buildCertificateTemplateSlot(productItem, language)
  if (slot) {
    const record = await loadWarrantyCertificateTemplates()
    const entry = record.templates[slot]
    if (entry) {
      const customBuffer = await loadCustomTemplateBuffer(entry)
      if (customBuffer) {
        templateBufferCache.set(cacheKey, customBuffer)
        return customBuffer
      }

      throw new Error(
        '업로드된 양식 데이터를 찾을 수 없습니다. 양식 관리 탭에서 PPTX를 다시 업로드해 주세요.'
      )
    }
  }

  const bundled = getBundledTemplateUrl(productItem, language)
  if (!bundled) {
    throw new Error('지원하지 않는 품목입니다.')
  }

  const buffer = await loadBundledTemplateBuffer(bundled)
  templateBufferCache.set(cacheKey, buffer)
  return buffer
}

/** dataBase64 없는 기존 업로드본을 Storage에서 읽어 Firestore에 보완 */
export async function migrateCertificateTemplatesBase64(
  record: WarrantyCertificateTemplatesRecord,
  updatedBy?: string
): Promise<WarrantyCertificateTemplatesRecord> {
  let changed = false
  const templates: WarrantyCertificateTemplatesRecord['templates'] = { ...record.templates }

  for (const [slot, entry] of Object.entries(templates)) {
    if (!entry || entry.dataBase64 || !entry.storagePath) continue
    const buffer = await loadBytesFromStorage(entry.storagePath)
    if (!buffer) continue
    templates[slot as WarrantyCertificateTemplateSlot] = {
      ...entry,
      dataBase64: arrayBufferToBase64(buffer),
    }
    changed = true
  }

  if (!changed) return record

  const next: WarrantyCertificateTemplatesRecord = { templates }
  await saveWarrantyCertificateTemplates(next, updatedBy)
  return next
}
