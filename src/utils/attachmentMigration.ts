import type { WarrantyIssuanceRequest, WarrantyIssuanceRequestRecord } from '../types'
import {
  migrateDataUrlToStorage,
  type RequestAttachmentSlot,
} from '../lib/storageAttachments'
import { isStorageEnabled } from '../lib/firebase'
import { parseFileAttachments, serializeFileAttachments } from './warrantyAttachments'
import {
  getWarrantyRequestRecords,
  persistWarrantyRequestRecords,
  reloadWarrantyRequestRecords,
} from './warrantyRequestRecordsCache'

const REQUEST_ATTACHMENT_FIELDS: {
  field: keyof WarrantyIssuanceRequest
  slot: RequestAttachmentSlot
}[] = [
  { field: 'companyWarrantyAttachmentKo', slot: 'company-ko' },
  { field: 'companyWarrantyAttachmentEn', slot: 'company-en' },
  { field: 'supplierWarrantyAttachmentKo', slot: 'supplier-ko' },
  { field: 'supplierWarrantyAttachmentEn', slot: 'supplier-en' },
]

async function migrateAttachmentField(
  raw: string,
  recordId: string,
  slot: RequestAttachmentSlot
): Promise<{ value: string; changed: boolean }> {
  const files = parseFileAttachments(raw)
  if (files.length === 0) {
    return { value: raw, changed: false }
  }

  let changed = false
  const migrated = await Promise.all(
    files.map(async (file) => {
      if (file.storagePath && !file.dataUrl) {
        return file
      }
      if (file.dataUrl && !file.storagePath) {
        changed = true
        return migrateDataUrlToStorage(file, recordId, slot)
      }
      if (file.storagePath && file.dataUrl) {
        changed = true
        const { dataUrl: _removed, ...rest } = file
        return rest
      }
      return file
    })
  )

  if (!changed) {
    return { value: raw, changed: false }
  }

  return {
    value: serializeFileAttachments(migrated),
    changed: true,
  }
}

export async function migrateRequestRecordAttachments(
  record: WarrantyIssuanceRequestRecord
): Promise<{ record: WarrantyIssuanceRequestRecord; changed: boolean }> {
  let next = record
  let changed = false

  for (const { field, slot } of REQUEST_ATTACHMENT_FIELDS) {
    const raw = String(record[field] ?? '')
    const result = await migrateAttachmentField(raw, record.id, slot)
    if (result.changed) {
      changed = true
      next = { ...next, [field]: result.value }
    }
  }

  return { record: next, changed }
}

export async function migrateAllWarrantyRequestAttachments(): Promise<boolean> {
  if (!isStorageEnabled) {
    return false
  }

  reloadWarrantyRequestRecords()
  const records = getWarrantyRequestRecords()
  if (records.length === 0) {
    return false
  }

  let anyChanged = false
  const nextRecords: WarrantyIssuanceRequestRecord[] = []

  for (const record of records) {
    const { record: migrated, changed } = await migrateRequestRecordAttachments(record)
    nextRecords.push(migrated)
    if (changed) {
      anyChanged = true
    }
  }

  if (anyChanged) {
    persistWarrantyRequestRecords(nextRecords)
  }

  return anyChanged
}
