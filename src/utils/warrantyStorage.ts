import defaultData from '../data/warrantyIssuance.json'
import type { WarrantyRecord } from '../types'
import { normalizeDate, formatFadeForStorage } from './helpers'

const STORAGE_KEY = 'warranty-issuance-records'
const STORAGE_VERSION_KEY = 'warranty-issuance-version'
const CURRENT_VERSION = '2'

export function createEmptyWarrantyRecord(): WarrantyRecord {
  return {
    id: crypto.randomUUID(),
    issueDate: '',
    region: '',
    customer: '',
    colorName: '',
    paintCompany: '',
    resin: '',
    totalThickness: '',
    primerThickness: '',
    coat: '',
    bake: '',
    companyPeel: '',
    companyFadeRoof: '',
    companyFadeWall: '',
    companyChalkRoof: '',
    companyChalkWall: '',
    supplierPeel: '',
    supplierFadeRoof: '',
    supplierFadeWall: '',
    supplierChalkRoof: '',
    supplierChalkWall: '',
    notes: '',
  }
}

function normalizeRecord(record: WarrantyRecord): WarrantyRecord {
  return {
    ...record,
    issueDate: record.issueDate ? normalizeDate(record.issueDate) : '',
    companyFadeRoof: formatFadeForStorage(record.companyFadeRoof),
    companyFadeWall: formatFadeForStorage(record.companyFadeWall),
    companyChalkRoof: formatFadeForStorage(record.companyChalkRoof),
    companyChalkWall: formatFadeForStorage(record.companyChalkWall),
    supplierFadeRoof: formatFadeForStorage(record.supplierFadeRoof),
    supplierFadeWall: formatFadeForStorage(record.supplierFadeWall),
    supplierChalkRoof: formatFadeForStorage(record.supplierChalkRoof),
    supplierChalkWall: formatFadeForStorage(record.supplierChalkWall),
  }
}

function ensureIds(raw: Omit<WarrantyRecord, 'id'>[] | WarrantyRecord[]): WarrantyRecord[] {
  return raw.map((record, index) =>
    normalizeRecord({
      ...record,
      id: 'id' in record && record.id ? record.id : `row-${index}-${crypto.randomUUID()}`,
    })
  )
}

export function loadWarrantyRecords(): WarrantyRecord[] {
  try {
    const version = localStorage.getItem(STORAGE_VERSION_KEY)
    const saved = localStorage.getItem(STORAGE_KEY)
    if (version === CURRENT_VERSION && saved) {
      return ensureIds(JSON.parse(saved) as WarrantyRecord[])
    }
    if (saved && version !== CURRENT_VERSION) {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // fall through to default data
  }
  const records = ensureIds(defaultData as WarrantyRecord[])
  localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION)
  return records
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
