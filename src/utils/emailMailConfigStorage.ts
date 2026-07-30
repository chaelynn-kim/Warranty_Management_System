import { readConfidentialAppData, writeConfidentialAppData, queueFirestorePush } from './firestoreSync'
import {
  createDefaultWarrantyEmailMailConfig,
  type WarrantyEmailMailConfigRecord,
  type WarrantyEmailTemplateConfig,
  type WarrantyEmailTemplateId,
} from './emailMailConfigTypes'

const STORAGE_KEY = 'warranty-email-mail-config'
const VERSION_KEY = 'warranty-email-mail-config-version'
const CURRENT_VERSION = '2'
const FIRESTORE_DOC_ID = 'warranty-email-mail-config'

function isTemplateConfig(value: unknown): value is Pick<WarrantyEmailTemplateConfig, 'to' | 'cc'> {
  if (!value || typeof value !== 'object') return false
  const item = value as WarrantyEmailTemplateConfig
  return typeof item.to === 'string' && typeof item.cc === 'string'
}

function normalizeRecord(data: unknown): WarrantyEmailMailConfigRecord {
  const defaults = createDefaultWarrantyEmailMailConfig()
  if (!data || typeof data !== 'object') return defaults

  const templates = (data as WarrantyEmailMailConfigRecord).templates
  if (!templates || typeof templates !== 'object') return defaults

  const next = createDefaultWarrantyEmailMailConfig()
  for (const id of Object.keys(next.templates) as WarrantyEmailTemplateId[]) {
    const incoming = templates[id]
    if (isTemplateConfig(incoming)) {
      next.templates[id] = {
        to: incoming.to,
        cc: incoming.cc,
      }
    }
  }
  return next
}

function readLocalRecord(): WarrantyEmailMailConfigRecord {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return normalizeRecord(JSON.parse(saved))
    }
  } catch {
    // fall through
  }
  return createDefaultWarrantyEmailMailConfig()
}

function writeLocalRecord(record: WarrantyEmailMailConfigRecord): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  localStorage.setItem(VERSION_KEY, CURRENT_VERSION)
}

export async function loadWarrantyEmailMailConfig(): Promise<WarrantyEmailMailConfigRecord> {
  try {
    const remote = await readConfidentialAppData<WarrantyEmailMailConfigRecord>(FIRESTORE_DOC_ID)
    if (remote?.data != null) {
      const record = normalizeRecord(remote.data)
      writeLocalRecord(record)
      return record
    }
  } catch {
    // fall through
  }
  return readLocalRecord()
}

export async function saveWarrantyEmailMailConfig(
  record: WarrantyEmailMailConfigRecord,
  updatedBy?: string
): Promise<void> {
  const normalized = normalizeRecord(record)
  writeLocalRecord(normalized)
  try {
    await writeConfidentialAppData(FIRESTORE_DOC_ID, {
      version: CURRENT_VERSION,
      data: normalized,
      updatedBy,
    })
  } catch {
    queueFirestorePush('warranty-email-mail-config')
  }
}

export function parseEmailList(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function applyEmailTemplatePlaceholders(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    return values[key] ?? ''
  })
}
