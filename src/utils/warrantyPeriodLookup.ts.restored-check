import { parseMultiValue } from '../constants/warrantyOptions'
import { WARRANTY_REQUEST_RESIN_ALL } from '../constants/warrantyRequestOptions'
import type { ProductLine, ProductWarranty, WarrantyPeriodData } from '../types'
import { resolveProductLine } from './productWarrantyHelpers'

export type WarrantyRiskSection = 'highRisk' | 'lowRisk'

function isValidWarrantyProduct(product: ProductWarranty): boolean {
  if (product.productGroup === '제품군') return false
  if (product.productGroup.includes('위 LIST')) return false
  if (product.productGroup === '유럽' && !product.peelFlake) return false
  return true
}

function normalizeKey(value: string): string {
  return value.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase()
}

export function regionToRiskSection(region: string): WarrantyRiskSection | null {
  if (region === '고위험지역') return 'highRisk'
  if (region === '저위험지역') return 'lowRisk'
  return null
}

export function productItemToLine(productItem: string): ProductLine | null {
  if (productItem === 'PAINT') return 'paint'
  if (productItem === 'PRINT') return 'print'
  return null
}

export function coatingStructureToCode(structure: string): '2C2B' | '3C3B' | null {
  const key = normalizeKey(structure)
  if (key.includes('2 COAT') && key.includes('2 BAKE')) return '2C2B'
  if (key.includes('3 COAT') && key.includes('3 BAKE')) return '3C3B'
  return null
}

function paintResinMatchesProduct(resin: string, product: ProductWarranty): boolean {
  if (resolveProductLine(product) !== 'paint') return false

  const group = normalizeKey(product.productGroup)
  const resinKey = normalizeKey(resin)

  if (resinKey === 'RMP') return group === 'RMP'
  if (resinKey === 'RMP MATT') return group === 'RMP MATT'
  if (resinKey === 'ADP' || resinKey === 'NDP') return group === 'ADP (NDP)'
  if (resinKey === 'HDP') return group === 'HDP'
  if (resinKey === 'SMP') return group === 'SMP'
  if (resinKey === 'URETHANE') return group === 'URETHANE'
  if (resinKey === 'SQP40') return group === 'SQP40'
  if (resinKey === 'PVDF') return group === 'PVDF'

  return group === resinKey
}

function printResinMatchesProduct(
  resin: string,
  coatCode: '2C2B' | '3C3B',
  product: ProductWarranty
): boolean {
  if (resolveProductLine(product) !== 'print') return false

  const group = normalizeKey(product.productGroup)
  if (!group.includes('PRINT') || !group.includes(coatCode)) return false

  const resinKey = normalizeKey(resin)
  if (resinKey === 'RMP') return group.includes('RMP')
  if (resinKey === 'MVP') return group.includes('MVP')
  if (resinKey === 'ADP' || resinKey === 'NDP') return group.includes('ADP')

  return group.includes(resinKey)
}

function appendUniqueProduct(matched: ProductWarranty[], seen: Set<string>, product: ProductWarranty) {
  if (seen.has(product.productGroup)) return
  seen.add(product.productGroup)
  matched.push(product)
}

function findPaintProducts(lineProducts: ProductWarranty[], resins: string[]): ProductWarranty[] {
  const matched: ProductWarranty[] = []
  const seen = new Set<string>()

  for (const resin of resins) {
    for (const product of lineProducts) {
      if (!paintResinMatchesProduct(resin, product)) continue
      appendUniqueProduct(matched, seen, product)
    }
  }

  return matched
}

function findPrintProducts(
  lineProducts: ProductWarranty[],
  resins: string[],
  coatingStructures: string[]
): ProductWarranty[] {
  const coatCodes = coatingStructures
    .map(coatingStructureToCode)
    .filter((code): code is '2C2B' | '3C3B' => code !== null)

  if (coatCodes.length === 0) return []

  const matched: ProductWarranty[] = []
  const seen = new Set<string>()

  for (const resin of resins) {
    for (const coatCode of coatCodes) {
      for (const product of lineProducts) {
        if (!printResinMatchesProduct(resin, coatCode, product)) continue
        appendUniqueProduct(matched, seen, product)
      }
    }
  }

  return matched
}

export function findCompanyWarrantyProducts(
  data: WarrantyPeriodData,
  options: {
    productItem: string
    resin: string
    region: string
    coatingStructure?: string
  }
): ProductWarranty[] {
  const section = regionToRiskSection(options.region)
  const line = productItemToLine(options.productItem)
  if (!section || !line) return []

  const selectedResins = parseMultiValue(options.resin)
  const products = data[section].products.filter(isValidWarrantyProduct)
  const lineProducts = products.filter((product) => resolveProductLine(product) === line)

  if (line === 'print') {
    const coatingStructures = parseMultiValue(options.coatingStructure ?? '')
    if (coatingStructures.length === 0) return []

    if (selectedResins.includes(WARRANTY_REQUEST_RESIN_ALL)) {
      const coatCodes = coatingStructures
        .map(coatingStructureToCode)
        .filter((code): code is '2C2B' | '3C3B' => code !== null)

      return lineProducts.filter((product) => {
        const group = normalizeKey(product.productGroup)
        return coatCodes.some((code) => group.includes(code))
      })
    }

    const resins = selectedResins.filter((item) => item !== WARRANTY_REQUEST_RESIN_ALL)
    if (resins.length === 0) return []

    return findPrintProducts(lineProducts, resins, coatingStructures)
  }

  if (selectedResins.includes(WARRANTY_REQUEST_RESIN_ALL)) {
    return lineProducts
  }

  const resins = selectedResins.filter((item) => item !== WARRANTY_REQUEST_RESIN_ALL)
  if (resins.length === 0) return []

  return findPaintProducts(lineProducts, resins)
}
