export function normalizeDate(dateStr: string): string {
  if (!dateStr) return ''
  const cleaned = dateStr.replace(/-/g, '')
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`
  }
  return dateStr
}

export function isValidDateStr(dateStr: string): boolean {
  if (!dateStr) return false
  const normalized = normalizeDate(dateStr)
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized)
}

export function formatDisplayDate(dateStr: string): string {
  if (!isValidDateStr(dateStr)) return '-'
  return normalizeDate(dateStr)
}

export function getYearFromDate(dateStr: string): string {
  if (!isValidDateStr(dateStr)) return ''
  return normalizeDate(dateStr).slice(0, 4)
}

export function getMonthFromDate(dateStr: string): string {
  if (!isValidDateStr(dateStr)) return ''
  return normalizeDate(dateStr).slice(5, 7)
}

export function getDayFromDate(dateStr: string): string {
  if (!isValidDateStr(dateStr)) return ''
  return normalizeDate(dateStr).slice(8, 10)
}

export function splitDateParts(dateStr: string): { year: string; month: string; day: string } {
  if (!isValidDateStr(dateStr)) {
    return { year: '', month: '', day: '' }
  }
  const normalized = normalizeDate(dateStr)
  return {
    year: normalized.slice(0, 4),
    month: normalized.slice(5, 7),
    day: normalized.slice(8, 10),
  }
}

export function toDateInputValue(dateStr: string): string {
  if (!dateStr) return ''
  const normalized = normalizeDate(dateStr)
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : ''
}

export function isDomestic(region: string): boolean {
  return region.includes('국내') || region === '국내'
}

export function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'ko')
  )
}

export function multilineText(text: string): string {
  return text.replace(/\\n/g, '\n')
}

export function formatFadeForStorage(raw: string): string {
  return formatFadeDisplay(raw)
}

/** Split fade values like "≤ΔE7(5Y)" into two lines for display/editing. */
export function formatFadeDisplay(value: string): string {
  if (!value) return ''
  const text = multilineText(value).trim()
  if (!text) return ''

  if (text.includes('\n')) {
    const [first, ...rest] = text.split('\n')
    const second = rest.join('\n').trim()
    return second ? `${first.trim()}\n${second}` : first.trim()
  }

  const parenMatch = text.match(/^(.+?)(\([^)]*\))\s*$/)
  if (parenMatch) return `${parenMatch[1].trim()}\n${parenMatch[2].trim()}`

  return text
}

/** Value shown while editing peel field (without auto Y suffix). */
export function peelEditValue(value: string): string {
  if (!value) return ''
  const trimmed = value.trim()
  if (/^x$/i.test(trimmed)) return 'X'
  return trimmed.replace(/y$/i, '')
}

/** Display peel warranty value; bare numbers show with Y suffix. */
export function formatPeelDisplay(value: string): string {
  if (!value) return ''
  if (/^\d+$/.test(value)) return `${value}Y`
  return value
}

/** Normalize peel input: digits → "{n}Y", preserve X and other text. */
export function formatPeelValue(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/^x$/i.test(trimmed)) return 'X'
  const digits = trimmed.replace(/y$/i, '')
  if (/^\d+$/.test(digits)) return `${digits}Y`
  return trimmed
}
