import {
  WARRANTY_REQUEST_STATUS_COMPLETED,
  WARRANTY_REQUEST_STATUS_IN_PROGRESS,
  WARRANTY_REQUEST_STATUS_PENDING,
} from '../constants/warrantyRequestStatus'
import type { WarrantyIssuanceRequest } from '../types'
import { parseFileAttachments } from './warrantyAttachments'

export function countRequestsByStatus(
  records: { status: string }[]
): Record<string, number> {
  const counts: Record<string, number> = {
    [WARRANTY_REQUEST_STATUS_PENDING]: 0,
    [WARRANTY_REQUEST_STATUS_IN_PROGRESS]: 0,
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

const LEGACY_STATUS_MAP: Record<string, string> = {
  접수: WARRANTY_REQUEST_STATUS_PENDING,
}

export function normalizeRequestStatus(status: string): string {
  const trimmed = status.trim()
  if (!trimmed) return WARRANTY_REQUEST_STATUS_PENDING
  return LEGACY_STATUS_MAP[trimmed] ?? trimmed
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
    normalized === WARRANTY_REQUEST_STATUS_IN_PROGRESS ||
    normalized === WARRANTY_REQUEST_STATUS_COMPLETED
  )
}

export function canPromoteToInProgress(status: string): boolean {
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

  const hasCompanyWarranty =
    parseFileAttachments(form.companyWarrantyAttachmentKo).length > 0 ||
    parseFileAttachments(form.companyWarrantyAttachmentEn).length > 0
  if (!hasCompanyWarranty) {
    return '당사 Warranty 국문 또는 영문 파일을 첨부해 주세요.'
  }

  const hasSupplierWarranty =
    parseFileAttachments(form.supplierWarrantyAttachmentKo).length > 0 ||
    parseFileAttachments(form.supplierWarrantyAttachmentEn).length > 0
  if (!hasSupplierWarranty) {
    return '도료사 Warranty 국문 또는 영문 파일을 첨부해 주세요.'
  }

  return null
}

export function resolveStatusAfterSave(
  currentStatus: string,
  editScope: 'request' | 'quality'
): string {
  const status = normalizeRequestStatus(currentStatus)
  if (editScope === 'quality' && status === WARRANTY_REQUEST_STATUS_IN_PROGRESS) {
    return WARRANTY_REQUEST_STATUS_COMPLETED
  }
  return status
}
