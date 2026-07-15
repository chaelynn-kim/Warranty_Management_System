import { parseMultiValue } from '../constants/warrantyOptions'
import {
  WARRANTY_REQUEST_COATING_STRUCTURES,
  WARRANTY_REQUEST_RESIN_ALL,
} from '../constants/warrantyRequestOptions'
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
  if (region === '고위험국가') return 'highRisk'
  if (region === '저위험국가') return 'lowRisk'
  return null
}

export function productItemToLine(productItem: string): ProductLine | null {
  if (productItem === 'PAINT') return 'paint'
  if (productItem === 'PRINT') return 'print'
  return null
}

export function coatingStructureToCode(structure: string): '2C2B' | '3C3B' | null {
  const key = normalizeKey(structure)
  const compact = key.replace(/[\s/]/g, '')
  if (key.includes('2C2B') || (compact.includes('2COAT') && compact.includes('2BAKE'))) return '2C2B'
  if (key.includes('3C3B') || (compact.includes('3COAT') && compact.includes('3BAKE'))) return '3C3B'
  if (key.includes('2 COAT') && key.includes('2 BAKE')) return '2C2B'
  if (key.includes('3 COAT') && key.includes('3 BAKE')) return '3C3B'
  return null
}

/** `3COAT, 3BAKE`처럼 옵션 내부 쉼표가 있는 값을 올바르게 분리 */
export function parseCoatingStructures(value: string): string[] {
  if (!value.trim()) return []

  const known = [...WARRANTY_REQUEST_COATING_STRUCTURES]
  const matched = known.filter((option) =>
    value.toUpperCase().includes(option.toUpperCase())
  )
  if (matched.length > 0) return [...new Set(matched)]

  const legacyMap: Record<string, string> = {
    '2 COAT / 2 BAKE': '2COAT, 2BAKE',
    '3 COAT / 3 BAKE': '3COAT, 3BAKE',
  }
  for (const [legacy, canonical] of Object.entries(legacyMap)) {
    if (normalizeKey(value).includes(normalizeKey(legacy))) {
      return [canonical]
    }
  }

  const tokens = value
    .split(/[,，]/)
    .map((part) => part.trim())
    .filter(Boolean)
  const paired: string[] = []

  for (let index = 0; index < tokens.length; index += 1) {
    const coatMatch = tokens[index].match(/^(\d)\s*COAT$/i)
    if (!coatMatch) continue

    const bakeMatch = tokens[index + 1]?.match(/^(\d)\s*BAKE$/i)
    if (bakeMatch && coatMatch[1] === bakeMatch[1]) {
      paired.push(`${coatMatch[1]}COAT, ${bakeMatch[1]}BAKE`)
      index += 1
      continue
    }

    const code = coatingStructureToCode(tokens[index])
    if (code) {
      paired.push(tokens[index])
    }
  }

  return [...new Set(paired)]
}

export function joinCoatingStructures(values: string[]): string {
  const selected = new Set<string>()
  for (const value of values) {
    for (const structure of parseCoatingStructures(value)) {
      selected.add(structure)
    }
  }
  return WARRANTY_REQUEST_COATING_STRUCTURES.filter((option) => selected.has(option)).join(', ')
}

function paintResinMatchesProduct(resin: string, product: ProductWarranty): boolean {
  if (resolveProductLine(product) !== 'paint') return false

  const group = normalizeKey(product.productGroup)
  const resinKey = normalizeKey(resin)

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

function printResinMatchesProduct(
  resin: string,
  coatCode: '2C2B' | '3C3B',
  product: ProductWarranty
): boolean {
  if (resolveProductLine(product) !== 'print') return false

  const group = normalizeKey(product.productGroup)
  if (!group.includes(coatCode)) return false

  const resinPrefix = group.split(' ')[0]
  const resinKey = normalizeKey(resin)

  if (resinKey === 'RMP') return resinPrefix === 'RMP'
  if (resinKey === 'MVP') return resinPrefix === 'MVP'
  if (resinKey === 'ADP' || resinKey === 'NDP') return resinPrefix === 'ADP'
  if (resinKey === 'PVDF') return resinPrefix === 'PVDF'

  return resinPrefix === resinKey
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
    const coatingStructures = parseCoatingStructures(options.coatingStructure ?? '')
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
