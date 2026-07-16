import JSZip from 'jszip'
import type { ProductWarranty } from '../../types'
import { formatDetailRegionEnForSlide3 } from './countryTranslation'
import { EMBEDDED_PPTX_TO_PDF_CONFIG } from '../../lib/pptxToPdf.embedded'
import type { SlideReplacement } from './pptxReplacer'
import { applySlideReplacements } from './pptxReplacer'
import { postProcessSlideXml } from './pptxPostProcess'
import {
  WARRANTY_TEMPLATE_URLS,
} from './templateAssets'
import {
  extractWarrantyYears,
  formatCoatingStructureEn,
  formatCoatingStructureKo,
  formatIssueDateDot,
  formatTitleLine,
  formatWarrantyCellEn,
  formatWarrantyCellKo,
  formatYearsEnLower,
  formatYearsEnShort,
  formatYearsEnUpper,
  formatYearsKo,
  formatYearsKoSpaced,
  formatYearsKoSpacedTrailing,
  formatYearsPlusOneEn,
  formatYearsPlusOneKo,
  getPerforationYears,
  getPrimaryResinCode,
  getWarrantyCell,
  hasCoatingThicknessValues,
  pickWarrantyProduct,
} from './warrantyValueFormatters'

export type WarrantyCertificateLanguage = 'ko' | 'en'
export type WarrantyCertificateFormat = 'pptx' | 'pdf'

export interface WarrantyCertificateInput {
  productItem: string
  resin: string
  resinCustom: string
  colorName: string
  coatingStructure: string
  detailRegionLabel: string
  issueDate: string
  totalCoatingThickness: string
  primerThickness: string
  companyWarrantyTerms: ProductWarranty[]
}

async function loadBinaryAsset(url: string, label: string): Promise<ArrayBuffer> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`${label}을(를) 불러오지 못했습니다.`)
    }
    return response.arrayBuffer()
  } catch (error) {
    if (error instanceof Error && error.message.includes('불러오지 못했습니다')) {
      throw error
    }
    throw new Error(`${label}을(를) 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.`)
  }
}

interface ReplacementContext {
  resin: string
  colorName: string
  coatingStructure: string
  detailRegionLabel: string
  issueDate: string
  totalCoatingThickness: string
  primerThickness: string
  perforationYears: number
  product: ProductWarranty
}

function rule(
  slide: number,
  paragraph: number,
  group: number,
  value: string,
  options?: { useCoverYearGray?: boolean; emphasizeBoldBlack?: boolean }
): SlideReplacement {
  return {
    slide,
    paragraph,
    group,
    value,
    useCoverYearGray: options?.useCoverYearGray,
    emphasizeBoldBlack: options?.emphasizeBoldBlack,
  }
}

const EMPHASIS = { emphasizeBoldBlack: true } as const

function buildContext(input: WarrantyCertificateInput): ReplacementContext | null {
  const product = pickWarrantyProduct(
    input.companyWarrantyTerms,
    input.resin,
    input.resinCustom,
    input.productItem
  )
  if (!product) return null

  const perforationYears = getPerforationYears(product)
  if (perforationYears <= 0) return null

  return {
    resin: getPrimaryResinCode(input.resin, input.resinCustom),
    colorName: input.colorName.trim(),
    coatingStructure: input.coatingStructure.trim(),
    detailRegionLabel: input.detailRegionLabel.trim(),
    issueDate: formatIssueDateDot(input.issueDate),
    totalCoatingThickness: input.totalCoatingThickness.trim(),
    primerThickness: input.primerThickness.trim(),
    perforationYears,
    product,
  }
}

function appendSlide3CoatingRules(
  rules: SlideReplacement[],
  ctx: ReplacementContext,
  detailRegionValue: string,
  coatingStructureValue: string
): void {
  rules.push(rule(3, 1, 0, detailRegionValue, EMPHASIS))
  rules.push(rule(3, 2, 0, coatingStructureValue, EMPHASIS))
  rules.push(rule(3, 2, 1, ctx.totalCoatingThickness, EMPHASIS))
  rules.push(rule(3, 2, 2, ctx.primerThickness, EMPHASIS))
}

