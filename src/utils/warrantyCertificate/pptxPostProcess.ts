function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
}

/** PAINT 보증 내용 표 — 패널 용도·변색/백화 열 확대 */
const PAINT_WARRANTY_TABLE_COL_WIDTHS = [
  895350, 1080000, 840000, 840000, 960000, 960000,
]

const SLIDE2_TABLE_Y_DELTA_KO = 278824
const SLIDE2_TABLE_Y_DELTA_EN = 110000
/** PRINT 국문 — 보증 내용 제목과 표 사이 간격 (템플릿 y 5462858 → 5270500) */
const SLIDE2_TABLE_Y_DELTA_PRINT_KO = 192358
const SLIDE2_PRINT_OBJECT2_TARGET_CY = 1041054
const PRINT_WARRANTY_TABLE_FIRST_COL = '993775'
/** PRINT 국문 2페이지 — 보증 항목과 첫 줄 사이 간격 (템플릿 910 + 1줄) */
const SLIDE2_KO_PRINT_INTRO_GAP_PTS = 1030
/** Post-process row heights: header×2 + data×2 (template sum 2220595) */
const PAINT_WARRANTY_TABLE_FRAME_CY = 2220595
const PAINT_WARRANTY_TABLE_DATA_ROW_H = 719455
const PAINT_WARRANTY_TABLE_DATA_ROW_H_ALT = 709930
const SLIDE2_OBJECT2_HEIGHT_SHRINK = 60000
const SLIDE2_OBJECT3_HEIGHT_SHRINK_KO = 200000
const SLIDE2_OBJECT3_HEIGHT_SHRINK_EN = 280000
/** 1페이지 수지 TOP 색상명 — OOXML sz는 1/100 pt (2500 = 25pt) */
const SLIDE1_COVER_TITLE_FONT_SZ = 2500
const SLIDE4_FOOTER_SHAPE_Y_KO = 4985000
const SLIDE4_FOOTER_ORIGINAL_Y_KO = 5159374
/** 4페이지 KO 15)번과 하단 효력 문구 사이 간격 */
const SLIDE4_KO_FOOTER_GAP_PTS = 500
/** PRINT 국문 4페이지 5)~13) 항목 간격 */
const SLIDE4_KO_PRINT_ITEM_GAP_PTS = 215
/** PRINT 국문 4페이지 5)~11) 목록 들여쓰기 — 6)번 기준 */
const SLIDE4_KO_PRINT_LIST_MAR_L = 414020
const SLIDE4_KO_PRINT_LIST_INDENT = -132715
/** PRINT 국문 4페이지 16)번과 하단 효력 문구 사이 추가 간격 */
const SLIDE4_KO_PRINT_FOOTER_PRE_GAP_PTS = 990
/** 4페이지 EN 5)~11) 항목 간 세로 간격 통일 */
const SLIDE4_EN_ITEM_GAP_PTS = 265
/** 4페이지 EN 15)번과 하단 효력 문구 사이 간격 */
const SLIDE4_EN_FOOTER_GAP_PTS = 100
const SLIDE4_EN_ITEM_MAR_L = 401320
const SLIDE4_EN_ITEM_INDENT = -132715
/** 4페이지 EN 10)·11) — 두 자리 번호 뒤 본문 정렬 */
const SLIDE4_EN_ITEM_INDENT_WIDE = -195580
/** 4페이지 EN 목록 본문과 하단 효력 문구 사이 EMU 간격 */
const SLIDE4_EN_LIST_FOOTER_GAP_EMU = 30000
/** 4페이지 EN 목록 텍스트박스 높이 — 5)~15) 전체 + 서명 블록 여유 */
const SLIDE4_EN_LIST_TARGET_CY = 4200000
/** 4페이지 EN 11)번과 14)번 사이 간격 */
const SLIDE4_EN_BEFORE_PERIOD_GAP_PTS = 990
/** 4페이지 EN 14)·15) 항목 — 15) 앞 간격 */
const SLIDE4_EN_PERIOD_15_GAP_PTS = 1000
const SLIDE4_EN_PERIOD_MAR_L = '210820'
const SLIDE4_EN_PERIOD_INDENT = '-186055'
const SLIDE4_EN_PERIOD_TAB_POS = '212090'
/** 4페이지 EN 서명 이미지 상단 — 효력 문구와 겹침 방지 */
const SLIDE4_EN_SIGNATURE_Y = 6774660

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
}

export function extractParagraphText(paragraphXml: string): string {
  const texts = [...paragraphXml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((match) => match[1])
  return decodeXmlEntities(texts.join(''))
}

export function isParagraphEmpty(paragraphXml: string): boolean {
  return extractParagraphText(paragraphXml).trim() === ''
}

export function normalizeKoreanTypography(text: string): string {
  return normalizeCertificateTypography(text)
}

function normalizeCertificateTypography(text: string): string {
  return text
    .replace(/\t/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+([,.;:!?)\]}])/g, '$1')
    .replace(/([(\[{])\s+/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

const NBSP = '\u00a0'
/** 줄바꿈 전용 — `\t`와 달리 목록 번호 뒤 tabLst를 지우지 않음 */
const EN_HARD_LINE_BREAK = '\u000e'

/** 탭 없는 짧은 문단 — LibreOffice에서 한 줄로 유지 */
const EN_SINGLE_LINE_PARAGRAPH_MAX = 145

const SLIDE3_EN_BODY_CX = 6100000
const SLIDE4_EN_BODY_CX = 7600000

/** LibreOffice가 단어 경계에서 잘못 줄바꿈하지 않도록 고정할 영문 구문 (긴 문단용) */
const EN_BODY_LINE_BREAK_PROTECTED_PHRASES = [
  'regular 6 monthly',
  'washed down on a regular 6 monthly',
  'not applied to fundamental',
  'to fundamental',
  'incompatible material',
  'invalidate this warranty',
  'installed with HDP',
  'installed with PVDF',
  'Coated Metal',
  'SeAH Coated',
  'or immersed',
  'including, without',
  'tropical areas,',
  'lead or copper and',
  'green or wet',
  'acts of',
  'at any time',
  'discovering the',
  'master coil number for each',
  'run-off falling onto the product',
  'from all surfaces of the product',
  'at any time in the future',
  'acts of war,',
  'including internal',
  'come into contact with an',
]

function normalizeEnBodyTypography(text: string): string {
  return text
    .replace(/\t/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.;:!?)\]}])/g, '$1')
    .replace(/([(\[{])\s+/g, '$1')
    .trim()
}

function joinSpacesWithNbsp(text: string): string {
  return text.replace(/ /g, NBSP)
}

function protectPhrasesFromLineBreaks(text: string): string {
  let next = text
  for (const phrase of [...EN_BODY_LINE_BREAK_PROTECTED_PHRASES].sort(
    (a, b) => b.length - a.length
  )) {
    next = next.split(phrase).join(phrase.replace(/ /g, NBSP))
  }
  return next
}

function prepareEnCertificateSegment(text: string, forceSingleLine: boolean): string {
  const normalized = normalizeEnBodyTypography(text)
  if (forceSingleLine || normalized.length <= EN_SINGLE_LINE_PARAGRAPH_MAX) {
    return joinSpacesWithNbsp(normalized)
  }
  return protectPhrasesFromLineBreaks(normalized)
}

function splitEnCertificateLineSegments(text: string): string[] {
  return decodeXmlEntities(text)
    .split(/\t|\u000e/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
}

function buildEnCertificateRunXml(firstRunBase: string, text: string): string {
  const decoded = decodeXmlEntities(text)

  if (!decoded.includes('\t') && !decoded.includes(EN_HARD_LINE_BREAK)) {
    const prepared = prepareEnCertificateSegment(decoded, false)
    return buildAmpersandSafeRunXml(firstRunBase, prepared)
  }

  const parts = splitEnCertificateLineSegments(text)

  if (parts.length <= 1) {
    return buildAmpersandSafeRunXml(
      firstRunBase,
      prepareEnCertificateSegment(parts[0] ?? '', false)
    )
  }

  return parts
    .map((part, index) => {
      const prepared = joinSpacesWithNbsp(normalizeEnBodyTypography(part))
      const runXml = buildAmpersandSafeRunXml(firstRunBase, prepared)
      return index === 0 ? runXml : `<a:br/>${runXml}`
    })
    .join('')
}

function stripTabListFromParagraphProperties(pPr: string): string {
  return pPr.replace(/<a:tabLst>[\s\S]*?<\/a:tabLst>/, '')
}

function ensureBuAutoNumTabLst(paragraphXml: string): string {
  if (!paragraphXml.includes('buAutoNum') || paragraphXml.includes('tabLst')) {
    return paragraphXml
  }
  return paragraphXml.replace(
    /(<a:buAutoNum[^/]*\/>)/,
    `$1<a:tabLst><a:tab pos="401320" algn="l"/></a:tabLst>`
  )
}

function buildConsolidatedRunXml(firstRunBase: string, text: string): string {
  const decoded = decodeXmlEntities(text)

  if (!decoded.includes('\t')) {
    const normalized = normalizeCertificateTypography(decoded)
    return buildAmpersandSafeRunXml(firstRunBase, normalized)
  }

  const parts = decoded
    .split('\t')
    .map((part) => normalizeCertificateTypography(part))
    .filter((part) => part.length > 0)

  if (parts.length <= 1) {
    return buildAmpersandSafeRunXml(firstRunBase, parts[0] ?? '')
  }

  return parts
    .map((part, index) => {
      const runXml = buildAmpersandSafeRunXml(firstRunBase, part)
      return index === 0 ? runXml : `<a:br/>${runXml}`
    })
    .join('')
}

function mapOutsideTables(slideXml: string, mapper: (xml: string) => string): string {
  const parts = slideXml.split(/(<a:tbl>[\s\S]*?<\/a:tbl>)/g)
  return parts
    .map((part, index) => (index % 2 === 1 ? part : mapper(part)))
    .join('')
}

function buildAmpersandSafeRunXml(firstRunBase: string, text: string): string {
  if (!text.includes('&')) {
    return firstRunBase.replace(
      /<a:t>[\s\S]*?<\/a:t>/,
      `<a:t>${escapeXml(text)}</a:t>`
    )
  }

  const parts = text.split('&')
  return parts
    .map((part, index) => {
      const chunk = index === 0 ? part : `&${part}`
      const run = firstRunBase.replace(
        /<a:t>[\s\S]*?<\/a:t>/,
        `<a:t>${escapeXml(chunk)}</a:t>`
      )
      return run
    })
    .join('')
}

function setRunFontSz(runXml: string, sz: number): string {
  if (/<a:rPr[^>]*\ssz="\d+"/.test(runXml)) {
    return runXml.replace(/\ssz="\d+"/, ` sz="${sz}"`)
  }
  if (/<a:rPr[^>]*>/.test(runXml)) {
    return runXml.replace(/<a:rPr([^>]*)>/, `<a:rPr$1 sz="${sz}">`)
  }
  if (/<a:rPr[^>]*\/>/.test(runXml)) {
    return runXml.replace(/<a:rPr([^>]*)\/>/, `<a:rPr$1 sz="${sz}"/>`)
  }
  return runXml.replace('<a:r>', `<a:r><a:rPr sz="${sz}"/>`)
}

function setParagraphMergedText(paragraphXml: string, text: string): string {
  const firstRunIndex = paragraphXml.indexOf('<a:r>')
  if (firstRunIndex < 0) return paragraphXml

  const pPr = paragraphXml.slice('<a:p>'.length, firstRunIndex)
  const lastRunEndIndex = paragraphXml.lastIndexOf('</a:r>')
  const closeIndex = paragraphXml.lastIndexOf('</a:p>')
  const tail =
    lastRunEndIndex >= 0 && closeIndex > lastRunEndIndex
      ? paragraphXml.slice(lastRunEndIndex + '</a:r>'.length, closeIndex)
      : ''

  const firstRunBase = paragraphXml.match(/<a:r>[\s\S]*?<\/a:r>/)?.[0]
  if (!firstRunBase) return paragraphXml

  const normalized = normalizeCertificateTypography(decodeXmlEntities(text))
  const runXml = buildAmpersandSafeRunXml(firstRunBase, normalized)

  return `<a:p>${pPr}${runXml}${tail}</a:p>`
}

function ensureNumberedItemSpacing(text: string): string {
  return text.replace(/^(\d+)\)([A-Za-z])/g, '$1) $2')
}

function setParagraphEnCertificateText(
  paragraphXml: string,
  text: string,
  options?: { singleLine?: boolean }
): string {
  const firstRunIndex = paragraphXml.indexOf('<a:r>')
  if (firstRunIndex < 0) return paragraphXml

  let pPr = paragraphXml.slice('<a:p>'.length, firstRunIndex)
  const lastRunEndIndex = paragraphXml.lastIndexOf('</a:r>')
  const closeIndex = paragraphXml.lastIndexOf('</a:p>')
  const tail =
    lastRunEndIndex >= 0 && closeIndex > lastRunEndIndex
      ? paragraphXml.slice(lastRunEndIndex + '</a:r>'.length, closeIndex)
      : ''

  const firstRunBase = paragraphXml.match(/<a:r>[\s\S]*?<\/a:r>/)?.[0]
  if (!firstRunBase) return paragraphXml

  const decoded = decodeXmlEntities(text)
  const joined = normalizeMarineDistanceText(decoded)
  const hasTabBreak = joined.includes('\t')
  const hasHardBreak = joined.includes(EN_HARD_LINE_BREAK)
  const hasMultiline = hasTabBreak || hasHardBreak
  const normalized = hasMultiline ? joined : normalizeEnBodyTypography(joined)

  let runXml: string
  if (
    options?.singleLine ||
    (!hasMultiline && normalized.length <= EN_SINGLE_LINE_PARAGRAPH_MAX)
  ) {
    runXml = buildAmpersandSafeRunXml(firstRunBase, joinSpacesWithNbsp(normalized))
  } else {
    if (hasTabBreak) {
      pPr = stripTabListFromParagraphProperties(pPr)
    }
    runXml = buildEnCertificateRunXml(firstRunBase, normalized)
  }

  return `<a:p>${pPr}${runXml}${tail}</a:p>`
}

function consolidateParagraph(paragraphXml: string, enCertificateBody = false): string {
  const firstRunIndex = paragraphXml.indexOf('<a:r>')
  if (firstRunIndex < 0) return paragraphXml

  let pPr = paragraphXml.slice('<a:p>'.length, firstRunIndex)
  const lastRunEndIndex = paragraphXml.lastIndexOf('</a:r>')
  const closeIndex = paragraphXml.lastIndexOf('</a:p>')
  const tail =
    lastRunEndIndex >= 0 && closeIndex > lastRunEndIndex
      ? paragraphXml.slice(lastRunEndIndex + '</a:r>'.length, closeIndex)
      : ''

  const runs = paragraphXml.match(/<a:r>[\s\S]*?<\/a:r>/g) ?? []
  const firstRunBase = runs[0]
  if (!firstRunBase) return paragraphXml

  let joined = runs
    .map((run) => decodeXmlEntities(run.match(/<a:t>([\s\S]*?)<\/a:t>/)?.[1] ?? ''))
    .join('')

  if (enCertificateBody) {
    joined = normalizeMarineDistanceText(joined)
  }

  if (joined.includes('\t')) {
    pPr = stripTabListFromParagraphProperties(pPr)
  }

  if (enCertificateBody) {
    pPr = pPr.replace(/\s*marR="\d+"/g, '')
  }

  const runXml = enCertificateBody
    ? buildEnCertificateRunXml(firstRunBase, joined)
    : buildConsolidatedRunXml(firstRunBase, joined)

  return `<a:p>${pPr}${runXml}${tail}</a:p>`
}

function setParagraphSpaceBefore(paragraphXml: string, pts: number): string {
  const spacingXml = `<a:spcBef><a:spcPts val="${pts}"/></a:spcBef>`

  if (paragraphXml.includes('<a:spcBef>')) {
    return paragraphXml.replace(/<a:spcBef>[\s\S]*?<\/a:spcBef>/, spacingXml)
  }

  return paragraphXml.replace(/<a:pPr([^>]*)>/, `<a:pPr$1>${spacingXml}`)
}

function normalizeMatchText(text: string): string {
  return text.replace(/\u00a0/g, ' ')
}

const TABLE_CELL_BODY_PR =
  '<a:bodyPr wrap="square" lIns="28575" tIns="9144" rIns="28575" bIns="9144" anchor="ctr" anchorCtr="1"/>'

const TABLE_CELL_CENTER_PPR =
  '<a:pPr algn="ctr"><a:lnSpc><a:spcPct val="100000"/></a:lnSpc></a:pPr>'

const TABLE_CELL_BORDER_LINE =
  '<a:solidFill><a:srgbClr val="000000"/></a:solidFill><a:prstDash val="solid"/>'

const TABLE_CELL_BORDER_SIDES =
  `<a:lnL w="9525">${TABLE_CELL_BORDER_LINE}</a:lnL>` +
  `<a:lnR w="9525">${TABLE_CELL_BORDER_LINE}</a:lnR>` +
  `<a:lnT w="9525">${TABLE_CELL_BORDER_LINE}</a:lnT>` +
  `<a:lnB w="9525">${TABLE_CELL_BORDER_LINE}</a:lnB>`

const TABLE_CELL_TC_PR =
  `<a:tcPr marL="0" marR="0" marT="0" marB="0" anchor="ctr" anchorCtr="1">${TABLE_CELL_BORDER_SIDES}</a:tcPr>`

function rewriteTableParagraphProperties(paragraphXml: string): string {
  if (!paragraphXml.includes('<a:pPr')) {
    return paragraphXml.replace('<a:p>', `<a:p>${TABLE_CELL_CENTER_PPR}`)
  }
  if (/<a:pPr[^>]*\/>/.test(paragraphXml)) {
    return paragraphXml.replace(/<a:pPr[^>]*\/>/, TABLE_CELL_CENTER_PPR)
  }
  return paragraphXml.replace(/<a:pPr[\s\S]*?<\/a:pPr>/, TABLE_CELL_CENTER_PPR)
}

function normalizeTableParagraph(paragraphXml: string, text?: string): string {
  let next = text ? setParagraphMergedText(paragraphXml, text) : consolidateParagraph(paragraphXml)
  next = rewriteTableParagraphProperties(next)
  return next
}

function removeEmptyParagraphs(slideXml: string): string {
  return slideXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, (paragraph) => {
    return isParagraphEmpty(paragraph) ? '' : paragraph
  })
}

function normalizeBodyTextAlignment(slideXml: string): string {
  return slideXml
    .replace(/algn="just"/g, 'algn="l"')
    .replace(/algn="ctr"/g, 'algn="l"')
}

function consolidateBodyParagraphs(
  slideXml: string,
  enCertificateBody = false,
  preserveParagraph?: (paragraphXml: string) => boolean
): string {
  return slideXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, (paragraph) => {
    if (isParagraphEmpty(paragraph)) return paragraph
    if (preserveParagraph?.(paragraph)) return paragraph
    return consolidateParagraph(paragraph, enCertificateBody)
  })
}

