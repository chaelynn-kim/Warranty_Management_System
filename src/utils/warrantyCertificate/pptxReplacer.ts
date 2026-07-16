const RED_FILL = '<a:solidFill><a:srgbClr val="FF0000"/></a:solidFill>'
/** 1페이지 대형 연수 — 제목(NDP TOP W950)과 동일한 회색 */
const WARRANTY_COVER_YEAR_COLOR = 'A9A9A9'
const WARRANTY_COVER_YEAR_FILL = `<a:solidFill><a:srgbClr val="${WARRANTY_COVER_YEAR_COLOR}"/></a:solidFill>`
/** 양식에서 빨간 표시로 지정한 자리표시자 치환 후 — 굵은 검정 */
const FILLED_EMPHASIS_COLOR = '000000'
const FILLED_EMPHASIS_FILL = `<a:solidFill><a:srgbClr val="${FILLED_EMPHASIS_COLOR}"/></a:solidFill>`

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function stripRunRedFill(runXml: string): string {
  return runXml.replace(/<a:solidFill><a:srgbClr val="FF0000"\/?><\/a:solidFill>/gi, '')
}

function stripParagraphRedColors(paragraphXml: string): string {
  return paragraphXml.replace(/<a:solidFill><a:srgbClr val="FF0000"\/?><\/a:solidFill>/gi, '')
}

function ensureBoldRun(runXml: string): string {
  if (/\sb="1"/.test(runXml) || /\sb="true"/.test(runXml)) return runXml
  if (/\sb="0"/.test(runXml) || /\sb="false"/.test(runXml)) {
    return runXml.replace(/\sb="0"/, ' b="1"').replace(/\sb="false"/, ' b="1"')
  }
  if (/<a:rPr[^>]*\/>/.test(runXml)) {
    return runXml.replace(/<a:rPr([^>]*)\/>/, '<a:rPr$1 b="1"/>')
  }
  if (/<a:rPr[^>]*>/.test(runXml)) {
    return runXml.replace(/<a:rPr([^>]*)>/, '<a:rPr$1 b="1">')
  }
  return runXml.replace(/<a:r>/, `<a:r><a:rPr b="1">${FILLED_EMPHASIS_FILL}</a:rPr>`)
}

function applyRunSolidFill(runXml: string, fillXml: string, colorHex: string): string {
  let next = runXml
  if (/FF0000/i.test(next)) {
    next = next.replace(/<a:srgbClr val="FF0000"\/?>/gi, `<a:srgbClr val="${colorHex}"/>`)
  } else if (/<a:solidFill>[\s\S]*?<\/a:solidFill>/.test(next)) {
    next = next.replace(/<a:solidFill>[\s\S]*?<\/a:solidFill>/, fillXml)
  } else if (/<a:rPr[^>]*>/.test(next)) {
    next = next.replace(/<a:rPr([^>]*)>/, `<a:rPr$1>${fillXml}`)
  } else {
    next = next.replace(/<a:r>/, `<a:r><a:rPr>${fillXml}</a:rPr>`)
  }
  return next
}

/** 빨간 표시 자리 → 굵은 검정 */
function applyEmphasisBlackStyle(runXml: string): string {
  return ensureBoldRun(applyRunSolidFill(runXml, FILLED_EMPHASIS_FILL, FILLED_EMPHASIS_COLOR))
}

function applyCoverYearStyle(runXml: string): string {
  return ensureBoldRun(applyRunSolidFill(runXml, WARRANTY_COVER_YEAR_FILL, WARRANTY_COVER_YEAR_COLOR))
}

function getRedGroups(paragraphXml: string): string[] {
  const groups: string[] = []
  let current = ''
  const runs = paragraphXml.match(/<a:r>[\s\S]*?<\/a:r>/g) ?? []

  for (const run of runs) {
    const textMatch = run.match(/<a:t>([\s\S]*?)<\/a:t>/)
    if (!textMatch) continue

    if (run.includes('FF0000')) {
      current += textMatch[1]
    } else if (current) {
      groups.push(current)
      current = ''
    }
  }

  if (current) groups.push(current)
  return groups
}

