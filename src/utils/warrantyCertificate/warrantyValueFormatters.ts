import type { ProductWarranty } from '../../types'
import { parseMultiValue } from '../../constants/warrantyOptions'
import {
  WARRANTY_REQUEST_RESIN_ALL,
  WARRANTY_REQUEST_RESIN_OTHER,
} from '../../constants/warrantyRequestOptions'
import { productItemToLine } from '../warrantyPeriodLookup'
import { resolveProductLine } from '../productWarrantyHelpers'

function normalizeProductGroupKey(value: string): string {
  return value.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase()
}

function paintResinMatchesProduct(resin: string, product: ProductWarranty): boolean {
  if (resolveProductLine(product) !== 'paint') return false

  const group = normalizeProductGroupKey(product.productGroup)
  const resinKey = normalizeProductGroupKey(resin)

  if (resinKey === 'RMP') return group === 'RMP'
  if (resinKey === 'MATT') return group === 'MATT' || group === 'RMP MATT'
  if (resinKey === 'ADP') return group === 'ADP'
  if (resinKey === 'NDP') return group === 'NDP'
  if (resinKey === 'HDP') return group === 'HDP'
  if (resinKey === 'SMP') return group === 'SMP'
  if (resinKey === 'URETHANE') return group === 'URETHANE'
  if (resinKey === 'SQP40') return group === 'SQP40'
  if (resinKey === 'SQP40 MATT') return group === 'SQP40 MATT'
  if (resinKey === 'PVDF') return group === 'PVDF'

  return group === resinKey
}

function printResinMatchesProduct(resin: string, product: ProductWarranty): boolean {
  if (resolveProductLine(product) !== 'print') return false

  const group = normalizeProductGroupKey(product.productGroup)
  const resinPrefix = group.split(' ')[0]
  const resinKey = normalizeProductGroupKey(resin)

  if (resinKey === 'RMP') return resinPrefix === 'RMP'
  if (resinKey === 'MVP') return resinPrefix === 'MVP'
  if (resinKey === 'ADP' || resinKey === 'NDP') return resinPrefix === 'ADP'
  if (resinKey === 'PVDF') return resinPrefix === 'PVDF'

  return resinPrefix === resinKey
}

export function extractWarrantyYears(value: string): number {
  const match = value.match(/(\d+)/)
  return match ? Number.parseInt(match[1], 10) : 0
}

export function getPrimaryResinCode(resin: string, resinCustom: string): string {
  const selected = parseMultiValue(resin)
  const filtered = selected.filter(
    (item) => item !== WARRANTY_REQUEST_RESIN_ALL && item !== WARRANTY_REQUEST_RESIN_OTHER
  )
  if (filtered.length > 0) return filtered[0]
  if (selected.includes(WARRANTY_REQUEST_RESIN_OTHER) && resinCustom.trim()) {
    return resinCustom.trim()
  }
  return selected[0] ?? ''
}

export function formatIssueDateDot(date: string): string {
  const normalized = date.trim()
  if (!normalized) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized.replace(/-/g, '.')
  }
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(normalized)) {
    return normalized
  }
  return normalized
}

export function formatYearsKo(years: number): string {
  return `${years}년`
}

export function formatYearsKoSpaced(years: number): string {
  return `${years} 년`
}

export function formatYearsKoSpacedTrailing(years: number): string {
  return `${years} 년 `
}

export function formatYearsEnUpper(years: number): string {
  return `${years}YEARS `
}

export function formatYearsEnLower(years: number): string {
  return `${years}years `
}

export function formatYearsEnShort(years: number): string {
  return `${years} Y`
}

export function formatYearsPlusOneKo(years: number): string {
  return `${years + 1}년`
}

export function formatYearsPlusOneEn(years: number): string {
  return `${years + 1}years`
}

export function formatWarrantyCellKo(value: string): string {
  if (!value.trim()) return ''
  return value.replace(/\n/g, ' ').replace(/(\d+)Y/gi, '$1년')
}

export function formatWarrantyCellEn(value: string): string {
  if (!value.trim()) return ''
  return value.replace(/\n/g, ' ')
}

export function formatCoatingStructureKo(coatingStructure: string): string {
  const parts = coatingStructure
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length === 0) return ''
  return `${parts.join(', ')} `
}

export function formatCoatingStructureEn(coatingStructure: string): string {
  const parts = coatingStructure
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length === 0) return ''
  return `${parts.join(' and ')} `
}

export function formatTitleLine(resin: string, colorName: string): string {
  return `${resin} TOP ${colorName.trim()}`
}

export function hasCoatingThicknessValues(totalCoatingThickness: string, primerThickness: string): boolean {
  return totalCoatingThickness.trim().length > 0 && primerThickness.trim().length > 0
}

export function pickWarrantyProduct(
  products: ProductWarranty[],
  resin: string,
  resinCustom: string,
  productItem: string
): ProductWarranty | null {
  if (products.length === 0) return null

  const resinCode = getPrimaryResinCode(resin, resinCustom)
  if (!resinCode) return products[0]

  const line = productItemToLine(productItem)
  const matcher =
    line === 'print'
      ? (product: ProductWarranty) => printResinMatchesProduct(resinCode, product)
      : (product: ProductWarranty) => paintResinMatchesProduct(resinCode, product)

  const matched = products.filter(matcher)
  if (matched.length === 1) return matched[0]
  if (matched.length > 1) return matched[0]

  const resinUpper = resinCode.toUpperCase()
  const loose = products.find((product) =>
    normalizeProductGroupKey(product.productGroup).includes(resinUpper)
  )
  return loose ?? products[0]
}

export function getPerforationYears(product: ProductWarranty): number {
  return extractWarrantyYears(product.perforation)
}

export function getWarrantyCell(
  product: ProductWarranty,
  field: 'colorFadingRoof' | 'colorFadingWall' | 'chalkRoof' | 'chalkWall'
): string {
  const direct = product[field]?.trim()
  if (direct) return direct

  if (field === 'colorFadingRoof' || field === 'colorFadingWall') {
    return product.colorFading.trim()
  }
  if (field === 'chalkRoof' || field === 'chalkWall') {
    return product.chalk.trim()
  }
  return ''
}
