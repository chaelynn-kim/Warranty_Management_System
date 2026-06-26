import type { WarrantyIssuanceRequest, WarrantyIssuanceRequestRecord } from '../types'
import { joinMultiValue, parseMultiValue } from '../constants/warrantyOptions'
import { parseCoatingStructures } from './warrantyPeriodLookup'
import {
  WARRANTY_REQUEST_DETAIL_REGION_CUSTOM,
  WARRANTY_REQUEST_MATERIAL_OTHER,
  WARRANTY_REQUEST_PAINT_COMPANY_OTHER,
  WARRANTY_REQUEST_RESIN_ALL,
  WARRANTY_REQUEST_RESIN_OTHER,
  WARRANTY_REQUEST_TEAM_OTHER,
  WARRANTY_TERM_OTHER,
} from '../constants/warrantyRequestOptions'
import { WARRANTY_REQUEST_STATUS_PENDING } from '../constants/warrantyRequestStatus'
import { normalizeDate } from './helpers'
import { queueFirestorePush } from './firestoreSync'
import { normalizeRequestStatus } from './warrantyRequestStatus'

const STORAGE_KEY = 'warranty-issuance-requests'
const STORAGE_VERSION_KEY = 'warranty-issuance-requests-version'
const CURRENT_VERSION = '14'

function normalizeDetailRegionValue(detailRegion: string): string {
  return joinMultiValue(
    parseMultiValue(detailRegion).map((part) => (part === '직접 입력' ? WARRANTY_REQUEST_DETAIL_REGION_CUSTOM : part))
  )
}

function compareRequestRecordsBySequenceDesc(
  a: WarrantyIssuanceRequestRecord,
  b: WarrantyIssuanceRequestRecord
): number {
  const noA = a.sequenceNo ?? 0
  const noB = b.sequenceNo ?? 0
  if (noA !== noB) return noB - noA

  const dateA = a.requestDate || ''
  const dateB = b.requestDate || ''
  if (dateA !== dateB) return dateB.localeCompare(dateA)

  return b.id.localeCompare(a.id)
}

export function sortWarrantyRequestRecordsBySequenceDesc(
  records: WarrantyIssuanceRequestRecord[]
): WarrantyIssuanceRequestRecord[] {
  return [...records].sort(compareRequestRecordsBySequenceDesc)
}

/** 정렬 후 No를 최댓값부터 1씩 감소하며 연속 번호로 재부여 (예: 41, 40, 39 …) */
export function resequenceWarrantyRequestRecordsBySequenceDesc(
  records: WarrantyIssuanceRequestRecord[]
): WarrantyIssuanceRequestRecord[] {
  const sorted = sortWarrantyRequestRecordsBySequenceDesc(records)
  if (sorted.length === 0) return sorted

  const currentMax = sorted.reduce((max, record) => Math.max(max, record.sequenceNo ?? 0), 0)
  const peakNo = Math.max(currentMax, sorted.length)

  return sorted.map((record, index) => ({
    ...record,
    sequenceNo: peakNo - index,
  }))
}

function assignSequenceNumbers(
  records: WarrantyIssuanceRequestRecord[]
): WarrantyIssuanceRequestRecord[] {
  const needsBackfill = records.some(
    (record) => typeof record.sequenceNo !== 'number' || record.sequenceNo <= 0
  )
  if (!needsBackfill) return records

  const sorted = [...records].sort((a, b) => {
    const dateA = a.requestDate || ''
    const dateB = b.requestDate || ''
    if (dateA !== dateB) return dateA.localeCompare(dateB)
    return a.id.localeCompare(b.id)
  })

  const idToSequenceNo = new Map(sorted.map((record, index) => [record.id, index + 1]))

  return records.map((record) => ({
    ...record,
    sequenceNo:
      typeof record.sequenceNo === 'number' && record.sequenceNo > 0
        ? record.sequenceNo
        : idToSequenceNo.get(record.id)!,
  }))
}

export function createRequestRecord(
  request: WarrantyIssuanceRequest,
  existingRecords: WarrantyIssuanceRequestRecord[] = [],
  options?: { requesterEmail?: string }
): WarrantyIssuanceRequestRecord {
  const maxSequenceNo = existingRecords.reduce(
    (max, record) => Math.max(max, record.sequenceNo ?? 0),
    0
  )

  const requesterEmail = options?.requesterEmail?.trim() ?? ''

  return {
    id: crypto.randomUUID(),
    status: WARRANTY_REQUEST_STATUS_PENDING,
    sequenceNo: maxSequenceNo + 1,
    ...(requesterEmail ? { requesterEmail } : {}),
    ...request,
  }
}

function normalizeCoatingStructure(value: string): string {
  return joinMultiValue(parseCoatingStructures(value))
}

