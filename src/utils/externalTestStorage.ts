import defaultData from '../data/externalTestList.json'
import type { ExternalTestRecord } from '../types'
import { normalizeExternalTestStatus } from '../constants/externalTestOptions'
import { queueFirestorePush } from './firestoreSync'
import { normalizeDate } from './helpers'

const STORAGE_KEY = 'external-test-records'
const STORAGE_VERSION_KEY = 'external-test-version'
const CURRENT_VERSION = '1'

function normalizeRecord(record: ExternalTestRecord): ExternalTestRecord {
  return {
    ...record,
    productionDate: record.productionDate ? normalizeDate(record.productionDate) : '',
    requestDate: record.requestDate ? normalizeDate(record.requestDate) : '',
    receiptDate: record.receiptDate ? normalizeDate(record.receiptDate) : '',
    completionDate: record.completionDate ? normalizeDate(record.completionDate) : '',
    status: normalizeExternalTestStatus(record.status),
  }
}

function ensureIds(raw: Array<ExternalTestRecord | Omit<ExternalTestRecord, 'id'>>): ExternalTestRecord[] {
  return raw.map((record, index) =>
    normalizeRecord({
      ...record,
      id: 'id' in record && record.id ? record.id : `row-${index}-${crypto.randomUUID()}`,
    } as ExternalTestRecord)
  )
}

function compareRecordNoDesc(a: ExternalTestRecord, b: ExternalTestRecord): number {
  const noA = parseInt(a.no, 10) || 0
  const noB = parseInt(b.no, 10) || 0
  return noB - noA
}

export function compareExternalTestByNoDesc(
  a: ExternalTestRecord,
  b: ExternalTestRecord
): number {
  return compareRecordNoDesc(a, b)
}

export function sortExternalTestRecordsByNoDesc(
  records: ExternalTestRecord[]
): ExternalTestRecord[] {
  return [...records].sort(compareExternalTestByNoDesc)
}

export function createEmptyExternalTestRecord(records: ExternalTestRecord[]): ExternalTestRecord {
  const numbers = records
    .map((r) => parseInt(r.no, 10))
    .filter((n) => !Number.isNaN(n))
  const nextNo = numbers.length > 0 ? Math.max(...numbers) + 1 : 1

  return {
    id: crypto.randomUUID(),
    no: String(nextNo),
    purpose: '',
    sampleName: '',
    colorName: '',
    workshop: '',
    productionDate: '',
    itemCode: '',
    itemName: '',
    resin: '',
    requestDate: '',
    receiptDate: '',
    completionDate: '',
    notes: '',
    status: '진행중',
    institution: '',
  }
}

export function loadExternalTestRecords(): ExternalTestRecord[] {
  try {
    const version = localStorage.getItem(STORAGE_VERSION_KEY)
    const saved = localStorage.getItem(STORAGE_KEY)
    if (version === CURRENT_VERSION && saved) {
      return sortExternalTestRecordsByNoDesc(
        ensureIds(JSON.parse(saved) as ExternalTestRecord[])
      )
    }
    if (saved && version !== CURRENT_VERSION) {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // fall through
  }
  const records = sortExternalTestRecordsByNoDesc(
    ensureIds(defaultData as Array<Omit<ExternalTestRecord, 'id'>>)
  )
  localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION)
  return records
}

export function saveExternalTestRecords(records: ExternalTestRecord[]): void {
  const normalized = sortExternalTestRecordsByNoDesc(records.map(normalizeRecord))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION)
  queueFirestorePush('external-test-records')
}
