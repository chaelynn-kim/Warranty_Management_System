import type { ProductLine, ProductWarranty, WarrantyPeriodData } from '../types'
import { resolveProductLine } from './productWarrantyHelpers'
import { getProductTableLayoutForLine, withProductTableLayoutForLine } from './productTableLayoutHelpers'
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

function resetProductLineSection(
  current: WarrantyPeriodData['highRisk'],
  saved: WarrantyPeriodData['highRisk'],
  line: ProductLine
): WarrantyPeriodData['highRisk'] {
  return withProductTableLayoutForLine(
    {
      ...current,
      products: replaceSectionProducts(current.products, saved.products, line),
    },
    line,
    getProductTableLayoutForLine(saved, line)
  )
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
        highRisk: resetProductLineSection(current.highRisk, saved.highRisk, 'paint'),
      }
    case 'highRisk:print':
      return {
        ...current,
        highRisk: resetProductLineSection(current.highRisk, saved.highRisk, 'print'),
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
          ...resetProductLineSection(current.lowRisk, saved.lowRisk, 'paint'),
          note: current.lowRisk.note,
        },
      }
    case 'lowRisk:print':
      return {
        ...current,
        lowRisk: {
          ...resetProductLineSection(current.lowRisk, saved.lowRisk, 'print'),
          note: current.lowRisk.note,
        },
      }
    case 'coastalAl:highRisk':
      return {
        ...current,
        coastalAl: { ...current.coastalAl, highRisk: saved.coastalAl.highRisk },
      }
    case 'coastalAl:lowRisk':
      return {
        ...current,
        coastalAl: { ...current.coastalAl, lowRisk: saved.coastalAl.lowRisk },
      }
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
