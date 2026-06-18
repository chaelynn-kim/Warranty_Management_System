import defaultData from '../data/warrantyPeriod.json'
import type { CoastalAlSection, ProductLine, ProductWarranty, WarrantyPeriodData } from '../types'
import { normalizeProductWarranty } from './productWarrantyHelpers'

const STORAGE_KEY = 'warranty-period-data'
const STORAGE_VERSION_KEY = 'warranty-period-version'
const CURRENT_VERSION = '5'

function isCoastalAlSection(value: unknown): value is CoastalAlSection {
  if (!value || typeof value !== 'object') return false
  const coastal = value as CoastalAlSection
  return Boolean(coastal.highRisk?.rows && coastal.lowRisk?.rows)
}

function normalizeCoastal(coastal: unknown): CoastalAlSection {
  if (isCoastalAlSection(coastal)) return coastal
  return (defaultData as WarrantyPeriodData).coastalAl
}

export function createEmptyProductWarranty(productLine: ProductLine = 'paint'): ProductWarranty {
  return {
    productGroup: '',
    productLine,
    peelFlake: '',
    perforation: '',
    colorFadingMode: 'detail',
    chalkMode: 'detail',
    colorFading: '',
    colorFadingRoof: '',
    colorFadingWall: '',
    chalk: '',
    chalkRoof: '',
    chalkWall: '',
    notes: '',
  }
}

function normalizeProducts(products: ProductWarranty[]): ProductWarranty[] {
  return products.map(normalizeProductWarranty)
}

function normalizeRiskSection<T extends { products: ProductWarranty[] }>(
  defaults: T,
  parsed: Partial<T> | undefined
): T {
  const merged = { ...defaults, ...parsed }
  merged.products = normalizeProducts(parsed?.products ?? defaults.products)
  return merged
}

function normalizeWarrantyPeriod(parsed: Partial<WarrantyPeriodData>): WarrantyPeriodData {
  const defaults = defaultData as WarrantyPeriodData
  return {
    ...defaults,
    ...parsed,
    highRisk: normalizeRiskSection(defaults.highRisk, parsed.highRisk),
    lowRisk: normalizeRiskSection(defaults.lowRisk, parsed.lowRisk),
    coastalAl: normalizeCoastal(parsed.coastalAl),
    notCovered: {
      ...defaults.notCovered,
      ...parsed.notCovered,
      title: defaults.notCovered.title,
    },
  }
}

export function loadWarrantyPeriod(): WarrantyPeriodData {
  try {
    const version = localStorage.getItem(STORAGE_VERSION_KEY)
    const saved = localStorage.getItem(STORAGE_KEY)
    if (version === CURRENT_VERSION && saved) {
      const parsed = JSON.parse(saved) as Partial<WarrantyPeriodData>
      return normalizeWarrantyPeriod(parsed)
    }
    if (saved && version !== CURRENT_VERSION) {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // fall through
  }
  const data = normalizeWarrantyPeriod(defaultData as Partial<WarrantyPeriodData>)
  localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION)
  return data
}

export function saveWarrantyPeriod(data: WarrantyPeriodData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION)
}