function buildPaintKoReplacements(ctx: ReplacementContext): SlideReplacement[] {
  const peelYears = extractWarrantyYears(ctx.product.peelFlake)
  const perfYears = ctx.perforationYears

  const rules: SlideReplacement[] = [
    rule(1, 0, 0, String(perfYears), { useCoverYearGray: true }),
    rule(1, 1, 0, formatTitleLine(ctx.resin, ctx.colorName)),
    rule(2, 0, 0, ctx.resin, EMPHASIS),
    rule(2, 0, 1, formatYearsKo(perfYears), EMPHASIS),
    rule(2, 5, 0, ctx.resin, EMPHASIS),
    rule(2, 5, 1, formatYearsKo(perfYears), EMPHASIS),
    rule(2, 45, 0, formatYearsKoSpaced(perfYears)),
    rule(2, 48, 0, formatYearsKoSpaced(peelYears)),
    rule(2, 50, 0, formatWarrantyCellKo(getWarrantyCell(ctx.product, 'colorFadingRoof'))),
    rule(2, 52, 0, formatWarrantyCellKo(getWarrantyCell(ctx.product, 'chalkRoof'))),
    rule(2, 58, 0, formatYearsKoSpaced(perfYears)),
    rule(2, 61, 0, formatYearsKoSpaced(peelYears)),
    rule(2, 63, 0, formatWarrantyCellKo(getWarrantyCell(ctx.product, 'colorFadingWall'))),
    rule(2, 65, 0, formatWarrantyCellKo(getWarrantyCell(ctx.product, 'chalkWall'))),
    rule(3, 3, 0, `${ctx.resin} `, EMPHASIS),
    rule(3, 11, 0, ctx.resin, EMPHASIS),
    rule(4, 11, 0, String(perfYears + 1), EMPHASIS),
    rule(4, 13, 0, ctx.issueDate, EMPHASIS),
  ]

  appendSlide3CoatingRules(rules, ctx, ctx.detailRegionLabel, formatCoatingStructureKo(ctx.coatingStructure))
  return rules
}

function buildPaintEnReplacements(ctx: ReplacementContext): SlideReplacement[] {
  const peelYears = extractWarrantyYears(ctx.product.peelFlake)
  const perfYears = ctx.perforationYears

  const rules: SlideReplacement[] = [
    rule(1, 0, 0, String(perfYears), { useCoverYearGray: true }),
    rule(1, 1, 0, formatTitleLine(ctx.resin, ctx.colorName)),
    rule(2, 0, 0, ctx.resin, EMPHASIS),
    rule(2, 0, 1, formatYearsEnUpper(perfYears), EMPHASIS),
    rule(2, 5, 0, ctx.resin, EMPHASIS),
    rule(2, 5, 1, formatYearsEnLower(perfYears), EMPHASIS),
    rule(2, 45, 0, formatYearsEnShort(perfYears)),
    rule(2, 48, 0, formatYearsEnShort(peelYears)),
    rule(2, 50, 0, formatWarrantyCellEn(getWarrantyCell(ctx.product, 'colorFadingRoof'))),
    rule(2, 52, 0, formatWarrantyCellEn(getWarrantyCell(ctx.product, 'chalkRoof'))),
    rule(2, 59, 0, formatYearsEnShort(perfYears)),
    rule(2, 62, 0, formatYearsEnShort(peelYears)),
    rule(2, 64, 0, formatWarrantyCellEn(getWarrantyCell(ctx.product, 'colorFadingWall'))),
    rule(2, 66, 0, formatWarrantyCellEn(getWarrantyCell(ctx.product, 'chalkWall'))),
    rule(3, 3, 0, ctx.resin, EMPHASIS),
    rule(3, 10, 0, ctx.resin, EMPHASIS),
    rule(4, 11, 0, formatYearsPlusOneEn(perfYears), EMPHASIS),
    rule(4, 13, 0, ctx.issueDate, EMPHASIS),
  ]

  appendSlide3CoatingRules(
    rules,
    ctx,
    formatDetailRegionEnForSlide3(ctx.detailRegionLabel, { includeTrailingPeriod: false }),
    formatCoatingStructureEn(ctx.coatingStructure)
  )
  return rules
}

function buildPrintKoReplacements(ctx: ReplacementContext): SlideReplacement[] {
  const peelYears = extractWarrantyYears(ctx.product.peelFlake)
  const perfYears = ctx.perforationYears

  const rules: SlideReplacement[] = [
    rule(1, 0, 0, String(perfYears), { useCoverYearGray: true }),
    rule(1, 1, 0, formatTitleLine(ctx.resin, ctx.colorName)),
    rule(2, 0, 0, ctx.resin, EMPHASIS),
    rule(2, 0, 1, formatYearsKo(perfYears), EMPHASIS),
    // 보증 항목 본문 — 박리/균열 설명 문단
    rule(2, 4, 0, formatYearsKoSpacedTrailing(peelYears), EMPHASIS),
    // 보증 항목 본문 — 변색 설명 문단(템플릿 placeholder 연수)
    rule(2, 6, 0, formatYearsKoSpaced(perfYears), EMPHASIS),
    // 보증 내용 표(지붕) — 천공 → 박리 → 변색 → 백화
    rule(2, 40, 0, formatYearsKoSpaced(perfYears)),
    rule(2, 43, 0, formatYearsKoSpaced(peelYears)),
    rule(2, 45, 0, formatWarrantyCellKo(getWarrantyCell(ctx.product, 'colorFadingRoof'))),
    rule(2, 47, 0, formatWarrantyCellKo(getWarrantyCell(ctx.product, 'chalkRoof'))),
    // 보증 내용 표(벽체) — 천공 → 박리 → 변색 → 백화
    rule(2, 54, 0, formatYearsKoSpaced(perfYears)),
    rule(2, 57, 0, formatYearsKoSpaced(peelYears)),
    rule(2, 59, 0, formatWarrantyCellKo(getWarrantyCell(ctx.product, 'colorFadingWall'))),
    rule(2, 61, 0, formatWarrantyCellKo(getWarrantyCell(ctx.product, 'chalkWall'))),
    rule(4, 0, 0, ctx.issueDate, EMPHASIS),
    rule(4, 11, 0, formatYearsPlusOneKo(perfYears), EMPHASIS),
  ]

  appendSlide3CoatingRules(rules, ctx, ctx.detailRegionLabel, formatCoatingStructureKo(ctx.coatingStructure))
  return rules
}

