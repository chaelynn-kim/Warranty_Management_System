import type { ProductLine, ProductWarranty, WarrantyPeriodData } from '../types'
import { resolveProductLine } from './productWarrantyHelpers'
import type { PeriodSectionId } from '../components/warranty-period/PeriodSection'

export function replaceSectionProducts(
  products: ProductWarranty[],
  savedProducts: ProductWarranty[],
  line: ProductLine
): ProductWarranty[] {
  const savedLine = savedProducts.filter((product) => resolveProductLine(product) === line)
  const result: ProductWarranty[] = []
  let lineBlockReplaced = false

  for (const product of products) {
    if (resolveProductLine(product) === line) {
      if (!lineBlockReplaced) {
        result.push(...savedLine)
        lineBlockReplaced = true
      }
      continue
    }
    result.push(product)
  }

  if (!lineBlockReplaced) {
    result.push(...savedLine)
  }

  return result
}

export function applyPeriodSectionReset(
  current: WarrantyPeriodData,
  saved: WarrantyPeriodData,
  sectionId: PeriodSectionId
): WarrantyPeriodData {
  switch (sectionId) {
    case 'highRisk:countries':
      return {
        ...current,
        highRisk: { ...current.highRisk, countries: saved.highRisk.countries },
      }
    case 'highRisk:paint':
      return {
        ...current,
        highRisk: {
          ...current.highRisk,
          products: replaceSectionProducts(current.highRisk.products, saved.highRisk.products, 'paint'),
        },
      }
    case 'highRisk:print':
      return {
        ...current,
        highRisk: {
          ...current.highRisk,
          products: replaceSectionProducts(current.highRisk.products, saved.highRisk.products, 'print'),
        },
      }
    case 'lowRisk:countries':
      return {
        ...current,
        lowRisk: {
          ...current.lowRisk,
          countries: saved.lowRisk.countries,
          note: saved.lowRisk.note,
        },
      }
    case 'lowRisk:paint':
      return {
        ...current,
        lowRisk: {
          ...current.lowRisk,
          products: replaceSectionProducts(current.lowRisk.products, saved.lowRisk.products, 'paint'),
        },
      }
    case 'lowRisk:print':
      return {
        ...current,
        lowRisk: {
          ...current.lowRisk,
          products: replaceSectionProducts(current.lowRisk.products, saved.lowRisk.products, 'print'),
        },
      }
    case 'coastalAl':
      return { ...current, coastalAl: saved.coastalAl }
    case 'notCovered':
      return { ...current, notCovered: saved.notCovered }
    default:
      return current
  }
}

export function riskTabFromProductSection(
  sectionId: 'highRisk:paint' | 'highRisk:print' | 'lowRisk:paint' | 'lowRisk:print'
): 'highRisk' | 'lowRisk' {
  return sectionId.startsWith('highRisk') ? 'highRisk' : 'lowRisk'
}

export function productLineFromSection(
  sectionId: 'highRisk:paint' | 'highRisk:print' | 'lowRisk:paint' | 'lowRisk:print'
): ProductLine {
  return sectionId.endsWith(':print') ? 'print' : 'paint'
}
