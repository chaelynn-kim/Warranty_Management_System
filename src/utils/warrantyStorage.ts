import defaultData from '../data/warrantyIssuance.json'
import type { WarrantyRecord } from '../types'
import { normalizeDate, subtractDaysFromDate } from './helpers'
import { parseFileAttachments, serializeFileAttachments } from './warrantyAttachments'
import { normalizeLegacyRegion, type LegacyWarrantySource } from './warrantyLegacyFields'

const STORAGE_KEY = 'warranty-issuance-records'
const STORAGE_VERSION_KEY = 'warranty-issuance-version'
const CURRENT_VERSION = '6'

export function createEmptyWarrantyRecord(): WarrantyRecord {
  return {
    id: crypto.randomUUID(),
    requestDate: '',
    requester: '',
    region: '',
    detailRegion: '',
    customer: '',
    colorName: '',
    paintCompany: '',
    resin: '',
    additionalRequest: '',
    fileAttachment: '',
    issueDate: '',
    reviewResult: '',
  }
}

function normalizeRecord(record: LegacyWarrantySource): WarrantyRecord {
  const issueDate = record.issueDate ? normalizeDate(record.issueDate) : ''
  const requestDate = record.requestDate
    ? normalizeDate(record.requestDate)
    : issueDate
      ? subtractDaysFromDate(issueDate, 7)
      : ''

  return {
    id: record.id,
    issueDate,
    requestDate,
    requester: record.requester ?? '',
    region: normalizeLegacyRegion(record.region ?? ''),
    detailRegion: record.detailRegion ?? '',
    customer: record.customer ?? '',
    colorName: record.colorName ?? '',
    paintCompany: record.paintCompany ?? '',
    resin: record.resin ?? '',
    additionalRequest: record.additionalRequest ?? '',
    fileAttachment: serializeFileAttachments(parseFileAttachments(record.fileAttachment ?? '')),
    reviewResult: record.reviewResult ?? '',
  }
}

function ensureIds(raw: LegacyWarrantySource[]): WarrantyRecord[] {
  return raw.map((record, index) =>
    normalizeRecord({
      ...record,
      id: record.id ? record.id : `row-${index}-${crypto.randomUUID()}`,
    })
  )
}

export function loadWarrantyRecords(): WarrantyRecord[] {
  try {
    const version = localStorage.getItem(STORAGE_VERSION_KEY)
    const saved = localStorage.getItem(STORAGE_KEY)
    if (version === CURRENT_VERSION && saved) {
      return ensureIds(JSON.parse(saved) as LegacyWarrantySource[])
    }
    if (saved && version !== CURRENT_VERSION) {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // fall through to default data
  }
  const records = ensureIds(defaultData as LegacyWarrantySource[])
  localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION)
  return records
}

/** Reads issuance log records for one-time migration (ignores storage version). */
export function loadWarrantyRecordsForMigration(): WarrantyRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return ensureIds(JSON.parse(saved) as LegacyWarrantySource[])
    }
  } catch {
    // fall through
  }
  return ensureIds(defaultData as LegacyWarrantySource[])
}

export function saveWarrantyRecords(records: WarrantyRecord[]): void {
  const normalized = records.map(normalizeRecord)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION)
}

export function getEditableDateParts(issueDate: string): {
  year: string
  month: string
  day: string
} {
  if (!issueDate) return { year: '', month: '', day: '' }

  const normalized = normalizeDate(issueDate)
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [year, month, day] = normalized.split('-')
    return { year, month, day }
  }

  const parts = issueDate.split('-')
  return {
    year: parts[0] ?? '',
    month: parts[1] ?? '',
    day: parts[2] ?? '',
  }
}

export function updateIssueDatePart(
  issueDate: string,
  part: 'year' | 'month' | 'day',
  value: string
): string {
  const { year: y0, month: m0, day: d0 } = getEditableDateParts(issueDate)
  let year = y0
  let month = m0
  let day = d0

  const cleaned = value.replace(/\D/g, '')
  if (part === 'year') year = cleaned.slice(0, 4)
  if (part === 'month') month = cleaned.slice(0, 2)
  if (part === 'day') day = cleaned.slice(0, 2)

  if (!year && !month && !day) return ''
  if (year.length === 4 && month.length === 2 && day.length === 2) {
    return normalizeDate(`${year}${month}${day}`)
  }

  return [year, month, day].filter(Boolean).join('-')
}