function buildPrintEnReplacements(ctx: ReplacementContext): SlideReplacement[] {
  const peelYears = extractWarrantyYears(ctx.product.peelFlake)
  const perfYears = ctx.perforationYears

  const rules: SlideReplacement[] = [
    rule(1, 0, 0, String(perfYears), { useCoverYearGray: true }),
    rule(1, 1, 0, formatTitleLine(ctx.resin, ctx.colorName)),
    rule(2, 0, 0, formatYearsEnUpper(perfYears), EMPHASIS),
    // Warranty terms 표(Roof) — Perforation → Peel & flake → Color → Chalk
    rule(2, 32, 0, formatYearsEnShort(perfYears)),
    rule(2, 35, 0, formatYearsEnShort(peelYears)),
    rule(2, 37, 0, formatWarrantyCellEn(getWarrantyCell(ctx.product, 'colorFadingRoof'))),
    rule(2, 39, 0, formatWarrantyCellEn(getWarrantyCell(ctx.product, 'chalkRoof'))),
    // Warranty terms 표(Wall) — Perforation → Peel & flake → Color → Chalk
    rule(2, 56, 0, formatYearsEnShort(perfYears)),
    rule(2, 58, 0, formatYearsEnShort(peelYears)),
    rule(2, 59, 0, formatWarrantyCellEn(getWarrantyCell(ctx.product, 'colorFadingWall'))),
    rule(2, 60, 0, formatWarrantyCellEn(getWarrantyCell(ctx.product, 'chalkWall'))),
    rule(3, 3, 0, ctx.resin, EMPHASIS),
    rule(3, 10, 0, ctx.resin, EMPHASIS),
    rule(4, 9, 0, formatYearsPlusOneEn(perfYears), EMPHASIS),
    rule(4, 11, 0, ctx.issueDate, EMPHASIS),
  ]

  appendSlide3CoatingRules(
    rules,
    ctx,
    formatDetailRegionEnForSlide3(ctx.detailRegionLabel, { includeTrailingPeriod: true }),
    formatCoatingStructureEn(ctx.coatingStructure)
  )
  return rules
}

function buildReplacements(
  productItem: string,
  language: WarrantyCertificateLanguage,
  ctx: ReplacementContext
): SlideReplacement[] {
  if (productItem === 'PAINT') {
    return language === 'ko' ? buildPaintKoReplacements(ctx) : buildPaintEnReplacements(ctx)
  }
  return language === 'ko' ? buildPrintKoReplacements(ctx) : buildPrintEnReplacements(ctx)
}

export interface WarrantyCertificateValidation {
  ok: boolean
  message?: string
}

export function validateWarrantyCertificateInput(
  input: WarrantyCertificateInput
): WarrantyCertificateValidation {
  if (input.productItem !== 'PAINT' && input.productItem !== 'PRINT') {
    return { ok: false, message: '품목(PAINT/PRINT)이 선택되어 있어야 합니다.' }
  }
  if (!input.colorName.trim()) {
    return { ok: false, message: '색상명이 필요합니다.' }
  }
  if (!getPrimaryResinCode(input.resin, input.resinCustom)) {
    return { ok: false, message: '수지 정보가 필요합니다.' }
  }
  if (!input.coatingStructure.trim()) {
    return { ok: false, message: '도장구조가 필요합니다.' }
  }
  if (!input.detailRegionLabel.trim() || input.detailRegionLabel.trim() === '-') {
    return { ok: false, message: '세부 국가명이 필요합니다.' }
  }
  if (!input.issueDate.trim()) {
    return { ok: false, message: '발행일자가 필요합니다.' }
  }
  if (!hasCoatingThicknessValues(input.totalCoatingThickness, input.primerThickness)) {
    const missing: string[] = []
    if (!input.totalCoatingThickness.trim()) missing.push('총도막두께')
    if (!input.primerThickness.trim()) missing.push('프라이머두께')
    return {
      ok: false,
      message: `${missing.join('와 ')}를 입력해야 보증서를 작성할 수 있습니다.`,
    }
  }

  const product = pickWarrantyProduct(
    input.companyWarrantyTerms,
    input.resin,
    input.resinCustom,
    input.productItem
  )
  if (!product) {
    return {
      ok: false,
      message:
        '선택한 조건에 맞는 당사 보증 연한이 없습니다. 품목·수지·도장구조·국가를 확인해 주세요.',
    }
  }
  if (getPerforationYears(product) <= 0) {
    return { ok: false, message: '천공(PERFORATION) 보증 연한이 필요합니다.' }
  }

  return { ok: true }
}

