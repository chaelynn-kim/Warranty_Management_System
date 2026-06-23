import type { ExternalTestRecord } from '../types'
import { matchesTextFilter } from './filterHelpers'

export interface ExternalTestSearchFilters {
  purpose: string
  sampleName: string
  institution: string
  other: string
}

export const emptyExternalTestSearch: ExternalTestSearchFilters = {
  purpose: '',
  sampleName: '',
  institution: '',
  other: '',
}

export function hasActiveExternalTestSearch(filters: ExternalTestSearchFilters): boolean {
  return Object.values(filters).some((value) => value.trim() !== '')
}

const OTHER_SEARCH_FIELDS: (keyof ExternalTestRecord)[] = [
  'no',
  'colorName',
  'workshop',
  'productionDate',
  'itemCode',
  'itemName',
  'resin',
  'requestDate',
  'receiptDate',
  'completionDate',
  'status',
  'notes',
]

function matchesOtherSearch(query: string, record: ExternalTestRecord): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return OTHER_SEARCH_FIELDS.some((field) =>
    String(record[field] ?? '')
      .toLowerCase()
      .includes(q)
  )
}

export function recordMatchesExternalTestSearch(
  record: ExternalTestRecord,
  filters: ExternalTestSearchFilters
): boolean {
  return (
    matchesTextFilter(filters.purpose, record.purpose) &&
    matchesTextFilter(filters.sampleName, record.sampleName) &&
    matchesTextFilter(filters.institution, record.institution) &&
    matchesOtherSearch(filters.other, record)
  )
}

export function filterExternalTestRecords(
  records: ExternalTestRecord[],
  filters: ExternalTestSearchFilters
): ExternalTestRecord[] {
  if (!hasActiveExternalTestSearch(filters)) return records
  return records.filter((record) => recordMatchesExternalTestSearch(record, filters))
}