function normalizeRequestRecord(record: WarrantyIssuanceRequestRecord): WarrantyIssuanceRequestRecord {
  const legacy = record as WarrantyIssuanceRequestRecord & {
    reviewMemo?: string
    fileAttachment?: string
    companyWarrantyAttachment?: string
    supplierWarrantyAttachment?: string
  }
  const legacyFileAttachment = legacy.fileAttachment ?? ''
  const legacyCompany =
    legacy.companyWarrantyAttachment ?? record.companyWarrantyAttachmentKo ?? legacyFileAttachment
  const legacySupplier =
    legacy.supplierWarrantyAttachment ?? record.supplierWarrantyAttachmentKo ?? ''

  return {
    ...record,
    requestDate: record.requestDate ? normalizeDate(record.requestDate) : record.requestDate,
    issueDate: record.issueDate ? normalizeDate(record.issueDate) : '',
    companyWarrantyAttachmentKo: record.companyWarrantyAttachmentKo ?? legacyCompany,
    companyWarrantyAttachmentEn: record.companyWarrantyAttachmentEn ?? '',
    supplierWarrantyAttachmentKo: record.supplierWarrantyAttachmentKo ?? legacySupplier,
    supplierWarrantyAttachmentEn: record.supplierWarrantyAttachmentEn ?? '',
    resinCustom: record.resinCustom ?? '',
    paintCompanyCustom: record.paintCompanyCustom ?? '',
    materialCustom: record.materialCustom ?? '',
    qualityAuthor: record.qualityAuthor ?? '',
    totalCoatingThickness: record.totalCoatingThickness ?? '',
    primerThickness: record.primerThickness ?? '',
    companyWarrantyTerms: record.companyWarrantyTerms ?? '',
    companyWarrantyTermsLookupKey: record.companyWarrantyTermsLookupKey ?? '',
    warrantyTermAttachments: record.warrantyTermAttachments ?? '',
    additionalRequestAttachments:
      record.additionalRequestAttachments ??
      (record.warrantyTermAttachments?.trim() ? record.warrantyTermAttachments : ''),
    reviewResult: record.reviewResult ?? legacy.reviewMemo ?? '',
    status: normalizeRequestStatus(record.status),
    coatingStructure: normalizeCoatingStructure(record.coatingStructure ?? ''),
    detailRegion: normalizeDetailRegionValue(record.detailRegion ?? ''),
    requesterEmail: record.requesterEmail?.trim() ?? '',
  }
}

export function loadWarrantyRequestRecords(): WarrantyIssuanceRequestRecord[] {
  try {
    const version = localStorage.getItem(STORAGE_VERSION_KEY)
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as WarrantyIssuanceRequestRecord[]
      const normalized = resequenceWarrantyRequestRecordsBySequenceDesc(
        assignSequenceNumbers(parsed.map(normalizeRequestRecord))
      )
      if (version !== CURRENT_VERSION) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
        localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION)
      }
      return normalized
    }
  } catch {
    // fall through
  }
  localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION)
  return []
}

export function saveWarrantyRequestRecords(records: WarrantyIssuanceRequestRecord[]): void {
  const normalized = resequenceWarrantyRequestRecordsBySequenceDesc(
    assignSequenceNumbers(records.map(normalizeRequestRecord))
  )
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION)
  queueFirestorePush('warranty-issuance-requests')
}

export function formatRequestTeam(record: WarrantyIssuanceRequest): string {
  if (record.requestTeam === WARRANTY_REQUEST_TEAM_OTHER) {
    return record.requestTeamCustom.trim() || '-'
  }
  return record.requestTeam.trim() || '-'
}

export function formatRequestDetailRegion(record: WarrantyIssuanceRequest): string {
  const selected = parseMultiValue(record.detailRegion)
  const labels = selected.filter((item) => item !== WARRANTY_REQUEST_DETAIL_REGION_CUSTOM)

  if (selected.includes(WARRANTY_REQUEST_DETAIL_REGION_CUSTOM) && record.detailRegionCustom.trim()) {
    labels.push(record.detailRegionCustom.trim())
  }

  return labels.length > 0 ? labels.join(', ') : '-'
}

export function formatRequestResin(record: WarrantyIssuanceRequest): string {
  const selected = parseMultiValue(record.resin)
  if (selected.includes(WARRANTY_REQUEST_RESIN_ALL)) return WARRANTY_REQUEST_RESIN_ALL

  const labels = selected.filter(
    (item) => item !== WARRANTY_REQUEST_RESIN_ALL && item !== WARRANTY_REQUEST_RESIN_OTHER
  )
  if (selected.includes(WARRANTY_REQUEST_RESIN_OTHER) && record.resinCustom.trim()) {
    labels.push(record.resinCustom.trim())
  }

  return labels.length > 0 ? labels.join(', ') : '-'
}

export function formatRequestMaterial(record: WarrantyIssuanceRequest): string {
  const selected = parseMultiValue(record.material)
  const labels = selected.filter((item) => item !== WARRANTY_REQUEST_MATERIAL_OTHER)

  if (selected.includes(WARRANTY_REQUEST_MATERIAL_OTHER) && record.materialCustom.trim()) {
    labels.push(record.materialCustom.trim())
  }

  return labels.length > 0 ? labels.join(', ') : '-'
}

export function formatRequestPaintCompany(record: WarrantyIssuanceRequest): string {
  const selected = parseMultiValue(record.paintCompany)
  const labels = selected.filter((item) => item !== WARRANTY_REQUEST_PAINT_COMPANY_OTHER)

  if (selected.includes(WARRANTY_REQUEST_PAINT_COMPANY_OTHER) && record.paintCompanyCustom.trim()) {
    labels.push(record.paintCompanyCustom.trim())
  }

  return labels.length > 0 ? labels.join(', ') : '-'
}

export function formatRequestWarrantyTerm(record: WarrantyIssuanceRequest): string {
  if (record.warrantyTermMode === WARRANTY_TERM_OTHER) {
    return record.warrantyTermCustom.trim() || '-'
  }
  return record.warrantyTermMode.trim() || '-'
}

export function displayRequestValue(value: string): string {
  return value.trim() || '-'
}

export function toWarrantyIssuanceRequest(
  record: WarrantyIssuanceRequestRecord
): WarrantyIssuanceRequest {
  const { id: _id, status: _status, sequenceNo: _sequenceNo, ...request } = record
  return request
}
