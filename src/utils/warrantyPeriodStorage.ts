import defaultData from '../data/warrantyPeriod.json'
import type { CoastalAlSection, ProductLine, ProductWarranty, WarrantyPeriodData } from '../types'
import { queueFirestorePush } from './firestoreSync'
import { normalizeProductWarranty } from './productWarrantyHelpers'

const STORAGE_KEY = 'warranty-period-data'
const STORAGE_VERSION_KEY = 'warranty-period-version'
const CURRENT_VERSION = '8'

const DEFAULT_COASTAL_COLOR_FADING = '≤ΔE5'
const DEFAULT_COASTAL_CHALK = '≥#8'
const LEGACY_COASTAL_SPEC = 'ΔE5.0 NO.8'
const LEGACY_COASTAL_CHALK_COMBINED = '≤ΔE5 ≥#8'

const LOW_RISK_NOTE =
  '호주, 뉴질랜드, 남미국가 (UV 지수 고위험 국가)는 저위험 국가 LIST에서 제외됩니다.'

const LEGACY_LOW_RISK_NOTES = new Set([
  '※ 위 LIST 국가 외에, 호주, 뉴질랜드, 남미국가 (UV 지수 고위험 국가) 제외한 모든 국가',
  '위 LIST 국가 외에, 호주, 뉴질랜드, 남미국가 (UV 지수 고위험 국가) 제외한 모든 국가',
])

function migrateLowRiskNote(note: string | undefined): string {
  const trimmed = (note ?? '').trim()
  if (!trimmed || LEGACY_LOW_RISK_NOTES.has(trimmed)) {
    return LOW_RISK_NOTE
  }
  return trimmed
}

function isCoastalAlSection(value: unknown): value is CoastalAlSection {
  if (!value || typeof value !== 'object') return false
  const coastal = value as CoastalAlSection
  return Boolean(coastal.highRisk?.rows && coastal.lowRisk?.rows)
}

type LegacyCoastalSide = CoastalAlSection['highRisk'] & { warrantyNote?: string }

function parseLegacyCoastalChalk(note: string): { chalkRoof: string; chalkWall: string } {
  const trimmed = note.trim()
  if (!trimmed) {
    return { chalkRoof: DEFAULT_COASTAL_CHALK, chalkWall: DEFAULT_COASTAL_CHALK }
  }

  const lines = trimmed
    .replace(/^CHALK\n?/, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const specLine =
    lines.find((line) => line.includes('ΔE') || line.includes('NO.') || line.includes('#')) ??
    lines.find((line) => !line.includes('ROOF') && !line.includes('WALL')) ??
    DEFAULT_COASTAL_CHALK

  return { chalkRoof: specLine, chalkWall: specLine }
}

function migrateCoastalSpecValue(field: keyof CoastalAlSection['highRisk'], value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return field === 'colorFadingRoof' || field === 'colorFadingWall'
      ? DEFAULT_COASTAL_COLOR_FADING
      : DEFAULT_COASTAL_CHALK
  }
  if (field === 'colorFadingRoof' || field === 'colorFadingWall') {
    if (trimmed === LEGACY_COASTAL_SPEC || trimmed === LEGACY_COASTAL_CHALK_COMBINED) {
      return DEFAULT_COASTAL_COLOR_FADING
    }
    return trimmed
  }
  if (trimmed === LEGACY_COASTAL_SPEC || trimmed === LEGACY_COASTAL_CHALK_COMBINED) {
    return DEFAULT_COASTAL_CHALK
  }
  return trimmed
}

function normalizeCoastalSide(side: LegacyCoastalSide): CoastalAlSection['highRisk'] {
  const chalk =
    side.chalkRoof?.trim() && side.chalkWall?.trim()
      ? {
          chalkRoof: migrateCoastalSpecValue('chalkRoof', side.chalkRoof),
          chalkWall: migrateCoastalSpecValue('chalkWall', side.chalkWall),
        }
      : parseLegacyCoastalChalk(side.warrantyNote ?? '')

  return {
    rows: side.rows,
    colorFadingRoof: migrateCoastalSpecValue('colorFadingRoof', side.colorFadingRoof ?? ''),
    colorFadingWall: migrateCoastalSpecValue('colorFadingWall', side.colorFadingWall ?? ''),
    ...chalk,
  }
}

function normalizeCoastal(coastal: unknown): CoastalAlSection {
  const defaults = (defaultData as WarrantyPeriodData).coastalAl
  if (!isCoastalAlSection(coastal)) return defaults
  return {
    ...coastal,
    highRisk: normalizeCoastalSide(coastal.highRisk as LegacyCoastalSide),
    lowRisk: normalizeCoastalSide(coastal.lowRisk as LegacyCoastalSide),
  }
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
    lowRisk: {
      ...normalizeRiskSection(defaults.lowRisk, parsed.lowRisk),
      note: migrateLowRiskNote(parsed.lowRisk?.note ?? defaults.lowRisk.note),
    },
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
  queueFirestorePush('warranty-period-data')
}
