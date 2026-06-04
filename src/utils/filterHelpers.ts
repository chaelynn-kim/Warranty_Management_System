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
