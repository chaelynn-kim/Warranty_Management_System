import {
  WARRANTY_REQUEST_STATUS_COMPLETED,
  WARRANTY_REQUEST_STATUS_PENDING,
  WARRANTY_REQUEST_STATUS_RECEIVED,
} from '../constants/warrantyRequestStatus'
import type { WarrantyIssuanceRequest } from '../types'

const LEGACY_STATUS_IN_PROGRESS = '작성 중'

export function countRequestsByStatus(
  records: { status: string }[]
): Record<string, number> {
  const counts: Record<string, number> = {
    [WARRANTY_REQUEST_STATUS_PENDING]: 0,
    [WARRANTY_REQUEST_STATUS_RECEIVED]: 0,
    [WARRANTY_REQUEST_STATUS_COMPLETED]: 0,
  }

  for (const record of records) {
    const status = normalizeRequestStatus(record.status)
    if (status in counts) {
      counts[status] += 1
    }
  }

  return counts
}

export function normalizeRequestStatus(status: string): string {
  const trimmed = status.trim()
  if (!trimmed) return WARRANTY_REQUEST_STATUS_PENDING
  if (trimmed === LEGACY_STATUS_IN_PROGRESS) return WARRANTY_REQUEST_STATUS_RECEIVED
  return trimmed
}

export function canEditRequestFields(status: string): boolean {
  const normalized = normalizeRequestStatus(status)
  return (
    normalized === WARRANTY_REQUEST_STATUS_PENDING ||
    normalized === WARRANTY_REQUEST_STATUS_COMPLETED
  )
}

export function canEditQualityFields(status: string): boolean {
  const normalized = normalizeRequestStatus(status)
  return (
    normalized === WARRANTY_REQUEST_STATUS_RECEIVED ||
    normalized === WARRANTY_REQUEST_STATUS_COMPLETED
  )
}

export function canPromoteToReceived(status: string): boolean {
  return normalizeRequestStatus(status) === WARRANTY_REQUEST_STATUS_PENDING
}

export function canStartQualityEdit(status: string): boolean {
  return canEditQualityFields(status)
}

export function isRequestCompleted(status: string): boolean {
  return normalizeRequestStatus(status) === WARRANTY_REQUEST_STATUS_COMPLETED
}

export function validateQualityCompletion(form: WarrantyIssuanceRequest): string | null {
  if (!form.issueDate.trim()) return '발행일자를 입력해 주세요.'

  return null
}

export function resolveStatusAfterSave(
  currentStatus: string,
  editScope: 'request' | 'quality'
): string {
  const status = normalizeRequestStatus(currentStatus)
  if (editScope === 'quality' && status === WARRANTY_REQUEST_STATUS_RECEIVED) {
    return WARRANTY_REQUEST_STATUS_COMPLETED
  }
  return status
}
