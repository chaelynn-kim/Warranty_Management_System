import defaultData from '../data/warrantyPeriod.json'
import type { CoastalAlSection, ProductLine, ProductRiskSection, ProductWarranty, WarrantyPeriodData } from '../types'
import { queueFirestorePush } from './firestoreSync'
import { normalizeProductWarranty } from './productWarrantyHelpers'
import { resolveProductTableLayouts } from './productTableLayoutHelpers'
import {
  decryptJsonPayload,
  encryptJsonPayload,
  isEncryptedBlob,
} from './storageEncryption'

const STORAGE_KEY = 'warranty-period-data'
const STORAGE_VERSION_KEY = 'warranty-period-version'
/** 스키마 버전 — 암호화 도입 후에도 데이터 스키마는 동일 */
const CURRENT_VERSION = '10'

/** 복호화된 보증연한 메모리 캐시 (localStorage/Firestore에는 암호문만 저장) */
let periodCache: WarrantyPeriodData | null = null
let hydratePromise: Promise<WarrantyPeriodData> | null = null

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

function normalizeRiskSection(defaults: ProductRiskSection, parsed: Partial<ProductRiskSection> | undefined): ProductRiskSection {
  const merged = { ...defaults, ...parsed }
  merged.products = normalizeProducts(parsed?.products ?? defaults.products)
  const { productTableLayout: legacyLayout, ...rest } = merged
  return {
    ...rest,
    productTableLayouts: resolveProductTableLayouts(
      parsed?.productTableLayouts ?? merged.productTableLayouts,
      parsed?.productTableLayout ?? legacyLayout ?? defaults.productTableLayout
    ),
  }
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

function defaultPeriodData(): WarrantyPeriodData {
  return normalizeWarrantyPeriod(defaultData as Partial<WarrantyPeriodData>)
}

async function writeEncryptedPeriod(data: WarrantyPeriodData): Promise<void> {
  const blob = await encryptJsonPayload(data)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blob))
  localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION)
}

/**
 * Firestore pull 직후 호출 — 암호문 복호화 또는 평문 → 암호문 마이그레이션.
 */
export async function hydrateWarrantyPeriodStorage(): Promise<WarrantyPeriodData> {
  if (hydratePromise) return hydratePromise

  hydratePromise = (async () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) {
        const data = defaultPeriodData()
        periodCache = data
        return data
      }

      const parsed = JSON.parse(saved) as unknown
      if (isEncryptedBlob(parsed)) {
        const decrypted = await decryptJsonPayload<Partial<WarrantyPeriodData>>(parsed)
        const data = normalizeWarrantyPeriod(decrypted)
        periodCache = data
        return data
      }

      // 레거시 평문 → 암호화 후 Firestore에도 반영
      const data = normalizeWarrantyPeriod(parsed as Partial<WarrantyPeriodData>)
      periodCache = data
      await writeEncryptedPeriod(data)
      queueFirestorePush('warranty-period-data')
      return data
    } catch (error) {
      console.error('[warranty-period] 복호화/로드 실패', error)
      const data = defaultPeriodData()
      periodCache = data
      return data
    }
  })()

  try {
    return await hydratePromise
  } finally {
    hydratePromise = null
  }
}

export function clearWarrantyPeriodCache(): void {
  periodCache = null
  hydratePromise = null
}

export function loadWarrantyPeriod(): WarrantyPeriodData {
  if (periodCache) return periodCache

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as unknown
      if (isEncryptedBlob(parsed)) {
        // hydrate 전 동기 접근 — 기본값 반환 (AppGate에서 hydrate 후 재로드)
        console.warn('[warranty-period] 암호화 데이터가 hydrate 전에 읽혔습니다.')
        return defaultPeriodData()
      }
      const data = normalizeWarrantyPeriod(parsed as Partial<WarrantyPeriodData>)
      periodCache = data
      return data
    }
  } catch {
    // fall through
  }

  const data = defaultPeriodData()
  periodCache = data
  return data
}

export function saveWarrantyPeriod(data: WarrantyPeriodData): void {
  periodCache = data
  void writeEncryptedPeriod(data)
    .then(() => {
      queueFirestorePush('warranty-period-data')
    })
    .catch((error) => {
      console.error('[warranty-period] 암호화 저장 실패', error)
    })
}