function shouldPreserveSlide2EnPrintParagraph(paragraphXml: string): boolean {
  const text = extractParagraphText(paragraphXml).replace(/\u00a0/g, ' ').trim()
  if (!text) return false
  return (
    text.includes('VALIDATED FOR STEEL') ||
    text.includes('WARRANTY ITEMS') ||
    text.includes('paint film under the hereinafter') ||
    text.includes('Peel, crack on the surface') ||
    text.includes('Fade or change in color') ||
    text === 'Chalk' ||
    text === 'Warranty terms' ||
    text.includes('Any defect must be recognized by naked eye') ||
    text.includes('Fading or changing is not excess') ||
    text.includes('Chalk will not exceed numerical ratings')
  )
}

function setCellBodyAnchorCenter(cellXml: string): string {
  if (!cellXml.includes('<a:bodyPr')) {
    return cellXml.replace('<a:txBody>', `<a:txBody>${TABLE_CELL_BODY_PR}`)
  }
  return cellXml.replace(/<a:bodyPr[\s\S]*?(?:\/>|<\/a:bodyPr>)/, TABLE_CELL_BODY_PR)
}

function ensureTableCellBorders(cellXml: string): string {
  if (!cellXml.includes('<a:tcPr')) {
    return cellXml.replace('</a:txBody>', `</a:txBody>${TABLE_CELL_TC_PR}`)
  }

  if (/<a:tcPr[^>]*\/>/.test(cellXml)) {
    return cellXml.replace(/<a:tcPr[^>]*\/>/, TABLE_CELL_TC_PR)
  }

  return cellXml.replace(/<a:tcPr[\s\S]*?<\/a:tcPr>/, TABLE_CELL_TC_PR)
}

function normalizeTableCellTcPr(cellXml: string): string {
  return ensureTableCellBorders(cellXml)
}

function applyPrintWarrantyTableBorders(tableXml: string): string {
  return tableXml.replace(/<a:tc([^>]*)>([\s\S]*?)<\/a:tc>/g, (match, attrs, content) => {
    if (/\bhMerge="1"/.test(attrs)) return match
    return ensureTableCellBorders(`<a:tc${attrs}>${content}</a:tc>`)
  })
}

function finalizeTableCell(cellXml: string): string {
  return normalizeTableCellTcPr(setCellBodyAnchorCenter(cellXml))
}

function buildMultiParagraphCell(cellXml: string, lines: string[]): string {
  const paragraphs = cellXml.match(/<a:p>[\s\S]*?<\/a:p>/g) ?? []
  const template = paragraphs.find((paragraph) => !isParagraphEmpty(paragraph)) ?? paragraphs[0]
  if (!template) return cellXml

  const newParagraphs = lines.map((line) => normalizeTableParagraph(template, line))

  const next = cellXml.replace(/<a:txBody>([\s\S]*?)<\/a:txBody>/, () => {
    return `<a:txBody>${TABLE_CELL_BODY_PR}<a:lstStyle/>${newParagraphs.join('')}</a:txBody>`
  })

  return finalizeTableCell(next)
}

function formatRegionCell(cellXml: string): string {
  const fullText = normalizeCertificateTypography(
    (cellXml.match(/<a:p>[\s\S]*?<\/a:p>/g) ?? [])
      .map((paragraph) => extractParagraphText(paragraph))
      .join(' ')
  )
  const items = fullText.split(',').map((item) => item.trim()).filter(Boolean)
  if (items.length < 2) return processTableCell(cellXml)

  const lines = items.map((item, index) => (index < items.length - 1 ? `${item},` : item))
  return buildMultiParagraphCell(cellXml, lines)
}

