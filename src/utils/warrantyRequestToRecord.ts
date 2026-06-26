import type { WarrantyIssuanceRequest, WarrantyRecord } from '../types'
import { formatRequestPaintCompany, formatRequestResin } from './warrantyRequestStorage'

function displayOrDash(value: string): string {
  const trimmed = value.trim()
  return trimmed || '-'
}

function formatDetailRegionFromRequest(request: WarrantyIssuanceRequest): string {
  const parts: string[] = []
  if (request.detailRegion.trim()) parts.push(request.detailRegion.replace(/,/g, ', '))
  if (request.detailRegionCustom.trim()) parts.push(request.detailRegionCustom.trim())
  return parts.join(', ')
}

export function warrantyRequestToRecord(request: WarrantyIssuanceRequest): WarrantyRecord {
  return {
    id: crypto.randomUUID(),
    requestDate: displayOrDash(request.requestDate),
    requester: displayOrDash(request.requesterName),
    region: displayOrDash(request.region),
    detailRegion: displayOrDash(formatDetailRegionFromRequest(request)),
    customer: displayOrDash(request.customer),
    colorName: displayOrDash(request.colorName),
    paintCompany: displayOrDash(formatRequestPaintCompany(request)),
    resin: displayOrDash(formatRequestResin(request)),
    additionalRequest: displayOrDash(request.additionalRequest),
    fileAttachment: '',
    issueDate: '',
    reviewResult: '-',
  }
}
