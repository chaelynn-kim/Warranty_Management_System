import type { WarrantyIssuanceRequestRecord } from '../types'
import { formatRequestDetailRegion } from './warrantyRequestStorage'
import { isValidDateStr, normalizeDate } from './helpers'

export function filterRecordsByKeyword(
  records: WarrantyIssuanceRequestRecord[],
  query: string
): WarrantyIssuanceRequestRecord[] {
  const q = query.trim().toLowerCase()
  if (!q) return records

  return records.filter((record) => {
    const fields = [
      record.requesterName,
      record.colorName,
      record.resin,
      formatRequestDetailRegion(record),
      record.customer,
    ]
    return fields.some((field) => field.toLowerCase().includes(q))
  })
}

export function filterRecordsByIssueDateRange(
  records: WarrantyIssuanceRequestRecord[],
  from: string,
  to: string
): WarrantyIssuanceRequestRecord[] {
  const fromNorm = from ? normalizeDate(from) : ''
  const toNorm = to ? normalizeDate(to) : ''

  if (!fromNorm && !toNorm) return records

  return records.filter((record) => {
    const issueDate = normalizeDate(record.issueDate)
    if (!issueDate || !isValidDateStr(issueDate)) return false
    if (fromNorm && issueDate < fromNorm) return false
    if (toNorm && issueDate > toNorm) return false
    return true
  })
}

export function validateRequestDateRange(from: string, to: string): string | null {
  const fromNorm = from.trim()
  const toNorm = to.trim()

  if (fromNorm && !isValidDateStr(fromNorm)) {
    return '발행일자 형식이 올바르지 않습니다. (YYYY-MM-DD)'
  }
  if (toNorm && !isValidDateStr(toNorm)) {
    return '발행일자 형식이 올바르지 않습니다. (YYYY-MM-DD)'
  }
  if (fromNorm && toNorm && normalizeDate(fromNorm) > normalizeDate(toNorm)) {
    return '발행일자 시작값은 종료값보다 이후일 수 없습니다.'
  }
  return null
}