function formatWarrantyMetricCell(cellXml: string): string {
  const fullText = normalizeCertificateTypography(
    (cellXml.match(/<a:p>[\s\S]*?<\/a:p>/g) ?? [])
      .map((paragraph) => extractParagraphText(paragraph))
      .join(' ')
  )
  const match = fullText.match(/^(≤ΔE\d+|≥#\d+)\s*(\([^)]+\))$/)
  if (!match) return processTableCell(cellXml)
  return buildMultiParagraphCell(cellXml, [match[1], match[2]])
}

function isWarrantyMetricText(text: string): boolean {
  return /^(≤ΔE\d+|≥#\d+)\s*\([^)]+\)$/.test(text)
}

function isRegionAreaText(text: string): boolean {
  return (
    (text.includes('주거지역') && text.includes('경공업지역')) ||
    (text.includes('Residential') && text.includes('Light industrial'))
  )
}

function isPanelUseText(text: string): boolean {
  return /^(Roof|Wall)\s*\(.+\)$/.test(text.trim())
}

function normalizeMarineDistanceText(text: string): string {
  return text
    .replace(/>\s*500\s*m\b/gi, '>1km')
    .replace(/500\s*m\b/gi, '1km')
    .replace(/500m\b/gi, '1km')
}

function formatPanelUseCell(cellXml: string): string {
  const fullText = normalizeMarineDistanceText(
    normalizeCertificateTypography(
      (cellXml.match(/<a:p>[\s\S]*?<\/a:p>/g) ?? [])
        .map((paragraph) => extractParagraphText(paragraph))
        .join(' ')
    )
  )
  const match = fullText.match(/^(Roof|Wall)\s*(\(.+\))$/)
  if (!match) return processTableCell(cellXml)

  const label = match[1]
  const inner = match[2].slice(1, -1)
  const ampIndex = inner.indexOf('&')
  if (ampIndex < 0) return buildMultiParagraphCell(cellXml, [label, match[2]])

  const before = inner.slice(0, ampIndex).trim()
  const after = inner.slice(ampIndex + 1).trim()
  const envMatch = after.match(/^(Industrial)\s+(environment)$/i)
  if (envMatch) {
    return buildMultiParagraphCell(cellXml, [
      label,
      `(${before.trim()}`,
      `& ${envMatch[1]}`,
      `${envMatch[2]})`,
    ])
  }
  return buildMultiParagraphCell(cellXml, [label, `(${before}`, '&', `${after})`])
}

const PRINT_KO_PANEL_LOCATION_LINES = [
  '(해안 및 공업지대에서',
  '1km 이상',
  '떨어진 곳)',
]

const PRINT_EN_PANEL_LOCATION_LINE = '(>1km from marine & Industrial environment)'

function extractCellText(cellInner: string): string {
  const paragraphs = cellInner.match(/<a:p>[\s\S]*?<\/a:p>/g) ?? []
  return normalizeCertificateTypography(
    paragraphs.map((paragraph) => extractParagraphText(paragraph)).join(' ')
  )
}

function setCellMergedText(cellInner: string, text: string): string {
  return cellInner.replace(/<a:txBody>([\s\S]*?)<\/a:txBody>/, () => {
    const paragraphs = cellInner.match(/<a:p>[\s\S]*?<\/a:p>/g) ?? []
    const template = paragraphs.find((paragraph) => !isParagraphEmpty(paragraph)) ?? paragraphs[0]
    if (!template) {
      return `<a:txBody>${TABLE_CELL_BODY_PR}<a:lstStyle/><a:p>${TABLE_CELL_CENTER_PPR}<a:endParaRPr/></a:p></a:txBody>`
    }
    return `<a:txBody>${TABLE_CELL_BODY_PR}<a:lstStyle/>${normalizeTableParagraph(template, text)}</a:txBody>`
  })
}

function getTableRows(tableXml: string): string[] {
  return [...tableXml.matchAll(/<a:tr h="\d+">[\s\S]*?<\/a:tr>/g)].map((match) => match[0])
}

function getRowCells(rowXml: string): Array<{ attrs: string; inner: string }> {
  return [...rowXml.matchAll(/<a:tc([^>]*)>([\s\S]*?)<\/a:tc>/g)].map((match) => ({
    attrs: match[1],
    inner: match[2],
  }))
}

function buildTableRow(height: number, cells: Array<{ attrs: string; inner: string }>): string {
  const cellXml = cells.map(({ attrs, inner }) => `<a:tc${attrs}>${inner}</a:tc>`).join('')
  return `<a:tr h="${height}">${cellXml}</a:tr>`
}

function isBrokenPrintEnWarrantyTable(tableXml: string): boolean {
  if (!isPrintWarrantyTable(tableXml)) return false
  const heights = [...tableXml.matchAll(/<a:tr h="(\d+)"/g)].map((match) => match[1])
  return heights.length === 6 && heights.includes('80645')
}

function buildPrintEnVmergeRegionCell(sourceInner: string): { attrs: string; inner: string } {
  const tcPr = sourceInner.match(/<a:tcPr[\s\S]*?<\/a:tcPr>/)?.[0] ?? ''
  return {
    attrs: ' vMerge="1"',
    inner: `<a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr/></a:p></a:txBody>${tcPr}`,
  }
}

function getTablePrefix(tableXml: string): string {
  return (
    tableXml.match(
      /^<a:tbl>((?:<a:tblPr[\s\S]*?<\/a:tblPr>)?(?:<a:tblGrid>[\s\S]*?<\/a:tblGrid>)?)/
    )?.[1] ?? ''
  )
}

function restructurePrintEnWarrantyTable(tableXml: string): string {
  const rows = getTableRows(tableXml)
  if (rows.length !== 6) return tableXml

  const tablePrefix = getTablePrefix(tableXml)

  const row2Cells = getRowCells(rows[2])
  const row3Cells = getRowCells(rows[3])
  const row5Cells = getRowCells(rows[5])

  const regionText = [
    extractCellText(row2Cells[0].inner),
    extractCellText(row3Cells[0].inner),
    extractCellText(row5Cells[0].inner),
  ]
    .map((part) => part.replace(/,\s*$/, '').trim())
    .filter(Boolean)
    .join(', ')

  const regionAttrs = `${row2Cells[0].attrs.replace(/\s*rowSpan="\d+"/g, '')} rowSpan="2"`
  const regionCell = {
    attrs: regionAttrs,
    inner: setCellMergedText(row2Cells[0].inner, regionText),
  }

  const dataRow1 = buildTableRow(PAINT_WARRANTY_TABLE_DATA_ROW_H, [
    regionCell,
    ...row2Cells.slice(1),
  ])
  const dataRow2 = buildTableRow(PAINT_WARRANTY_TABLE_DATA_ROW_H_ALT, [
    buildPrintEnVmergeRegionCell(row2Cells[0].inner),
    ...row5Cells.slice(1),
  ])

  const rebuiltRows = [...rows.slice(0, 2), dataRow1, dataRow2].join('')
  return tableXml.replace(/<a:tbl>[\s\S]*?<\/a:tbl>/, `<a:tbl>${tablePrefix}${rebuiltRows}</a:tbl>`)
}

function buildPrintEnPanelUseCell(cellXml: string, label: string): string {
  const paragraphs = cellXml.match(/<a:p>[\s\S]*?<\/a:p>/g) ?? []
  const template = paragraphs.find((paragraph) => !isParagraphEmpty(paragraph)) ?? paragraphs[0]
  if (!template) return cellXml

  const newParagraphs = [
    normalizeTableParagraph(template, label),
    normalizeTableParagraph(template, PRINT_EN_PANEL_LOCATION_LINE),
  ]

  const next = cellXml.replace(/<a:txBody>([\s\S]*?)<\/a:txBody>/, () => {
    return `<a:txBody>${TABLE_CELL_BODY_PR}<a:lstStyle/>${newParagraphs.join('')}</a:txBody>`
  })

  return finalizeTableCell(next)
}

function isPrintEnPanelUseText(text: string): boolean {
  const compact = text.replace(/\s+/g, ' ').trim()
  return /^(Roof|Wall)\b/.test(compact) && /marine/i.test(compact)
}

function formatPrintEnPanelUseCell(cellXml: string): string {
  const fullText = normalizeMarineDistanceText(
    normalizeCertificateTypography(
      (cellXml.match(/<a:p>[\s\S]*?<\/a:p>/g) ?? [])
        .map((paragraph) => extractParagraphText(paragraph))
        .join(' ')
    )
  )
  const label = fullText.match(/^(Roof|Wall)\b/)?.[1]
  if (!label) return processTableCell(cellXml)

  return buildPrintEnPanelUseCell(cellXml, label)
}

function isPrintEnUnmeasurableText(text: string): boolean {
  return (
    /^N\/A$/i.test(text.trim()) ||
    /^<ΔE/i.test(text.trim()) ||
    text.includes('측정불가')
  )
}

function formatPrintEnTableCell(cellXml: string): string {
  const paragraphs = cellXml.match(/<a:p>[\s\S]*?<\/a:p>/g) ?? []
  const fullText = normalizeMarineDistanceText(
    normalizeCertificateTypography(
      paragraphs.map((paragraph) => extractParagraphText(paragraph)).join(' ')
    )
  )

  if (isRegionAreaText(fullText)) return formatRegionCell(cellXml)
  if (isWarrantyMetricText(fullText)) return formatWarrantyMetricCell(cellXml)
  if (isPrintEnPanelUseText(fullText)) return formatPrintEnPanelUseCell(cellXml)
  if (isPrintEnUnmeasurableText(fullText)) return buildMultiParagraphCell(cellXml, ['N/A'])

  const yearMatch = fullText.trim().match(/^(\d+)\s*Y$/i)
  if (yearMatch) {
    return buildMultiParagraphCell(cellXml, [`${yearMatch[1]} Y`])
  }

  return processTableCell(cellXml)
}

function buildPrintKoPanelUseCell(cellXml: string, label: string): string {
  const paragraphs = cellXml.match(/<a:p>[\s\S]*?<\/a:p>/g) ?? []
  const template = paragraphs.find((paragraph) => !isParagraphEmpty(paragraph)) ?? paragraphs[0]
  if (!template) return cellXml

  const newParagraphs = [
    normalizeTableParagraph(template, label),
    ...PRINT_KO_PANEL_LOCATION_LINES.map((line) => normalizeTableParagraph(template, line)),
  ]

  const next = cellXml.replace(/<a:txBody>([\s\S]*?)<\/a:txBody>/, () => {
    return `<a:txBody>${TABLE_CELL_BODY_PR}<a:lstStyle/>${newParagraphs.join('')}</a:txBody>`
  })

  return finalizeTableCell(next)
}

function isPrintKoPanelUseText(text: string): boolean {
  const compact = text.replace(/\s+/g, '')
  return /^(지붕재|벽체)/.test(compact) && compact.includes('해안')
}

function formatPrintKoPanelUseCell(cellXml: string): string {
  const fullText = normalizeMarineDistanceText(
    normalizeCertificateTypography(
      (cellXml.match(/<a:p>[\s\S]*?<\/a:p>/g) ?? [])
        .map((paragraph) => extractParagraphText(paragraph))
        .join(' ')
    )
  )
  const label = fullText.match(/^(지붕재|벽체)/)?.[1]
  if (!label) return processTableCell(cellXml)

  return buildPrintKoPanelUseCell(cellXml, label)
}

function processTableCell(cellXml: string): string {
  const paragraphs = cellXml.match(/<a:p>[\s\S]*?<\/a:p>/g) ?? []
  const fullText = normalizeMarineDistanceText(
    normalizeCertificateTypography(
      paragraphs.map((paragraph) => extractParagraphText(paragraph)).join(' ')
    )
  )

  if (isRegionAreaText(fullText)) return formatRegionCell(cellXml)
  if (isWarrantyMetricText(fullText)) return formatWarrantyMetricCell(cellXml)
  if (isPanelUseText(fullText)) return formatPanelUseCell(cellXml)

  const nonEmpty = paragraphs.filter((paragraph) => !isParagraphEmpty(paragraph))

  if (nonEmpty.length === 0) {
    return cellXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, '')
  }

  const formatParagraph = (paragraph: string, text?: string) =>
    normalizeTableParagraph(paragraph, text)

  if (nonEmpty.length === 1) {
    const mergedText = normalizeCertificateTypography(extractParagraphText(nonEmpty[0]))
    let kept = false
    const next = cellXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, (paragraph) => {
      if (isParagraphEmpty(paragraph)) return ''
      if (!kept) {
        kept = true
        return formatParagraph(nonEmpty[0], mergedText)
      }
      return ''
    })
    return finalizeTableCell(next)
  }

  const next = cellXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, (paragraph) => {
    if (isParagraphEmpty(paragraph)) return ''
    return formatParagraph(paragraph)
  })
  return finalizeTableCell(next)
}

function isPrintWarrantyTable(tableXml: string): boolean {
  const firstCol = tableXml.match(/<a:gridCol w="(\d+)"/)?.[1]
  return firstCol === PRINT_WARRANTY_TABLE_FIRST_COL
}

