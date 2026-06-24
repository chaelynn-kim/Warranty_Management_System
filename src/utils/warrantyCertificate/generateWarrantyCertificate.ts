import JSZip from 'jszip'
import type { ProductWarranty } from '../../types'
import { translateDetailRegionToEnglish } from './countryTranslation'
import type { SlideReplacement } from './pptxReplacer'
import { applySlideReplacements } from './pptxReplacer'
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

const TEMPLATE_FILES: Record<string, Record<WarrantyCertificateLanguage, string>> = {
  PAINT: {
    ko: 'PAINT_국문_260427.pptx',
    en: 'PAINT_영문_260427.pptx',
  },
  PRINT: {
    ko: 'PRINT_국문_250624.pptx',
    en: 'PRINT_영문_250624.pptx',
  },
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
  options?: { useCoverYearGray?: boolean }
): SlideReplacement {
  return {
    slide,
    paragraph,
    group,
    value,
    useCoverYearGray: options?.useCoverYearGray,
  }
}

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
  rules.push(rule(3, 1, 0, detailRegionValue))
  rules.push(rule(3, 2, 0, coatingStructureValue))
  rules.push(rule(3, 2, 1, ctx.totalCoatingThickness))
  rules.push(rule(3, 2, 2, ctx.primerThickness))
}

function buildPaintKoReplacements(ctx: ReplacementContext): SlideReplacement[] {
  const peelYears = extractWarrantyYears(ctx.product.peelFlake)
  const perfYears = ctx.perforationYears

  const rules: SlideReplacement[] = [
    rule(1, 0, 0, String(perfYears), { useCoverYearGray: true }),
    rule(1, 1, 0, formatTitleLine(ctx.resin, ctx.colorName)),
    rule(2, 0, 0, ctx.resin),
    rule(2, 0, 1, formatYearsKo(perfYears)),
    rule(2, 5, 0, ctx.resin),
    rule(2, 5, 1, formatYearsKo(perfYears)),
    rule(2, 45, 0, formatYearsKoSpaced(peelYears)),
    rule(2, 48, 0, formatYearsKoSpaced(perfYears)),
    rule(2, 50, 0, formatWarrantyCellKo(getWarrantyCell(ctx.product, 'colorFadingRoof'))),
    rule(2, 52, 0, formatWarrantyCellKo(getWarrantyCell(ctx.product, 'chalkRoof'))),
    rule(2, 58, 0, formatYearsKoSpaced(peelYears)),
    rule(2, 61, 0, formatYearsKoSpaced(perfYears)),
    rule(2, 63, 0, formatWarrantyCellKo(getWarrantyCell(ctx.product, 'colorFadingWall'))),
    rule(2, 65, 0, formatWarrantyCellKo(getWarrantyCell(ctx.product, 'chalkWall'))),
    rule(3, 3, 0, `${ctx.resin} `),
    rule(3, 11, 0, ctx.resin),
    rule(4, 11, 0, String(perfYears + 1)),
    rule(4, 13, 0, ctx.issueDate),
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
    rule(2, 0, 0, ctx.resin),
    rule(2, 0, 1, formatYearsEnUpper(perfYears)),
    rule(2, 5, 0, ctx.resin),
    rule(2, 5, 1, formatYearsEnLower(perfYears)),
    rule(2, 45, 0, formatYearsEnShort(peelYears)),
    rule(2, 48, 0, formatYearsEnShort(perfYears)),
    rule(2, 50, 0, formatWarrantyCellEn(getWarrantyCell(ctx.product, 'colorFadingRoof'))),
    rule(2, 52, 0, formatWarrantyCellEn(getWarrantyCell(ctx.product, 'chalkRoof'))),
    rule(2, 59, 0, formatYearsEnShort(peelYears)),
    rule(2, 62, 0, formatYearsEnShort(perfYears)),
    rule(2, 64, 0, formatWarrantyCellEn(getWarrantyCell(ctx.product, 'colorFadingWall'))),
    rule(2, 66, 0, formatWarrantyCellEn(getWarrantyCell(ctx.product, 'chalkWall'))),
    rule(3, 3, 0, ctx.resin),
    rule(3, 10, 0, ctx.resin),
    rule(4, 11, 0, formatYearsPlusOneEn(perfYears)),
    rule(4, 13, 0, ctx.issueDate),
  ]

  appendSlide3CoatingRules(
    rules,
    ctx,
    translateDetailRegionToEnglish(ctx.detailRegionLabel),
    formatCoatingStructureEn(ctx.coatingStructure)
  )
  return rules
}

