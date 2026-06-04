export const PAINT_COMPANIES = [
  'NCC',
  'SAMHWA',
  'KCC',
  'PPG',
  'AK',
  'VALSPA',
] as const

export const RESIN_TYPES = [
  'RMP',
  'HDP',
  'SMP',
  'ADP',
  'MVP',
  'NDP',
  'SQP40',
  'URETHANE',
  'HBU',
  'PVDF',
  'RMP MATT',
] as const

export function normalizeOptionValue(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

export function buildSelectOptions(fixedOptions: readonly string[], currentValue: string): string[] {
  const normalized = normalizeOptionValue(currentValue)
  if (!normalized || fixedOptions.includes(normalized)) {
    return [...fixedOptions]
  }
  return [normalized, ...fixedOptions]
}

export function parseMultiValue(value: string): string[] {
  if (!value.trim()) return []
  return [
    ...new Set(
      value
        .split(/[,，]/)
        .map(normalizeOptionValue)
        .filter(Boolean)
    ),
  ]
}

export function joinMultiValue(values: string[]): string {
  return values.map(normalizeOptionValue).filter(Boolean).join(', ')
}

export function buildMultiSelectOptions(
  fixedOptions: readonly string[],
  currentValue: string
): string[] {
  const selected = parseMultiValue(currentValue)
  const extras = selected.filter((item) => !fixedOptions.includes(item))
  const fixed = fixedOptions.filter((item) => !extras.includes(item))
  return [...extras, ...fixed]
}