function formatPrintKoTableCell(cellXml: string): string {
  const paragraphs = cellXml.match(/<a:p>[\s\S]*?<\/a:p>/g) ?? []
  const fullText = normalizeMarineDistanceText(
    normalizeCertificateTypography(
      paragraphs.map((paragraph) => extractParagraphText(paragraph)).join(' ')
    )
  )

  if (isRegionAreaText(fullText)) return formatRegionCell(cellXml)
  if (isWarrantyMetricText(fullText)) return formatWarrantyMetricCell(cellXml)
  if (isPrintKoPanelUseText(fullText)) return formatPrintKoPanelUseCell(cellXml)

  if (fullText.includes('측정불가') || /^<ΔE/i.test(fullText)) {
    return buildMultiParagraphCell(cellXml, ['측정불가'])
  }

  if (/^\d+\s*년$/.test(fullText.trim())) {
    return buildMultiParagraphCell(cellXml, [fullText.trim()])
  }

  return processTableCell(cellXml)
}

function processTable(
  tableXml: string,
  productItem?: 'PAINT' | 'PRINT',
  language?: 'ko' | 'en'
): string {
  const currentCols = [...tableXml.matchAll(/<a:gridCol w="(\d+)"/g)].map((match) => match[1])
  const isPaintWarrantyTable =
    currentCols.length === PAINT_WARRANTY_TABLE_COL_WIDTHS.length &&
    currentCols[0] === '895350'

  let next = tableXml

  if (productItem === 'PRINT' && language === 'en' && isBrokenPrintEnWarrantyTable(next)) {
    next = restructurePrintEnWarrantyTable(next)
  }

  if (isPaintWarrantyTable) {
    let columnIndex = 0
    next = next.replace(/<a:gridCol w="\d+"/g, (columnTag) => {
      const width = PAINT_WARRANTY_TABLE_COL_WIDTHS[columnIndex]
      columnIndex += 1
      if (width === undefined) return columnTag
      return `<a:gridCol w="${width}"`
    })

    next = next.replace(/<a:tr h="880000"/g, `<a:tr h="${PAINT_WARRANTY_TABLE_DATA_ROW_H}"`)
    next = next.replace(/<a:tr h="820000"/g, `<a:tr h="${PAINT_WARRANTY_TABLE_DATA_ROW_H}"`)
    next = next.replace(/<a:tr h="719455"/g, `<a:tr h="${PAINT_WARRANTY_TABLE_DATA_ROW_H}"`)
    next = next.replace(/<a:tr h="709930"/g, `<a:tr h="${PAINT_WARRANTY_TABLE_DATA_ROW_H_ALT}"`)
  }

  next = next.replace(/<a:tc([^>]*)>([\s\S]*?)<\/a:tc>/g, (match, attrs, content) => {
    if (/\bhMerge="1"/.test(attrs) || /\bvMerge="1"/.test(attrs)) return match
    const cellXml = `<a:tc${attrs}>${content}</a:tc>`
    if (productItem === 'PRINT' && isPrintWarrantyTable(tableXml)) {
      if (language === 'en') return formatPrintEnTableCell(cellXml)
      return formatPrintKoTableCell(cellXml)
    }
    return processTableCell(cellXml)
  })

  next = next.replace(/<a:t>([^<]*)<\/a:t>/g, (match, text: string) => {
    if (!/500\s*m|500m/i.test(text)) return match
    const normalized = escapeXml(normalizeMarineDistanceText(decodeXmlEntities(text)))
    return `<a:t>${normalized}</a:t>`
  })

  if (isPrintWarrantyTable(tableXml)) {
    next = applyPrintWarrantyTableBorders(next)
  }

  return next
}

function applySlide2EnSectionSpacing(slideXml: string): string {
  return slideXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, (paragraph) => {
    const text = extractParagraphText(paragraph).trim()
    if (text === 'Warranty terms') {
      return setParagraphSpaceBefore(paragraph, 470)
    }
    return paragraph
  })
}

function applySlide2EnPrintHeaderBoldFix(slideXml: string): string {
  return slideXml.replace(/<p:sp>[\s\S]*?<\/p:sp>/g, (shapeXml) => {
    if (!shapeXml.includes('VALIDATED FOR STEEL')) return shapeXml

    let paragraphIndex = 0
    return shapeXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, (paragraph) => {
      paragraphIndex += 1
      if (paragraphIndex !== 1) return paragraph

      return paragraph
        .replace(/<a:rPr([^>]*)\s+b="1"\/>/g, '<a:rPr$1/>')
        .replace(/<a:rPr([^>]*)\s+b="1">/g, '<a:rPr$1>')
    })
  })
}

function applySlide2KoPrintSpacingFix(slideXml: string): string {
  return slideXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, (paragraph) => {
    const text = extractParagraphText(paragraph).trim()
    if (text.includes('본 보증서는 아래 제시된 조건하에')) {
      return setParagraphSpaceBefore(paragraph, SLIDE2_KO_PRINT_INTRO_GAP_PTS)
    }
    return paragraph
  })
}

function shrinkShapeExtent(slideXml: string, objectName: string, shrinkBy: number): string {
  if (shrinkBy <= 0) return slideXml
  return slideXml.replace(
    new RegExp(`(name="${objectName}"[\\s\\S]*?<a:ext cx="\\d+" cy=")(\\d+)(")`),
    (_match, prefix: string, cy: string, suffix: string) => {
      const nextCy = Math.max(0, Number(cy) - shrinkBy)
      return `${prefix}${nextCy}${suffix}`
    }
  )
}

function setShapeCy(slideXml: string, objectName: string, targetCy: number): string {
  return slideXml.replace(
    new RegExp(`(name="${objectName}"[\\s\\S]*?<a:ext cx="\\d+" cy=")(\\d+)(")`),
    `$1${targetCy}$3`
  )
}

function applySlide2TableLayoutFix(
  slideXml: string,
  language: 'ko' | 'en',
  productItem?: 'PAINT' | 'PRINT'
): string {
  if (productItem === 'PRINT' && language === 'en') {
    return slideXml
  }

  if (productItem === 'PRINT' && language === 'ko') {
    let next = setShapeCy(slideXml, 'object 2', SLIDE2_PRINT_OBJECT2_TARGET_CY)
    next = shrinkShapeExtent(next, 'object 3', SLIDE2_OBJECT3_HEIGHT_SHRINK_KO)

    next = next.replace(
      /(<p:graphicFrame[\s\S]*?<a:off x="\d+" y=")(\d+)(")/,
      (_match, prefix: string, y: string, suffix: string) => {
        const nextY = Math.max(0, Number(y) - SLIDE2_TABLE_Y_DELTA_PRINT_KO)
        return `${prefix}${nextY}${suffix}`
      }
    )

    return next
  }

  const delta = language === 'en' ? SLIDE2_TABLE_Y_DELTA_EN : SLIDE2_TABLE_Y_DELTA_KO
  const object3Shrink =
    language === 'en' ? SLIDE2_OBJECT3_HEIGHT_SHRINK_EN : SLIDE2_OBJECT3_HEIGHT_SHRINK_KO

  let next = shrinkShapeExtent(slideXml, 'object 2', SLIDE2_OBJECT2_HEIGHT_SHRINK)
  next = shrinkShapeExtent(next, 'object 3', object3Shrink)

  next = next.replace(
    /(<p:graphicFrame[\s\S]*?<a:off x="1258662" y=")(\d+)(")/,
    (_match, prefix: string, y: string, suffix: string) => {
      const nextY = Math.max(0, Number(y) - delta)
      return `${prefix}${nextY}${suffix}`
    }
  )

  next = next.replace(
    /(<p:graphicFrame[\s\S]*?<a:ext cx="\d+" cy=")(\d+)(")/,
    `$1${PAINT_WARRANTY_TABLE_FRAME_CY}$3`
  )

  return next
}

function applySlide1CoverTitleFix(slideXml: string): string {
  return slideXml.replace(
    /<p:sp>(?:(?!<\/p:sp>)[\s\S])*?(?:descr="\$PPTXTitle"|<p:ph type="title"\/>)(?:(?!<\/p:sp>)[\s\S])*?<\/p:sp>/g,
    (shapeXml) => {
      let next = shapeXml

      if (!next.includes('<a:xfrm>')) {
        next = next.replace(
          /<p:spPr>/,
          `<p:spPr><a:xfrm><a:off x="1115372" y="4619929"/><a:ext cx="6200000" cy="406400"/></a:xfrm>`
        )
      } else {
        next = next.replace(
          /(<p:spPr><a:xfrm><a:off x="\d+" y="\d+"\/><a:ext cx=")\d+(" cy=")\d+("\/>)/,
          `$16200000$2406400$3`
        )
      }

      next = next.replace(
        /(<p:sp>[\s\S]*?(?:descr="\$PPTXTitle"|<p:ph type="title"\/>)[\s\S]*?<a:bodyPr)[^>]*(>)[\s\S]*?<\/a:bodyPr>/,
        `$1 vert="horz" wrap="none" lIns="0" tIns="12700" rIns="0" bIns="0" rtlCol="0"$2<a:normAutofit/></a:bodyPr>`
      )

      next = next.replace(
        /(<p:sp>[\s\S]*?(?:descr="\$PPTXTitle"|<p:ph type="title"\/>)[\s\S]*?<a:pPr)([^>]*)(>)/,
        `$1 algn="ctr"$2$3`
      )

      next = next.replace(/<a:p>[\s\S]*?<\/a:p>/g, (paragraph) => {
        const text = extractParagraphText(paragraph).replace(/\u00a0/g, ' ').trim()
        if (!text || !/TOP/i.test(text)) return paragraph

        const firstRun = paragraph.match(/<a:r>[\s\S]*?<\/a:r>/)?.[0]
        if (!firstRun) return paragraph

        const singleLine = text.replace(/ /g, NBSP)
        const runXml = setRunFontSz(
          buildAmpersandSafeRunXml(firstRun, singleLine),
          SLIDE1_COVER_TITLE_FONT_SZ
        )
        const pPr = paragraph.match(/<a:p>[\s\S]*?<a:pPr[^>]*>[\s\S]*?<\/a:pPr>/)?.[0]?.replace('<a:p>', '') ?? ''
        const tail = paragraph.match(/<a:endParaRPr[\s\S]*<\/a:p>$/)?.[0] ?? '</a:p>'
        return `<a:p>${pPr}${runXml}${tail}`
      })

      return next
    }
  )
}

function reorderParagraphBlock(
  slideXml: string,
  predicates: ((text: string) => boolean)[]
): string {
  const paragraphs: string[] = []
  slideXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, (paragraph) => {
    paragraphs.push(paragraph)
    return paragraph
  })

  const indices = predicates.map((predicate) =>
    paragraphs.findIndex((paragraph) =>
      predicate(normalizeMatchText(extractParagraphText(paragraph)))
    )
  )
  if (indices.some((index) => index < 0)) return slideXml
  if (new Set(indices).size !== indices.length) return slideXml

  const orderedParagraphs = indices.map((index) => paragraphs[index])
  const start = Math.min(...indices)

  for (const index of [...indices].sort((a, b) => b - a)) {
    paragraphs.splice(index, 1)
  }
  paragraphs.splice(start, 0, ...orderedParagraphs)

  let paragraphIndex = 0
  return slideXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, () => {
    const next = paragraphs[paragraphIndex] ?? ''
    paragraphIndex += 1
    return next
  })
}

function applySlide34EnBodyLayoutFix(slideXml: string, slideNumber: number): string {
  const tIns = slideNumber === 3 ? '12700' : '27305'
  const targetCx = slideNumber === 3 ? String(SLIDE3_EN_BODY_CX) : String(SLIDE4_EN_BODY_CX)

  let next = slideXml.replace(
    /<a:bodyPr vert="horz" wrap="square" lIns="0" tIns="\d+" rIns="0" bIns="0" rtlCol="0"><a:spAutoFit\/><\/a:bodyPr>/,
    `<a:bodyPr vert="horz" wrap="square" lIns="0" tIns="${tIns}" rIns="0" bIns="0" rtlCol="0"/>`
  )

  next = next.replace(
    /(<p:spPr><a:xfrm><a:off x="\d+" y="\d+"\/><a:ext cx=")\d+(" cy="\d+"\/>)/,
    `$1${targetCx}$2`
  )

  next = next.replace(/<a:pPr([^>]*)>/g, (_match, attrs: string) => {
    const cleaned = attrs.replace(/\s*marR="\d+"/g, '')
    return `<a:pPr${cleaned}>`
  })

  return next
}

