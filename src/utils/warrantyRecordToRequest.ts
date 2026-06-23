import { joinMultiValue, parseMultiValue } from '../constants/warrantyOptions'
import {
  detailRegionsForArea,
  WARRANTY_REQUEST_DETAIL_REGION_CUSTOM,
} from '../constants/warrantyRequestOptions'
import {
  WARRANTY_REQUEST_STATUS_COMPLETED,
  WARRANTY_REQUEST_STATUS_PENDING,
} from '../constants/warrantyRequestStatus'
import type { WarrantyIssuanceRequest, WarrantyIssuanceRequestRecord, WarrantyRecord } from '../types'
import {
  mergeLegacyAdditionalRequest,
  normalizeLegacyRegion,
  type LegacyWarrantySource,
} from './warrantyLegacyFields'

const DETAIL_REGION_ALIASES: Record<string, string> = {
  Thailand: '태국',
  thailand: '태국',
}

function mapDetailRegion(
  region: string,
  rawDetail: string
): Pick<WarrantyIssuanceRequest, 'detailRegion' | 'detailRegionCustom'> {
  const parts = parseMultiValue(rawDetail.replace(/\n/g, ' '))
  if (parts.length === 0) {
    return { detailRegion: '', detailRegionCustom: '' }
  }

  const options = detailRegionsForArea(region)
  const matched: string[] = []
  const customParts: string[] = []

  for (const part of parts) {
    const normalized = DETAIL_REGION_ALIASES[part] ?? part
    if (options.includes(normalized as (typeof options)[number])) {
      if (!matched.includes(normalized)) matched.push(normalized)
    } else {
      customParts.push(part)
    }
  }

  if (customParts.length > 0) {
    return {
      detailRegion: joinMultiValue([...matched, WARRANTY_REQUEST_DETAIL_REGION_CUSTOM]),
      detailRegionCustom: customParts.join(', '),
    }
  }

  return {
    detailRegion: joinMultiValue(matched.length > 0 ? matched : parts),
    detailRegionCustom: '',
  }
}

export function warrantyRecordToRequest(record: WarrantyRecord): WarrantyIssuanceRequestRecord {
  const source = record as LegacyWarrantySource
  const region = normalizeLegacyRegion(source.region)
  const { detailRegion, detailRegionCustom } = mapDetailRegion(region, source.detailRegion ?? '')
  const hasIssueDate = Boolean(source.issueDate.trim())

  return {
    id: source.id,
    status: hasIssueDate ? WARRANTY_REQUEST_STATUS_COMPLETED : WARRANTY_REQUEST_STATUS_PENDING,
    sequenceNo: 0,
    requestDate: source.requestDate,
    requestTeam: '',
    requestTeamCustom: '',
    requesterName: source.requester ?? '',
    colorName: source.colorName,
    resin: source.resin,
    resinCustom: '',
    paintCompany: source.paintCompany,
    material: '',
    materialCustom: '',
    coatingStructure: '',
    productItem: '',
    region,
    detailRegion,
    detailRegionCustom,
    customer: source.customer,
    usage: '',
    language: '',
    warrantyTermMode: '',
    warrantyTermCustom: '',
    additionalRequest: mergeLegacyAdditionalRequest(source),
    companyWarrantyAttachmentKo: source.fileAttachment ?? '',
    companyWarrantyAttachmentEn: '',
    supplierWarrantyAttachmentKo: '',
    supplierWarrantyAttachmentEn: '',
    issueDate: source.issueDate,
    qualityAuthor: '',
    reviewResult: source.reviewResult ?? '',
  }
}
