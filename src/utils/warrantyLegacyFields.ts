import type { WarrantyRecord } from '../types'

type LegacyWarrantySource = WarrantyRecord & {
  perforation?: string
  peelFlake?: string
  colorFadingRoof?: string
  colorFadingWall?: string
  chalkRoof?: string
  chalkWall?: string
  supplierPeel?: string
  supplierFadeRoof?: string
  supplierFadeWall?: string
  supplierChalkRoof?: string
  supplierChalkWall?: string
  companyPeel?: string
  companyFadeRoof?: string
  companyFadeWall?: string
  companyChalkRoof?: string
  companyChalkWall?: string
  totalThickness?: string
  primerThickness?: string
  coat?: string
  bake?: string
  notes?: string
}

export function normalizeLegacyRegion(region: string): string {
  const map: Record<string, string> = {
    'Low-risk Area': '저위험국가',
    'High-risk Area': '고위험국가',
  }
  return map[region] ?? region
}

export function buildLegacyWarrantyContentNote(record: LegacyWarrantySource): string {
  const items: string[] = []
  const add = (label: string, value: string | undefined) => {
    const trimmed = value?.trim() ?? ''
    if (trimmed && trimmed !== '-') items.push(`${label}: ${trimmed}`)
  }

  add('천공(PERFORATION)', record.perforation)
  add('도막박리(PEEL/FLAKE)', record.peelFlake)
  add('변색 ROOF', record.colorFadingRoof)
  add('변색 WALL', record.colorFadingWall)
  add('백화 ROOF', record.chalkRoof)
  add('백화 WALL', record.chalkWall)

  add('당사 도막박리', record.companyPeel)
  add('당사 변색 ROOF', record.companyFadeRoof)
  add('당사 변색 WALL', record.companyFadeWall)
  add('당사 백화 ROOF', record.companyChalkRoof)
  add('당사 백화 WALL', record.companyChalkWall)

  add('도료사 도막박리', record.supplierPeel)
  add('도료사 변색 ROOF', record.supplierFadeRoof)
  add('도료사 변색 WALL', record.supplierFadeWall)
  add('도료사 백화 ROOF', record.supplierChalkRoof)
  add('도료사 백화 WALL', record.supplierChalkWall)

  if (record.totalThickness?.trim()) items.push(`총 두께: ${record.totalThickness.trim()}`)
  if (record.primerThickness?.trim()) items.push(`프라이머 두께: ${record.primerThickness.trim()}`)
  if (record.coat?.trim() && record.bake?.trim()) {
    items.push(`도장 구조: ${record.coat} Coat / ${record.bake} Bake`)
  }
  if (record.notes?.trim()) items.push(`비고: ${record.notes.trim()}`)

  if (items.length === 0) return ''
  return `[기존 보증 내용]\n${items.join('\n')}`
}

export function mergeLegacyAdditionalRequest(record: LegacyWarrantySource): string {
  const parts: string[] = []
  const legacyNote = buildLegacyWarrantyContentNote(record)
  if (legacyNote) parts.push(legacyNote)
  if (record.additionalRequest?.trim()) parts.push(record.additionalRequest.trim())
  return parts.join('\n\n')
}

export type { LegacyWarrantySource }