const SLIDE3_EN_ITEM_7_TEXT = 'Post-painted products are not included in the warranty.'

const SLIDE3_EN_ITEM_MAR_L = 201930
const SLIDE3_EN_ITEM_TAB_POS = 201930
const SLIDE3_EN_ITEM_INDENT = -123189
const SLIDE3_EN_ITEM_INDENT_WIDE = -186055
const SLIDE3_EN_SUB_ITEM_MAR_L = 392430
const SLIDE3_EN_SUB_ITEM_INDENT = -132715

/** 3페이지 EN 4)~13) 항목 간 세로 간격 — 템플릿과 동일하게 문단 spcBef 사용 */
const SLIDE3_EN_ITEM_GAP_PTS = 1120
const SLIDE3_EN_ITEM_GAP_PTS_EARLY = 1000
const SLIDE3_EN_SUB_ITEM_FIRST_GAP_PTS = 1125
const SLIDE3_EN_SUB_ITEM_GAP_PTS = 1120

const SLIDE3_EN_LIST_ITEMS: Array<{
  startAt: number
  match: (text: string) => boolean
  text: string
  singleLine?: boolean
  marR?: string
}> = [
  {
    startAt: 4,
    match: (text) => text.includes('Sheltered areas or areas unwashed'),
    text:
      'Sheltered areas or areas unwashed by rain exposure must be washed down on a regular 6 monthly \tbasis. Corrosion arising in unwashed areas will not be covered by the warranty.',
  },
  {
    startAt: 5,
    match: (text) => text.includes('fading and chalk'),
    text:
      'The warranty term regarding the fading and chalk of the paint is not applied to fundamental \tpigmentation colors.',
  },
  {
    startAt: 6,
    match: (text) => text.includes('come into contact with an incompatible material'),
    text:
      'The product, as supplied, must not at any time come into contact with an incompatible material.',
    singleLine: true,
  },
  {
    startAt: 7,
    match: (text) => text.includes('Post-painted'),
    text: SLIDE3_EN_ITEM_7_TEXT,
    singleLine: true,
  },
  {
    startAt: 8,
    match: (text) => text.includes('All flashings'),
    text:
      'All flashings, fasteners or components fixed to or used with the product must be installed with ADP \tPRINT on galvanized steel, galvalume, aluminum substrates or materials approved by SeAH Coated \tMetal.',
  },
  {
    startAt: 9,
    match: (text) => text.includes('pitch of the roof'),
    text:
      'Installed pitch of the roof is equal to greater than 5 degrees above the horizontal.',
    singleLine: true,
  },
  {
    startAt: 10,
    match: (text) => text.includes('roof is fully lined'),
    text:
      'The roof is fully lined and does not contain exposed eaves or other areas sheltered or unwashed by \tnatural rainfall.',
  },
  {
    startAt: 11,
    match: (text) => text.includes('Wall sheeting must not be used'),
    text:
      'Wall sheeting must not be used as concrete formwork or be immersed during construction or immersed \tduring general exposure.',
    marR: '5080',
  },
  {
    startAt: 12,
    match: (text) => text.includes('walling must not be protected'),
    text:
      'The walling must not be protected from washing by natural rainfall due to structures including, without \tlimitation, canopies, patios, carports or verandas, other than by eaves which extend no greater than \t600mm out from the wall.',
  },
  {
    startAt: 13,
    match: (text) => text.includes('warranty will not cover the defect'),
    text: 'This warranty will not cover the defect due to the following causes:',
    singleLine: true,
  },
]

const SLIDE3_EN_SUB_LIST_ITEMS: Array<{
  startAt: number
  match: (text: string) => boolean
  text: string
  singleLine?: boolean
}> = [
  {
    startAt: 1,
    match: (text) => text.includes('Damage to the coating due to the improper'),
    text:
      'Damage to the coating due to the improper processing, transportation, handling or installation.',
    singleLine: true,
  },
  {
    startAt: 2,
    match: (text) => text.includes('Defects attributed to faulty design'),
    text:
      'Defects attributed to faulty design, method of manufacture or installation of the product.',
    singleLine: true,
  },
  {
    startAt: 3,
    match: (text) => text.includes('Exposure in abnormal conditions'),
    text:
      'Exposure in abnormal conditions: excessively polluted areas, excessively humid areas, tropical areas, \tin the vicinity of chemical or iron industry.',
  },
  {
    startAt: 4,
    match: (text) => text.includes('Contact with concrete, mortar, soil'),
    text:
      'Contact with concrete, mortar, soil, ash, fertilizer, moisture retaining substances, lead or copper and \tother dissimilar metals, chemical agents, liquid from copper flashings or copper pipes, green or wet \ttimber or treated timber.',
  },
]

function enSlide3ListItemUsesSingleLine(item: {
  text: string
  singleLine?: boolean
}): boolean {
  if (item.singleLine) return true
  return !item.text.includes('\t') && !item.text.includes(EN_HARD_LINE_BREAK)
}

function stripSlide3EnRedText(paragraphXml: string): string {
  return paragraphXml.replace(
    /<a:solidFill><a:srgbClr val="FF0000"\/>/gi,
    '<a:solidFill><a:srgbClr val="000000"/>'
  )
}

function slide3EnMainItemGapPts(startAt: number): number | undefined {
  if (startAt >= 6) return SLIDE3_EN_ITEM_GAP_PTS
  if (startAt === 4 || startAt === 5) return SLIDE3_EN_ITEM_GAP_PTS_EARLY
  return undefined
}

function slide3EnSubItemGapPts(startAt: number): number | undefined {
  if (startAt === 1) return SLIDE3_EN_SUB_ITEM_FIRST_GAP_PTS
  if (startAt >= 2) return SLIDE3_EN_SUB_ITEM_GAP_PTS
  return undefined
}

function normalizeSlide3EnArabicPeriodItem(
  paragraphXml: string,
  startAt: number,
  options?: { marR?: string; spcBef?: number }
): string {
  const indent = startAt >= 10 ? SLIDE3_EN_ITEM_INDENT_WIDE : SLIDE3_EN_ITEM_INDENT
  const marRAttr = options?.marR ? ` marR="${options.marR}"` : ''
  const gapXml =
    options?.spcBef !== undefined
      ? `<a:spcBef><a:spcPts val="${options.spcBef}"/></a:spcBef>`
      : ''
  const listMarkup = `<a:buAutoNum type="arabicPeriod" startAt="${startAt}"/><a:tabLst><a:tab pos="${SLIDE3_EN_ITEM_TAB_POS}" algn="l"/></a:tabLst>`
  const pPrInner = `<a:lnSpc><a:spcPct val="100000"/></a:lnSpc>${gapXml}${listMarkup}`
  const pPrOpen = `<a:pPr marL="${SLIDE3_EN_ITEM_MAR_L}" indent="${indent}"${marRAttr}>${pPrInner}</a:pPr>`

  if (!paragraphXml.includes('<a:pPr')) {
    return paragraphXml.replace('<a:p>', `<a:p>${pPrOpen}`)
  }

  return paragraphXml.replace(/<a:pPr([^>]*)>[\s\S]*?<\/a:pPr>/, () => pPrOpen)
}

function normalizeSlide3EnArabicParenSubItem(
  paragraphXml: string,
  startAt: number,
  spcBef?: number
): string {
  const gapXml =
    spcBef !== undefined ? `<a:spcBef><a:spcPts val="${spcBef}"/></a:spcBef>` : ''
  const listMarkup = `<a:buAutoNum type="arabicParenR" startAt="${startAt}"/><a:tabLst><a:tab pos="${SLIDE3_EN_SUB_ITEM_MAR_L}" algn="l"/></a:tabLst>`
  const pPrInner = `<a:lnSpc><a:spcPct val="100000"/></a:lnSpc>${gapXml}${listMarkup}`
  const pPrOpen =
    `<a:pPr marL="${SLIDE3_EN_SUB_ITEM_MAR_L}" lvl="1" indent="${SLIDE3_EN_SUB_ITEM_INDENT}">` +
    `${pPrInner}</a:pPr>`

  if (!paragraphXml.includes('<a:pPr')) {
    return paragraphXml.replace('<a:p>', `<a:p>${pPrOpen}`)
  }

  return paragraphXml.replace(/<a:pPr([^>]*)>[\s\S]*?<\/a:pPr>/, () => pPrOpen)
}

function applySlide3EnPrintListLayout(slideXml: string): string {
  return slideXml.replace(/<p:sp>[\s\S]*?<\/p:sp>/g, (shapeXml) => {
    if (
      !shapeContainsParagraphText(shapeXml, 'warranty applies') &&
      !shapeContainsParagraphText(shapeXml, 'fading and chalk')
    ) {
      return shapeXml
    }

    const paragraphs: string[] = []
    shapeXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, (paragraph) => {
      paragraphs.push(paragraph)
      return paragraph
    })
    if (paragraphs.length === 0) return shapeXml

    const rebuilt: string[] = []

    for (const paragraph of paragraphs) {
      const text = normalizeMatchText(extractParagraphText(paragraph))
      const item = SLIDE3_EN_LIST_ITEMS.find((entry) => entry.match(text))
      const subItem = SLIDE3_EN_SUB_LIST_ITEMS.find((entry) => entry.match(text))

      if (item) {
        let processed = setParagraphEnCertificateText(
          paragraph,
          item.text,
          enSlide3ListItemUsesSingleLine(item) ? { singleLine: true } : undefined
        )
        processed = normalizeSlide3EnArabicPeriodItem(processed, item.startAt, {
          marR: item.marR,
          spcBef: slide3EnMainItemGapPts(item.startAt),
        })
        processed = stripSlide3EnRedText(processed)
        rebuilt.push(processed)
        continue
      }

      if (subItem) {
        let processed = setParagraphEnCertificateText(
          paragraph,
          subItem.text,
          enSlide3ListItemUsesSingleLine(subItem) ? { singleLine: true } : undefined
        )
        processed = normalizeSlide3EnArabicParenSubItem(
          processed,
          subItem.startAt,
          slide3EnSubItemGapPts(subItem.startAt)
        )
        processed = stripSlide3EnRedText(processed)
        rebuilt.push(processed)
        continue
      }

      rebuilt.push(stripSlide3EnRedText(paragraph))
    }

    return shapeXml.replace(
      /(<p:txBody>[\s\S]*?<a:lstStyle\/>)([\s\S]*)(<\/p:txBody>)/,
      (_match, head: string, _body: string, foot: string) => `${head}${rebuilt.join('')}${foot}`
    )
  })
}

function removeDuplicateSlide3EnIncompatibleItem(slideXml: string): string {
  let incompatibleCount = 0
  return slideXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, (paragraph) => {
    if (!paragraph.includes('buAutoNum type="arabicPeriod"')) return paragraph
    const text = normalizeMatchText(extractParagraphText(paragraph))
    if (!text.includes('come into contact with an incompatible material')) return paragraph
    incompatibleCount += 1
    return incompatibleCount > 1 ? '' : paragraph
  })
}

function setArabicPeriodItemText(paragraphXml: string, newText: string): string {
  if (paragraphXml.includes('<a:r>')) {
    return setParagraphEnCertificateText(paragraphXml, newText, { singleLine: true })
  }

  const endRPr =
    paragraphXml.match(/<a:endParaRPr[\s\S]*?<\/a:endParaRPr>/)?.[0] ??
    '<a:endParaRPr sz="900"><a:latin typeface="Malgun Gothic"/><a:cs typeface="Malgun Gothic"/></a:endParaRPr>'
  const rPr = endRPr.replace(/endParaRPr/g, 'rPr')
  const firstRunTemplate = `<a:r>${rPr}<a:t></a:t></a:r>`
  const normalized = newText
    ? joinSpacesWithNbsp(normalizeEnBodyTypography(newText))
    : ''
  const runXml = normalized ? buildAmpersandSafeRunXml(firstRunTemplate, normalized) : ''

  if (paragraphXml.includes('<a:endParaRPr')) {
    return paragraphXml.replace(/<a:endParaRPr[\s\S]*?<\/a:endParaRPr>/, `${runXml}${endRPr}`)
  }

  return paragraphXml.replace('</a:p>', `${runXml}${endRPr}</a:p>`)
}