function buildPrintKoReplacements(ctx: ReplacementContext): SlideReplacement[] {
  const peelYears = extractWarrantyYears(ctx.product.peelFlake)
  const colorYears = extractWarrantyYears(ctx.product.colorFading)

  const rules: SlideReplacement[] = [
    rule(1, 0, 0, String(ctx.perforationYears), { useCoverYearGray: true }),
    rule(1, 1, 0, formatTitleLine(ctx.resin, ctx.colorName)),
    rule(2, 0, 0, ctx.resin),
    rule(2, 0, 1, formatYearsKo(ctx.perforationYears)),
    rule(2, 4, 0, formatYearsKoSpacedTrailing(peelYears)),
    rule(2, 6, 0, formatYearsKoSpaced(colorYears)),
    rule(2, 40, 0, formatYearsKoSpaced(peelYears)),
    rule(2, 43, 0, formatYearsKoSpaced(ctx.perforationYears)),
    rule(2, 45, 0, formatWarrantyCellKo(getWarrantyCell(ctx.product, 'colorFadingRoof'))),
    rule(2, 47, 0, formatWarrantyCellKo(getWarrantyCell(ctx.product, 'chalkRoof'))),
    rule(2, 54, 0, formatYearsKoSpaced(peelYears)),
    rule(2, 57, 0, formatYearsKoSpaced(ctx.perforationYears)),
    rule(2, 59, 0, formatWarrantyCellKo(getWarrantyCell(ctx.product, 'colorFadingWall'))),
    rule(2, 61, 0, formatWarrantyCellKo(getWarrantyCell(ctx.product, 'chalkWall'))),
    rule(4, 0, 0, ctx.issueDate),
    rule(4, 11, 0, formatYearsPlusOneKo(ctx.perforationYears)),
  ]

  appendSlide3CoatingRules(rules, ctx, ctx.detailRegionLabel, formatCoatingStructureKo(ctx.coatingStructure))
  return rules
}

function buildPrintEnReplacements(ctx: ReplacementContext): SlideReplacement[] {
  const peelYears = extractWarrantyYears(ctx.product.peelFlake)

  const rules: SlideReplacement[] = [
    rule(1, 0, 0, String(ctx.perforationYears), { useCoverYearGray: true }),
    rule(1, 1, 0, formatTitleLine(ctx.resin, ctx.colorName)),
    rule(2, 0, 0, formatYearsEnUpper(ctx.perforationYears)),
    rule(2, 32, 0, formatYearsEnShort(peelYears)),
    rule(2, 35, 0, formatYearsEnShort(ctx.perforationYears)),
    rule(2, 37, 0, formatWarrantyCellEn(getWarrantyCell(ctx.product, 'colorFadingRoof'))),
    rule(2, 39, 0, formatWarrantyCellEn(getWarrantyCell(ctx.product, 'chalkRoof'))),
    rule(2, 56, 0, formatYearsEnShort(peelYears)),
    rule(2, 58, 0, formatYearsEnShort(ctx.perforationYears)),
    rule(2, 59, 0, formatWarrantyCellEn(getWarrantyCell(ctx.product, 'colorFadingWall'))),
    rule(2, 60, 0, formatWarrantyCellEn(getWarrantyCell(ctx.product, 'chalkWall'))),
    rule(3, 3, 0, ctx.resin),
    rule(3, 10, 0, ctx.resin),
    rule(4, 9, 0, formatYearsPlusOneEn(ctx.perforationYears)),
    rule(4, 11, 0, ctx.issueDate),
  ]

  appendSlide3CoatingRules(
    rules,
    ctx,
    translateDetailRegionToEnglish(ctx.detailRegionLabel),
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
    return { ok: false, message: '보증 내용 데이터가 없습니다.' }
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

  const templateName = TEMPLATE_FILES[input.productItem]?.[language]
  if (!templateName) {
    throw new Error('지원하지 않는 품목입니다.')
  }

  const ctx = buildContext(input)
  if (!ctx) {
    throw new Error('보증서 데이터를 구성할 수 없습니다.')
  }

  const templateUrl = `${import.meta.env.BASE_URL}warranty-templates/${encodeURIComponent(templateName)}`
  const response = await fetch(templateUrl)
  if (!response.ok) {
    throw new Error('보증서 양식 파일을 불러오지 못했습니다.')
  }

  const templateBuffer = await response.arrayBuffer()
  const zip = await JSZip.loadAsync(templateBuffer)
  const replacements = buildReplacements(input.productItem, language, ctx)

  for (let slide = 1; slide <= 4; slide += 1) {
    const slidePath = `ppt/slides/slide${slide}.xml`
    const slideFile = zip.file(slidePath)
    if (!slideFile) continue

    const slideXml = await slideFile.async('string')
    const slideRules = replacements.filter((item) => item.slide === slide)
    zip.file(slidePath, applySlideReplacements(slideXml, slideRules))
  }

  const output = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  return output
}

export function buildWarrantyCertificateFilename(
  input: WarrantyCertificateInput,
  language: WarrantyCertificateLanguage
): string {
  const langLabel = language === 'ko' ? '국문' : '영문'
  const color = input.colorName.trim().replace(/[\\/:*?"<>|]/g, '_') || '보증서'
  const date = formatIssueDateDot(input.issueDate).replace(/\./g, '') || '미정'
  return `보증서_${input.productItem}_${langLabel}_${color}_${date}.pptx`
}

export function downloadWarrantyCertificate(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
