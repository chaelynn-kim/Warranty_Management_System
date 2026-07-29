import type { WarrantyIssuanceRequest, WarrantyIssuanceRequestRecord } from '../types'
import { joinMultiValue, parseMultiValue } from '../constants/warrantyOptions'
import {
  WARRANTY_REQUEST_DETAIL_REGION_CUSTOM,
  WARRANTY_REQUEST_MATERIAL_OTHER,
  WARRANTY_REQUEST_PAINT_COMPANY_OTHER,
  WARRANTY_REQUEST_RESIN_OTHER,
} from '../constants/warrantyRequestOptions'
import { parseCoatingStructures } from './warrantyPeriodLookup'

export const DUPLICATE_REQUEST_NOTICE = '동일한 내용의 의뢰 이력이 있습니다.'
export const DUPLICATE_REQUEST_CONFIRM_MESSAGE =
  '동일한 내용의 의뢰 이력이 있습니다. 기존 의뢰를 확인하시겠습니까?'

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** 기타/직접입력 옵션을 실제 입력값으로 치환한 뒤 비교용 정규화 */
function normalizeChoiceField(value: string, custom: string, otherToken: string): string {
  const resolved = parseMultiValue(value).map((part) => {
    if (part === otherToken || part === '직접 입력') {
      return custom.trim()
    }
    return part.trim()
  })
  return joinMultiValue(
    [...new Set(resolved.map(normalizeToken).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  )
}

function normalizePlain(value: string): string {
  return normalizeToken(value)
}

function normalizeCoating(value: string): string {
  return joinMultiValue(
    [...new Set(parseCoatingStructures(value).map(normalizeToken).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b)
    )
  )
}

/**
 * 요청자 정보 제외 — 제품 정보 + 보증 국가 정보(국가·세부 국가명) 기준 지문
 */
export function buildWarrantyRequestContentFingerprint(
  request: Pick<
    WarrantyIssuanceRequest,
    | 'productItem'
    | 'colorName'
    | 'resin'
    | 'resinCustom'
    | 'paintCompany'
    | 'paintCompanyCustom'
    | 'material'
    | 'materialCustom'
    | 'coatingStructure'
    | 'region'
    | 'detailRegion'
    | 'detailRegionCustom'
  >
): string {
  return [
    normalizePlain(request.productItem),
    normalizePlain(request.colorName),
    normalizeChoiceField(request.resin, request.resinCustom, WARRANTY_REQUEST_RESIN_OTHER),
    normalizeChoiceField(
      request.paintCompany,
      request.paintCompanyCustom,
      WARRANTY_REQUEST_PAINT_COMPANY_OTHER
    ),
    normalizeChoiceField(request.material, request.materialCustom, WARRANTY_REQUEST_MATERIAL_OTHER),
    normalizeCoating(request.coatingStructure),
    normalizePlain(request.region),
    normalizeChoiceField(
      request.detailRegion,
      request.detailRegionCustom,
      WARRANTY_REQUEST_DETAIL_REGION_CUSTOM
    ),
  ].join('|')
}

/** 동일 제품·국가 내용의 기존 의뢰(최신 1건). excludeId는 자기 자신 제외용 */
export function findDuplicateWarrantyRequest(
  candidate: WarrantyIssuanceRequest,
  records: WarrantyIssuanceRequestRecord[],
  excludeId?: string
): WarrantyIssuanceRequestRecord | null {
  const fingerprint = buildWarrantyRequestContentFingerprint(candidate)
  if (!fingerprint.replace(/\|/g, '')) return null

  const matches = records
    .filter((record) => record.id !== excludeId)
    .filter((record) => buildWarrantyRequestContentFingerprint(record) === fingerprint)
    .sort((a, b) => (b.sequenceNo ?? 0) - (a.sequenceNo ?? 0))

  return matches[0] ?? null
}