const SLIDE3_EN_ARABIC_PERIOD_ITEM_7_PPR =
  `<a:pPr marL="${SLIDE3_EN_ITEM_MAR_L}" indent="${SLIDE3_EN_ITEM_INDENT}"><a:lnSpc><a:spcPct val="100000"/></a:lnSpc>` +
  '<a:buAutoNum type="arabicPeriod" startAt="7"/><a:tabLst><a:tab pos="201930" algn="l"/></a:tabLst></a:pPr>'

function ensureSlide3EnItem7PostPainted(slideXml: string): string {
  if (normalizeMatchText(slideXml).includes('Post-painted')) return slideXml

  return slideXml.replace(/<p:sp>[\s\S]*?<\/p:sp>/g, (shapeXml) => {
    if (!shapeContainsParagraphText(shapeXml, 'warranty applies')) {
      return shapeXml
    }

    const paragraphs: string[] = []
    shapeXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, (paragraph) => {
      paragraphs.push(paragraph)
      return paragraph
    })

    const insertIndex = paragraphs.findIndex((paragraph) => {
      if (!paragraph.includes('buAutoNum type="arabicPeriod"')) return false
      const text = normalizeMatchText(extractParagraphText(paragraph))
      return text.includes('come into contact with an incompatible material')
    })
    if (insertIndex < 0) return shapeXml

    const endRPr =
      paragraphs[insertIndex].match(/<a:endParaRPr[\s\S]*?<\/a:endParaRPr>/)?.[0] ??
      '<a:endParaRPr lang="en-US" sz="900" dirty="0"><a:latin typeface="Malgun Gothic"/><a:cs typeface="Malgun Gothic"/></a:endParaRPr>'
    const emptyPara = `<a:p>${SLIDE3_EN_ARABIC_PERIOD_ITEM_7_PPR}${endRPr}</a:p>`
    const item7 = normalizeSlide3EnArabicPeriodItem(
      setArabicPeriodItemText(emptyPara, SLIDE3_EN_ITEM_7_TEXT),
      7
    )

    paragraphs.splice(insertIndex + 1, 0, item7)

    return shapeXml.replace(
      /(<p:txBody>[\s\S]*?<a:lstStyle\/>)([\s\S]*)(<\/p:txBody>)/,
      (_match, head: string, _body: string, foot: string) => `${head}${paragraphs.join('')}${foot}`
    )
  })
}

function applySlide3EnFixes(slideXml: string, productItem?: 'PAINT' | 'PRINT'): string {
  let next = reorderParagraphBlock(slideXml, [
    (text) => text.includes('pitch of the roof'),
    (text) => text.includes('roof is fully lined'),
    (text) => text.includes('Wall sheeting must not be used'),
    (text) => text.includes('walling must not be protected'),
  ])

  if (productItem === 'PRINT') {
    next = removeDuplicateSlide3EnIncompatibleItem(next)
    next = removeEmptyParagraphs(next)
    next = ensureSlide3EnItem7PostPainted(next)
    next = applySlide3EnPrintListLayout(next)
  }

  return next
}

function applySlide3KoSpacingFix(slideXml: string): string {
  return slideXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, (paragraph) => {
    const text = extractParagraphText(paragraph)
    if (text.includes('콘크리트, 몰타르') && text.includes('구리 파이프')) {
      return setParagraphSpaceBefore(paragraph, 785)
    }
    return paragraph
  })
}

function removeParagraphByPredicate(
  slideXml: string,
  predicate: (paragraphXml: string, paragraphIndex: number) => boolean
): string {
  let paragraphIndex = 0
  return slideXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, (paragraph) => {
    const current = paragraphIndex
    paragraphIndex += 1
    return predicate(paragraph, current) ? '' : paragraph
  })
}

function mergeParagraphPair(slideXml: string, firstIndex: number, secondIndex: number): string {
  const paragraphs: string[] = []
  slideXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, (paragraph) => {
    paragraphs.push(paragraph)
    return paragraph
  })

  if (secondIndex >= paragraphs.length) return slideXml

  const mergedText = normalizeCertificateTypography(
    `${extractParagraphText(paragraphs[firstIndex])} ${extractParagraphText(paragraphs[secondIndex])}`
  )
  paragraphs[firstIndex] = setParagraphMergedText(paragraphs[firstIndex], mergedText)
  paragraphs[secondIndex] = ''

  let paragraphIndex = 0
  return slideXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, () => {
    const next = paragraphs[paragraphIndex] ?? ''
    paragraphIndex += 1
    return next
  })
}

function shapeContainsParagraphText(shapeXml: string, marker: string): boolean {
  return [...shapeXml.matchAll(/<a:p>[\s\S]*?<\/a:p>/g)].some((match) =>
    normalizeMatchText(extractParagraphText(match[0])).includes(marker)
  )
}

function findSlide4EnListShape(slideXml: string): string | undefined {
  return [...slideXml.matchAll(/<p:sp>[\s\S]*?<\/p:sp>/g)]
    .map((match) => match[0])
    .find((shapeXml) => shapeContainsParagraphText(shapeXml, 'Attack from chemical'))
}

function findSlide4EnFooterShape(slideXml: string): string | undefined {
  return [...slideXml.matchAll(/<p:sp>[\s\S]*?<\/p:sp>/g)]
    .map((match) => match[0])
    .find((shapeXml) =>
      shapeContainsParagraphText(shapeXml, 'This warranty becomes effective when all of above conditions')
    )
}

function applySlide4EnListBodyFix(slideXml: string): string {
  const listShape = findSlide4EnListShape(slideXml)
  if (!listShape) return slideXml

  let nextList = listShape.replace(
    /(<a:ext cx="\d+" cy=")(\d+)("\/>)/,
    `$1${SLIDE4_EN_LIST_TARGET_CY}$3`
  )

  nextList = nextList.replace(
    /<a:bodyPr[^>]*>[\s\S]*?<\/a:bodyPr>/,
    '<a:bodyPr vert="horz" wrap="square" lIns="0" tIns="27305" rIns="0" bIns="0" rtlCol="0"/>'
  )

  return slideXml.replace(listShape, nextList)
}

function applySlide4EnFooterPositionFix(slideXml: string): string {
  const listShape = findSlide4EnListShape(slideXml)
  const footerShape = findSlide4EnFooterShape(slideXml)
  if (!listShape || !footerShape) return slideXml

  const listY = Number(listShape.match(/<a:off x="\d+" y="(\d+)"/)?.[1] ?? 0)
  const listCy = Number(listShape.match(/<a:ext cx="\d+" cy="(\d+)"/)?.[1] ?? 0)
  const footerCy = Number(footerShape.match(/<a:ext cx="\d+" cy="(\d+)"/)?.[1] ?? 0)
  if (!listY || !listCy) return slideXml

  let targetFooterY = listY + listCy + SLIDE4_EN_LIST_FOOTER_GAP_EMU
  const maxFooterY = SLIDE4_EN_SIGNATURE_Y - footerCy - 100000
  if (maxFooterY > listY) {
    targetFooterY = Math.min(targetFooterY, maxFooterY)
  }
  const nextFooter = footerShape.replace(
    /(<a:off x="\d+" y=")(\d+)(")/,
    `$1${targetFooterY}$3`
  )

  return slideXml.replace(footerShape, nextFooter)
}

function applySlide4EnFooterShapeFix(slideXml: string): string {
  return slideXml.replace(/<p:sp>[\s\S]*?<\/p:sp>/g, (shapeXml) => {
    if (
      !shapeContainsParagraphText(
        shapeXml,
        'This warranty becomes effective when all of above conditions'
      )
    ) {
      return shapeXml
    }

    return shapeXml.replace(
      /<a:bodyPr[^>]*>[\s\S]*?<\/a:bodyPr>/,
      '<a:bodyPr vert="horz" wrap="none" lIns="0" tIns="12700" rIns="0" bIns="0" rtlCol="0"/>'
    )
  })
}

function ensureKoListAutoNumber(paragraphXml: string, marL: number): string {
  if (paragraphXml.includes('buAutoNum')) return paragraphXml

  const listMarkup = `<a:buAutoNum type="arabicParenR"/><a:tabLst><a:tab pos="${marL}" algn="l"/></a:tabLst>`

  if (!paragraphXml.includes('<a:pPr')) {
    return paragraphXml.replace('<a:p>', `<a:p><a:pPr marL="${marL}">${listMarkup}`)
  }

  return paragraphXml.replace(/<a:pPr([^>]*)>/, (_match, attrs: string) => {
    const cleaned = attrs.replace(/\s*marL="\d+"/g, '')
    return `<a:pPr marL="${marL}"${cleaned}>${listMarkup}`
  })
}

function isPrintKoSlide4ParenListItem(paragraphXml: string): boolean {
  const text = extractParagraphText(paragraphXml)
  if (!text.trim()) return false
  if (!paragraphXml.includes('buAutoNum type="arabicParenR"')) {
    return (
      text.includes('지붕 위에') ||
      (text.includes('다른 퇴적물') && text.includes('배수(응축 포함)'))
    )
  }
  return true
}

function isPrintKoSlide4LastParenItem(text: string): boolean {
  return text.includes('자연 재해') && text.includes('천재지변')
}