export async function generateWarrantyCertificate(
  input: WarrantyCertificateInput,
  language: WarrantyCertificateLanguage
): Promise<Blob> {
  const validation = validateWarrantyCertificateInput(input)
  if (!validation.ok) {
    throw new Error(validation.message ?? '보증서를 생성할 수 없습니다.')
  }

  const templateUrl = WARRANTY_TEMPLATE_URLS[input.productItem]?.[language]
  if (!templateUrl) {
    throw new Error('지원하지 않는 품목입니다.')
  }

  const ctx = buildContext(input)
  if (!ctx) {
    throw new Error('보증서 데이터를 구성할 수 없습니다.')
  }

  const templateBuffer = await loadBinaryAsset(templateUrl, '보증서 양식 파일')
  const zip = await JSZip.loadAsync(templateBuffer)
  const replacements = buildReplacements(input.productItem, language, ctx)

  for (let slide = 1; slide <= 4; slide += 1) {
    const slidePath = `ppt/slides/slide${slide}.xml`
    const slideFile = zip.file(slidePath)
    if (!slideFile) continue

    const slideXml = await slideFile.async('string')
    const slideRules = replacements.filter((item) => item.slide === slide)
    const replaced = applySlideReplacements(slideXml, slideRules)
    zip.file(slidePath, postProcessSlideXml(replaced, slide, language, {
      productItem:
        input.productItem === 'PRINT' || input.productItem === 'PAINT'
          ? input.productItem
          : undefined,
      perforationYears: ctx.perforationYears,
    }))
  }

  const output = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  return output
}

export async function convertWarrantyCertificateToPdf(pptxBlob: Blob): Promise<Blob> {
  const apiBaseUrl =
    import.meta.env.VITE_PPTX_TO_PDF_API_URL?.trim() || EMBEDDED_PPTX_TO_PDF_CONFIG.apiUrl
  if (!apiBaseUrl) {
    throw new Error(
      'PDF 변환 서버가 설정되지 않았습니다. PPTX로 다운로드한 뒤 PowerPoint에서 PDF로 저장해 주세요.'
    )
  }

  const formData = new FormData()
  formData.append('file', pptxBlob, 'certificate.pptx')

  const headers: Record<string, string> = {}
  const apiKey =
    import.meta.env.VITE_PPTX_TO_PDF_API_KEY?.trim() || EMBEDDED_PPTX_TO_PDF_CONFIG.apiKey
  if (apiKey) headers['x-api-key'] = apiKey

  let response: Response
  try {
    response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/convert`, {
      method: 'POST',
      body: formData,
      headers,
    })
  } catch {
    throw new Error('PDF 변환 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.')
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(payload?.error ?? 'PDF 변환에 실패했습니다.')
  }

  return response.blob()
}

export async function generateWarrantyCertificateFile(
  input: WarrantyCertificateInput,
  language: WarrantyCertificateLanguage,
  format: WarrantyCertificateFormat
): Promise<Blob> {
  const pptxBlob = await generateWarrantyCertificate(input, language)
  if (format === 'pptx') return pptxBlob
  return convertWarrantyCertificateToPdf(pptxBlob)
}

export function buildWarrantyCertificateFilename(
  input: WarrantyCertificateInput,
  language: WarrantyCertificateLanguage,
  format: WarrantyCertificateFormat = 'pptx'
): string {
  const langLabel = language === 'ko' ? '국문' : '영문'
  const color = input.colorName.trim().replace(/[\\/:*?"<>|]/g, '_') || '보증서'
  const date = formatIssueDateDot(input.issueDate).replace(/\./g, '') || '미정'
  const extension = format === 'pdf' ? 'pdf' : 'pptx'
  return `보증서_${input.productItem}_${langLabel}_${color}_${date}.${extension}`
}

export function downloadWarrantyCertificate(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
