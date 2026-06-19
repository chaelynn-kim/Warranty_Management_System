export function matchesMultiFilter(selected: string[], value: string): boolean {
  if (selected.length === 0) return true
  return selected.includes(value)
}

export function matchesMultiFilterAny(selected: string[], value: string): boolean {
  if (selected.length === 0) return true
  const values = value
    .split(/[,，]/)
    .map((item) => item.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  if (values.length === 0) return false
  return selected.some((item) => values.includes(item))
}

export function matchesTextFilter(query: string, value: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return value.toLowerCase().includes(q)
}

export function matchesDateRangeFilter(
  range: { from: string; to: string },
  value: string,
  normalize: (dateStr: string) => string
): boolean {
  const from = range.from.trim() ? normalize(range.from.trim()) : ''
  const to = range.to.trim() ? normalize(range.to.trim()) : ''
  if (!from && !to) return true

  const normalized = value ? normalize(value) : ''
  if (!normalized) return false
  if (from && normalized < from) return false
  if (to && normalized > to) return false
  return true
}