function formatPrintKoSlide4Item11(paragraphXml: string): string {
  const text = normalizeCertificateTypography(extractParagraphText(paragraphXml))
    .replace(/\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const match = text.match(
    /^(자연 재해,[\s\S]*?천재지변)\s*에\s*의하여\s*발생된\s*결함\.?$/
  )
  if (!match) return paragraphXml

  const line1 = match[1].trimEnd()
  const line2 = '에 의하여 발생된 결함.'

  const firstRunIndex = paragraphXml.indexOf('<a:r>')
  if (firstRunIndex < 0) return paragraphXml

  const pPr = paragraphXml.slice('<a:p>'.length, firstRunIndex)
  const tail =
    paragraphXml.match(/<a:endParaRPr[\s\S]*<\/a:p>$/)?.[0] ?? '</a:p>'
  const firstRun = paragraphXml.match(/<a:r>[\s\S]*?<\/a:r>/)?.[0]
  if (!firstRun) return paragraphXml

  const run1 = buildAmpersandSafeRunXml(firstRun, line1)
  const run2 = buildAmpersandSafeRunXml(firstRun, line2)
  return `<a:p>${pPr}${run1}<a:br/>${run2}${tail}`
}

function normalizePrintKoSlide4BuAutoNum(paragraphXml: string): string {
  const listMarkup = `<a:buAutoNum type="arabicParenR" startAt="5"/><a:tabLst><a:tab pos="${SLIDE4_KO_PRINT_LIST_MAR_L}" algn="l"/></a:tabLst>`
  const pPrInner = `<a:lnSpc><a:spcPct val="100000"/></a:lnSpc><a:spcBef><a:spcPts val="${SLIDE4_KO_PRINT_ITEM_GAP_PTS}"/></a:spcBef>${listMarkup}`

  if (!paragraphXml.includes('<a:pPr')) {
    return paragraphXml.replace(
      '<a:p>',
      `<a:p><a:pPr marL="${SLIDE4_KO_PRINT_LIST_MAR_L}" indent="${SLIDE4_KO_PRINT_LIST_INDENT}">${pPrInner}</a:pPr>`
    )
  }

  return paragraphXml.replace(/<a:pPr([^>]*)>[\s\S]*?<\/a:pPr>/, (_match, attrs: string) => {
    const cleaned = attrs
      .replace(/\s*marL="\d+"/g, '')
      .replace(/\s*indent="-?\d+"/g, '')
    return `<a:pPr marL="${SLIDE4_KO_PRINT_LIST_MAR_L}" indent="${SLIDE4_KO_PRINT_LIST_INDENT}"${cleaned}>${pPrInner}</a:pPr>`
  })
}

function normalizePrintKoSlide4ParenItem(paragraphXml: string): string {
  let next = paragraphXml
  if (!next.includes('buAutoNum type="arabicParenR"')) {
    next = ensureKoListAutoNumber(next, SLIDE4_KO_PRINT_LIST_MAR_L)
  }
  next = normalizePrintKoSlide4BuAutoNum(next)
  return next
}

function buildPrintKoSlide4ParenSpacer(endParaRPr: string): string {
  const pPr = `<a:pPr marL="${SLIDE4_KO_PRINT_LIST_MAR_L}" indent="${SLIDE4_KO_PRINT_LIST_INDENT}"><a:lnSpc><a:spcPct val="100000"/></a:lnSpc><a:spcBef><a:spcPts val="${SLIDE4_KO_PRINT_ITEM_GAP_PTS}"/></a:spcBef><a:buAutoNum type="arabicParenR" startAt="5"/><a:tabLst><a:tab pos="${SLIDE4_KO_PRINT_LIST_MAR_L}" algn="l"/></a:tabLst></a:pPr>`
  return `<a:p>${pPr}${endParaRPr}</a:p>`
}

function buildPrintKoSlide4FooterSpacer(endParaRPr: string): string {
  const pPr = `<a:pPr marL="223520" marR="30480" indent="-186055"><a:lnSpc><a:spcPct val="110800"/></a:lnSpc><a:spcBef><a:spcPts val="${SLIDE4_KO_PRINT_FOOTER_PRE_GAP_PTS}"/></a:spcBef><a:buAutoNum type="arabicPeriod" startAt="14"/></a:pPr>`
  return `<a:p>${pPr}${endParaRPr}</a:p>`
}

function applyPrintKoSlide4Layout(slideXml: string): string {
  return slideXml.replace(/<p:sp>[\s\S]*?<\/p:sp>/g, (shapeXml) => {
    if (!shapeXml.includes('지붕 위에') && !shapeXml.includes('상기 조건이')) {
      return shapeXml
    }

    const paragraphs: string[] = []
    shapeXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, (paragraph) => {
      paragraphs.push(paragraph)
      return paragraph
    })
    if (paragraphs.length === 0) return shapeXml

    const defaultEndRPr =
      '<a:endParaRPr lang="en-US" sz="900" dirty="0"><a:latin typeface="Malgun Gothic"/><a:cs typeface="Malgun Gothic"/></a:endParaRPr>'
    const listEndRPr =
      paragraphs
        .find((paragraph) => isPrintKoSlide4ParenListItem(paragraph))
        ?.match(/<a:endParaRPr[\s\S]*?<\/a:endParaRPr>/)?.[0] ?? defaultEndRPr
    const periodEndRPr =
      paragraphs
        .find((paragraph) => paragraph.includes('buAutoNum type="arabicPeriod"'))
        ?.match(/<a:endParaRPr[\s\S]*?<\/a:endParaRPr>/)?.[0] ?? defaultEndRPr

    const rebuilt: string[] = []

    for (const paragraph of paragraphs) {
      const text = extractParagraphText(paragraph).trim()

      if (isPrintKoSlide4ParenListItem(paragraph)) {
        let processed = normalizePrintKoSlide4ParenItem(paragraph)
        if (isPrintKoSlide4LastParenItem(text)) {
          processed = formatPrintKoSlide4Item11(processed)
        }
        rebuilt.push(processed)
        if (!isPrintKoSlide4LastParenItem(text)) {
          rebuilt.push(buildPrintKoSlide4ParenSpacer(listEndRPr))
        }
        continue
      }

      if (text.includes('상기 조건이 행하여지는')) {
        rebuilt.push(buildPrintKoSlide4FooterSpacer(periodEndRPr))
        rebuilt.push(setParagraphSpaceBefore(paragraph, SLIDE4_KO_FOOTER_GAP_PTS))
        continue
      }

      rebuilt.push(paragraph)
    }

    return shapeXml.replace(
      /(<p:txBody>[\s\S]*?<a:lstStyle\/>)([\s\S]*)(<\/p:txBody>)/,
      (_match, head: string, _body: string, foot: string) => `${head}${rebuilt.join('')}${foot}`
    )
  })
}

function applySlide4KoFixes(slideXml: string, productItem?: 'PAINT' | 'PRINT'): string {
  let next = slideXml

  const paragraphs: string[] = []
  next.replace(/<a:p>[\s\S]*?<\/a:p>/g, (paragraph) => {
    paragraphs.push(paragraph)
    return paragraph
  })

  const gosangIndex = paragraphs.findIndex((paragraph) =>
    extractParagraphText(paragraph).includes('고상으로부터의')
  )
  if (gosangIndex > 0) {
    next = mergeParagraphPair(next, gosangIndex - 1, gosangIndex)
  }

  next = removeParagraphByPredicate(next, (paragraph) => {
    const text = extractParagraphText(paragraph)
    return text.includes('다습한 지대') && text.includes('해안으로부터')
  })

  next = removeEmptyParagraphs(next)

  next = next.replace(/<a:p>[\s\S]*?<\/a:p>/g, (paragraph) => {
    const text = extractParagraphText(paragraph)

    if (productItem === 'PRINT') {
      if (text.includes('본 보증 조건은 실제 고객사에 공급되는')) {
        return setParagraphSpaceBefore(paragraph, 1025)
      }
      if (text.includes('결함이 발견된 후 30일 이내에')) {
        return setParagraphSpaceBefore(paragraph, 1000)
      }
      if (text.includes('최종 사용자는 세아씨엠의 요구')) {
        return setParagraphSpaceBefore(paragraph, 990)
      }
      return paragraph
    }

    if (text.includes('다른 퇴적물 제거의 실패') && text.includes('배수(응축 포함)')) {
      return setParagraphSpaceBefore(paragraph, 905)
    }
    if (text.includes('상기 조건이 행하여지는')) {
      return setParagraphSpaceBefore(paragraph, 100)
    }
    return paragraph
  })

  if (productItem === 'PRINT') {
    next = applyPrintKoSlide4Layout(next)
  }

  if (productItem !== 'PRINT') {
    next = next.replace(
      new RegExp(`<a:off x="903098" y="${SLIDE4_FOOTER_ORIGINAL_Y_KO}"`),
      `<a:off x="903098" y="${SLIDE4_FOOTER_SHAPE_Y_KO}"`
    )
  }

  return next
}

const SLIDE4_EN_LIST_ITEMS: Array<{
  startAt: number
  match: (text: string) => boolean
  text: string
  singleLine?: boolean
}> = [
  {
    startAt: 5,
    match: (text) => text.includes('Attack from chemical'),
    text:
      'Attack from chemical or other agents, fumes, liquids or solids other than direct rain or run-off falling onto the product.',
    singleLine: true,
  },
  {
    startAt: 6,
    match: (text) => text.includes('Failure to remove debris'),
    text:
      'Failure to remove debris and/or failure to provide free drainage of water including internal \tcondensation from all surfaces of the product.',
  },
  {
    startAt: 7,
    match: (text) => text.includes('Installations subject to salt marine'),
    text:
      'Installations subject to salt marine, severe industry or unusually corrosive environments at any time in the future.',
    singleLine: true,
  },
  {
    startAt: 8,
    match: (text) => text.includes('Corrosion arising within lapped areas'),
    text: 'Corrosion arising within lapped areas of end-lapped sheets. Corrosion at cut edges.',
    singleLine: true,
  },
  {
    startAt: 9,
    match: (text) => text.includes('Failure to replace corroded fasteners'),
    text: 'Failure to replace corroded fasteners.',
    singleLine: true,
  },
  {
    startAt: 10,
    match: (text) => text.includes('With regard to paint delamination'),
    text: 'With regard to paint delamination (peel or flake), the internal facing surface of the product.',
    singleLine: true,
  },
  {
    startAt: 11,
    match: (text) => text.includes('Damage or failure which is occurring from natural disaster'),
    text:
      "Damage or failure which is occurring from natural disaster, fire, flood, explosion, falling stone, acts of war, riots, vandalism, salt spray, atomic radiation, typhoons, other similarly extreme 'acts of God'.",
    singleLine: true,
  },
]

function enSlide4ListItemUsesSingleLine(item: {
  text: string
  singleLine?: boolean
}): boolean {
  if (item.singleLine) return true
  return !item.text.includes('\t') && !item.text.includes(EN_HARD_LINE_BREAK)
}

const SLIDE4_EN_PERIOD_ITEMS: Array<{
  startAt: number
  match: (text: string) => boolean
  text: string
}> = [
  {
    startAt: 14,
    match: (text) => text.includes('Claims must be submitted within the guarantee period'),
    text:
      'Claims must be submitted within the guarantee period and within thirty (30) days after discovering the \tdefect. Purchaser must notify the defect contents to SeAH Coated Metal in writing and give Union a \treasonable opportunity to inspect the material. And If possible, Purchaser must provide SeAH Coated \tMetal 3 samples of defect mentioning coil No., product name and lot No., shipping date and end user. \tIf not, It has to be investigated by SeAH Coated Metal or third parties.',
  },
  {
    startAt: 15,
    match: (text) => text.includes('End user must also maintain records for'),
    text:
      'End user must also maintain records for 21years that will identify the master coil number for each \tbuilding erected in the field, which shall be available to SeAH Coated Metal on request.',
  },
]

function normalizeEnSlide4ListItem(paragraphXml: string, startAt: number): string {
  const indent = startAt >= 10 ? SLIDE4_EN_ITEM_INDENT_WIDE : SLIDE4_EN_ITEM_INDENT
  const listMarkup = `<a:buAutoNum type="arabicParenR" startAt="${startAt}"/><a:tabLst><a:tab pos="${SLIDE4_EN_ITEM_MAR_L}" algn="l"/></a:tabLst>`
  const pPrInner = `<a:lnSpc><a:spcPct val="100000"/></a:lnSpc>${listMarkup}`

  if (!paragraphXml.includes('<a:pPr')) {
    return paragraphXml.replace(
      '<a:p>',
      `<a:p><a:pPr marL="${SLIDE4_EN_ITEM_MAR_L}" indent="${indent}">${pPrInner}</a:pPr>`
    )
  }

  return paragraphXml.replace(/<a:pPr([^>]*)>[\s\S]*?<\/a:pPr>/, (_match, attrs: string) => {
    const cleaned = attrs
      .replace(/\s*marL="\d+"/g, '')
      .replace(/\s*indent="-?\d+"/g, '')
    return `<a:pPr marL="${SLIDE4_EN_ITEM_MAR_L}" indent="${indent}"${cleaned}>${pPrInner}</a:pPr>`
  })
}

function applyEnSlide4ListLayout(slideXml: string): string {
  return slideXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, (paragraph) => {
    const text = normalizeMatchText(extractParagraphText(paragraph))
    const item = SLIDE4_EN_LIST_ITEMS.find((entry) => entry.match(text))
    if (!item) return paragraph

    let next = setParagraphEnCertificateText(
      paragraph,
      item.text,
      enSlide4ListItemUsesSingleLine(item) ? { singleLine: true } : undefined
    )
    next = normalizeEnSlide4ListItem(next, item.startAt)
    return ensureBuAutoNumTabLst(next)
  })
}

function isPrintEnSlide4ParenListItem(paragraphXml: string): boolean {
  const text = normalizeMatchText(extractParagraphText(paragraphXml))
  if (!text.trim()) return false
  return SLIDE4_EN_LIST_ITEMS.some((item) => item.match(text))
}

function isPrintEnSlide4LastParenItem(text: string): boolean {
  return text.includes('acts of God')
}

function isPrintEnSlide4PeriodItem(paragraphXml: string): boolean {
  const text = normalizeMatchText(extractParagraphText(paragraphXml))
  if (!text.trim()) return false
  return SLIDE4_EN_PERIOD_ITEMS.some((item) => item.match(text))
}