function setRedGroupsInParagraph(
  paragraphXml: string,
  groupValues: Map<number, string>,
  grayGroups: Set<number>,
  emphasisGroups: Set<number>
): string {
  if (groupValues.size === 0) return paragraphXml

  const runs = paragraphXml.match(/<a:r>[\s\S]*?<\/a:r>/g) ?? []
  let currentGroup = -1
  let inRedGroup = false
  const appliedGroups = new Set<number>()

  const rebuiltRuns = runs.map((run) => {
    const isRed = run.includes('FF0000')
    if (!isRed) {
      if (inRedGroup) inRedGroup = false
      return run
    }

    if (!inRedGroup) {
      currentGroup += 1
      inRedGroup = true
    }

    const newText = groupValues.get(currentGroup)
    if (newText === undefined) return run

    let nextRun: string
    if (grayGroups.has(currentGroup)) {
      nextRun = applyCoverYearStyle(run)
    } else if (emphasisGroups.has(currentGroup)) {
      nextRun = applyEmphasisBlackStyle(run)
    } else {
      nextRun = stripRunRedFill(run)
    }

    if (!appliedGroups.has(currentGroup)) {
      appliedGroups.add(currentGroup)
      return nextRun.replace(/<a:t>[\s\S]*?<\/a:t>/, `<a:t>${escapeXml(newText)}</a:t>`)
    }
    return nextRun.replace(/<a:t>[\s\S]*?<\/a:t>/, '<a:t></a:t>')
  })

  let runIndex = 0
  return stripParagraphRedColors(
    paragraphXml.replace(/<a:r>[\s\S]*?<\/a:r>/g, () => rebuiltRuns[runIndex++] ?? '')
  )
}

export function clearRunTextRange(paragraphXml: string, fromRunIndex: number, toRunIndex: number): string {
  let runIndex = 0
  return paragraphXml.replace(/<a:r>[\s\S]*?<\/a:r>/g, (run) => {
    const current = runIndex
    runIndex += 1
    if (current < fromRunIndex || current > toRunIndex) return run
    return run.replace(/<a:t>[\s\S]*?<\/a:t>/, '<a:t></a:t>')
  })
}

export function setRunText(paragraphXml: string, runIndex: number, text: string): string {
  let current = 0
  return paragraphXml.replace(/<a:r>[\s\S]*?<\/a:r>/g, (run) => {
    const index = current
    current += 1
    if (index !== runIndex) return run
    return run.replace(/<a:t>[\s\S]*?<\/a:t>/, `<a:t>${escapeXml(text)}</a:t>`)
  })
}

export interface ThicknessClauseRemoval {
  paragraph: number
  finalizeRun: number
  finalizeText: string
  clearRunStart: number
  clearRunEnd: number
}

export interface SlideReplacement {
  slide: number
  paragraph: number
  group: number
  value: string
  /** 1페이지 대형 연수만 제목과 동일한 회색 적용 */
  useCoverYearGray?: boolean
  /** 양식 빨간 표시 자리 — 치환 후 굵은 검정 */
  emphasizeBoldBlack?: boolean
}

export function applySlideReplacements(slideXml: string, replacements: SlideReplacement[]): string {
  if (replacements.length === 0) return slideXml

  const rulesByParagraph = new Map<number, SlideReplacement[]>()

  for (const rule of replacements) {
    const existing = rulesByParagraph.get(rule.paragraph) ?? []
    existing.push(rule)
    rulesByParagraph.set(rule.paragraph, existing)
  }

  let paragraphIndex = 0
  return slideXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, (paragraph) => {
    const rules = rulesByParagraph.get(paragraphIndex)
    paragraphIndex += 1
    if (!rules || !paragraph.includes(RED_FILL)) return paragraph

    const groupValues = new Map<number, string>()
    const grayGroups = new Set<number>()
    const emphasisGroups = new Set<number>()
    for (const rule of rules) {
      groupValues.set(rule.group, rule.value)
      if (rule.useCoverYearGray) grayGroups.add(rule.group)
      if (rule.emphasizeBoldBlack) emphasisGroups.add(rule.group)
    }
    return setRedGroupsInParagraph(paragraph, groupValues, grayGroups, emphasisGroups)
  })
}

export function removeCoatingThicknessClause(
  slideXml: string,
  config: ThicknessClauseRemoval
): string {
  let paragraphIndex = 0
  return slideXml.replace(/<a:p>[\s\S]*?<\/a:p>/g, (paragraph) => {
    const current = paragraphIndex
    paragraphIndex += 1
    if (current !== config.paragraph) return paragraph

    let next = clearRunTextRange(paragraph, config.clearRunStart, config.clearRunEnd)
    next = setRunText(next, config.finalizeRun, config.finalizeText)
    return stripParagraphRedColors(next)
  })
}

export function collectRedGroupsForDebug(slideXml: string): Array<{ paragraph: number; groups: string[] }> {
  const paragraphs = slideXml.match(/<a:p>[\s\S]*?<\/a:p>/g) ?? []
  const result: Array<{ paragraph: number; groups: string[] }> = []

  paragraphs.forEach((paragraph, index) => {
    const groups = getRedGroups(paragraph)
    if (groups.length > 0) {
      result.push({ paragraph: index, groups })
    }
  })

  return result
}