function normalizeEnSlide4PeriodItem(
  paragraphXml: string,
  startAt: number,
  text: string
): string {
  const marR = startAt === 14 ? '114935' : '377190'
  const gapXml =
    startAt === 15
      ? `<a:spcBef><a:spcPts val="${SLIDE4_EN_PERIOD_15_GAP_PTS}"/></a:spcBef>`
      : ''
  const listMarkup = `<a:buAutoNum type="arabicPeriod" startAt="${startAt}"/><a:tabLst><a:tab pos="${SLIDE4_EN_PERIOD_TAB_POS}" algn="l"/></a:tabLst>`
  const pPrInner = `<a:lnSpc><a:spcPct val="110800"/></a:lnSpc>${gapXml}${listMarkup}`

  let next = setParagraphEnCertificateText(paragraphXml, text)
  if (!next.includes('<a:pPr')) {
    next = next.replace(
      '<a:p>',
      `<a:p><a:pPr marL="${SLIDE4_EN_PERIOD_MAR_L}" marR="${marR}" indent="${SLIDE4_EN_PERIOD_INDENT}">${pPrInner}</a:pPr>`
    )
    return next
  }

  return next.replace(/<a:pPr([^>]*)>[\s\S]*?<\/a:pPr>/, () => {
    return `<a:pPr marL="${SLIDE4_EN_PERIOD_MAR_L}" marR="${marR}" indent="${SLIDE4_EN_PERIOD_INDENT}">${pPrInner}</a:pPr>`
  })
}

function buildPrintEnSlide4BeforePeriodSpacer(endParaRPr: string): string {
  const pPr =
    `<a:pPr marL="${SLIDE4_EN_PERIOD_MAR_L}" marR="30480" indent="${SLIDE4_EN_PERIOD_INDENT}">` +
    `<a:lnSpc><a:spcPct val="110800"/></a:lnSpc>` +
    `<a:spcBef><a:spcPts val="${SLIDE4_EN_BEFORE_PERIOD_GAP_PTS}"/></a:spcBef>` +
    `<a:buAutoNum type="arabicPeriod" startAt="14"/>` +
    `<a:tabLst><a:tab pos="${SLIDE4_EN_PERIOD_TAB_POS}" algn="l"/></a:tabLst></a:pPr>`
  return `<a:p>${pPr}${endParaRPr}</a:p>`
}

function buildPrintEnSlide4ParenSpacer(endParaRPr: string): string {
  const pPr =
    `<a:pPr marL="${SLIDE4_EN_ITEM_MAR_L}" indent="${SLIDE4_EN_ITEM_INDENT}">` +
    `<a:lnSpc><a:spcPct val="100000"/></a:lnSpc>` +
    `<a:spcBef><a:spcPts val="${SLIDE4_EN_ITEM_GAP_PTS}"/></a:spcBef>` +
    `<a:buAutoNum type="arabicParenR" startAt="5"/>` +
    `<a:tabLst><a:tab pos="${SLIDE4_EN_ITEM_MAR_L}" algn="l"/></a:tabLst></a:pPr>`
  return `<a:p>${pPr}${endParaRPr}</a:p>`
}

function applyPrintEnSlide4Layout(slideXml: string): string {
  return slideXml.replace(/<p:sp>[\s\S]*?<\/p:sp>/g, (shapeXml) => {
    if (!shapeContainsParagraphText(shapeXml, 'Attack from chemical')) {
      return shapeXml
    }

    const paragraphs: string[] = []
    shapeXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, (paragraph) => {
      paragraphs.push(paragraph)
      return paragraph
    })
    if (paragraphs.length === 0) return shapeXml

    const defaultEndRPr =
      '<a:endParaRPr lang="en-US" sz="900" dirty="0"><a:latin typeface="Malgun Gothic"/><a:cs typeface="Malgun Gothic"/></a:endParaRPr>'
    const listEndRPr =
      paragraphs
        .find((paragraph) => isPrintEnSlide4ParenListItem(paragraph))
        ?.match(/<a:endParaRPr[\s\S]*?<\/a:endParaRPr>/)?.[0] ?? defaultEndRPr
    const periodEndRPr =
      paragraphs
        .find((paragraph) => isPrintEnSlide4PeriodItem(paragraph))
        ?.match(/<a:endParaRPr[\s\S]*?<\/a:endParaRPr>/)?.[0] ?? defaultEndRPr

    const rebuilt: string[] = []

    for (const paragraph of paragraphs) {
      const text = normalizeMatchText(extractParagraphText(paragraph))

      if (isPrintEnSlide4ParenListItem(paragraph)) {
        rebuilt.push(paragraph)
        if (isPrintEnSlide4LastParenItem(text)) {
          rebuilt.push(buildPrintEnSlide4BeforePeriodSpacer(periodEndRPr))
        } else {
          rebuilt.push(buildPrintEnSlide4ParenSpacer(listEndRPr))
        }
        continue
      }

      const periodItem = SLIDE4_EN_PERIOD_ITEMS.find((entry) => entry.match(text))
      if (periodItem) {
        rebuilt.push(
          normalizeEnSlide4PeriodItem(paragraph, periodItem.startAt, periodItem.text)
        )
        continue
      }

      rebuilt.push(paragraph)
    }

    return shapeXml.replace(
      /(<p:txBody>[\s\S]*?<a:lstStyle\/>)([\s\S]*)(<\/p:txBody>)/,
      (_match, head: string, _body: string, foot: string) => `${head}${rebuilt.join('')}${foot}`
    )
  })
}

function mergeSlide4EnAttackItem(slideXml: string): string {
  const paragraphs: string[] = []
  slideXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, (paragraph) => {
    paragraphs.push(paragraph)
    return paragraph
  })

  const attackIndex = paragraphs.findIndex((paragraph) => {
    const text = normalizeMatchText(extractParagraphText(paragraph))
    return text.includes('Attack from chemical') && text.includes('run-off')
  })
  const ontoIndex = paragraphs.findIndex((paragraph) =>
    normalizeMatchText(extractParagraphText(paragraph)).startsWith('onto the product')
  )
  if (attackIndex < 0 || ontoIndex !== attackIndex + 1) return slideXml

  paragraphs[attackIndex] = setParagraphEnCertificateText(
    paragraphs[attackIndex],
    SLIDE4_EN_LIST_ITEMS.find((entry) => entry.startAt === 5)!.text
  )
  paragraphs[ontoIndex] = ''

  let paragraphIndex = 0
  return slideXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, () => {
    const next = paragraphs[paragraphIndex] ?? ''
    paragraphIndex += 1
    return next
  })
}

function mergeSlide4EnDebrisItem(slideXml: string): string {
  const paragraphs: string[] = []
  slideXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, (paragraph) => {
    paragraphs.push(paragraph)
    return paragraph
  })

  const debrisIndex = paragraphs.findIndex((paragraph) => {
    const text = normalizeMatchText(extractParagraphText(paragraph))
    return text.includes('Failure to remove debris') && text.includes('free drainage')
  })
  const condensationIndex = paragraphs.findIndex((paragraph) =>
    normalizeMatchText(extractParagraphText(paragraph)).startsWith(
      'condensation from all surfaces'
    )
  )
  if (debrisIndex < 0 || condensationIndex !== debrisIndex + 1) return slideXml

  paragraphs[debrisIndex] = setParagraphEnCertificateText(
    paragraphs[debrisIndex],
    SLIDE4_EN_LIST_ITEMS.find((entry) => entry.startAt === 6)!.text
  )
  paragraphs[condensationIndex] = ''

  let paragraphIndex = 0
  return slideXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, () => {
    const next = paragraphs[paragraphIndex] ?? ''
    paragraphIndex += 1
    return next
  })
}

function ensureEnSlide4FooterBold(paragraphXml: string): string {
  return paragraphXml
    .replace(/<a:rPr([^>]*)>/g, (match, attrs: string) => {
      if (/\bb="1"/.test(attrs)) return match
      return `<a:rPr${attrs} b="1">`
    })
    .replace(/<a:rPr([^>]*)\/>/g, (match, attrs: string) => {
      if (/\bb="1"/.test(attrs)) return match
      return `<a:rPr${attrs} b="1"/>`
    })
}

function applySlide4EnFixes(slideXml: string): string {
  let next = slideXml

  next = removeParagraphByPredicate(next, (paragraph) => {
    const text = normalizeMatchText(extractParagraphText(paragraph))
    return text.includes(
      'Damage resulting from exposure to extreme or abnormal environments'
    )
  })

  next = removeParagraphByPredicate(next, (paragraph) => {
    const text = normalizeMatchText(extractParagraphText(paragraph)).trim()
    return text === '.' || text === ' .'
  })

  next = removeEmptyParagraphs(next)

  next = mergeSlide4EnAttackItem(next)
  next = mergeSlide4EnDebrisItem(next)
  next = removeEmptyParagraphs(next)
  next = applyEnSlide4ListLayout(next)
  next = applyPrintEnSlide4Layout(next)

  next = next.replace(/<a:p>[\s\S]*?<\/a:p>/g, (paragraph) => {
    const text = normalizeMatchText(extractParagraphText(paragraph))

    if (text.includes('This warranty becomes effective when all of above conditions')) {
      let footerText = ensureNumberedItemSpacing(text).trimEnd()
      if (!footerText.endsWith('.')) {
        footerText = `${footerText}.`
      }
      footerText = footerText.replace(/done\.\s*$/, `done${NBSP}.`)
      let footer = setParagraphEnCertificateText(paragraph, footerText, {
        singleLine: true,
      })
      footer = ensureEnSlide4FooterBold(footer)
      return setParagraphSpaceBefore(footer, SLIDE4_EN_FOOTER_GAP_PTS)
    }

    return paragraph
  })

  next = applySlide4EnListBodyFix(next)
  next = applySlide4EnFooterPositionFix(next)
  next = applySlide4EnFooterShapeFix(next)

  return next
}

export function postProcessSlideXml(
  slideXml: string,
  slideNumber: number,
  language: 'ko' | 'en',
  options?: { productItem?: 'PAINT' | 'PRINT' }
): string {
  const productItem = options?.productItem
  let next = slideXml

  if (slideNumber === 1) {
    next = applySlide1CoverTitleFix(next)
  }

  next = mapOutsideTables(next, (outsideXml) => {
    let body = normalizeBodyTextAlignment(outsideXml)
    const enCertificateBody =
      (slideNumber === 3 || slideNumber === 4) && language === 'en'
    const preserveParagraph =
      slideNumber === 2 && language === 'en' && productItem === 'PRINT'
        ? shouldPreserveSlide2EnPrintParagraph
        : undefined
    body = consolidateBodyParagraphs(body, enCertificateBody, preserveParagraph)
    return body
  })

  next = next.replace(/<a:tbl>[\s\S]*?<\/a:tbl>/g, (tableXml) =>
    processTable(tableXml, productItem, language)
  )

  if (slideNumber === 2) {
    next = applySlide2TableLayoutFix(next, language, productItem)
    if (language === 'en') {
      next = applySlide2EnSectionSpacing(next)
      if (productItem === 'PRINT') {
        next = applySlide2EnPrintHeaderBoldFix(next)
      }
    }
    if (productItem === 'PRINT' && language === 'ko') {
      next = applySlide2KoPrintSpacingFix(next)
    }
  }

  if (slideNumber === 3 && language === 'ko') {
    next = applySlide3KoSpacingFix(next)
  }

  if (slideNumber === 3 && language === 'en') {
    next = applySlide3EnFixes(next, productItem)
  }

  if (slideNumber === 4 && language === 'ko') {
    next = applySlide4KoFixes(next, productItem)
  }

  if (slideNumber === 4 && language === 'en') {
    next = applySlide4EnFixes(next)
  }

  if ((slideNumber === 3 || slideNumber === 4) && language === 'en') {
    next = applySlide34EnBodyLayoutFix(next, slideNumber)
  }

  return next
}
