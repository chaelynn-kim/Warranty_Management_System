import { formatFadeDisplay } from '../../utils/helpers'
import { periodInputClass } from './periodTheme'

interface GuideCellProps {
  value: string
  editing: boolean
  onChange: (value: string) => void
  multiline?: boolean
  formatSplit?: boolean
  className?: string
}

export function guideValueClass(value: string): string {
  const v = value.trim()
  if (!v || v === '-') return 'text-text-muted'
  if (v.includes('보증 불가') || v.includes('NO Warranty')) return 'font-semibold text-red-400'
  if (v === 'N/A' || v.includes('측정 불가')) return 'text-text-muted'
  return 'text-text-primary'
}

export function GuideCell({
  value,
  editing,
  onChange,
  multiline = false,
  formatSplit = false,
  className = '',
}: GuideCellProps) {
  const display = formatSplit ? formatFadeDisplay(value) : value

  if (!editing) {
    return (
      <span
        className={`flex h-full w-full items-center justify-center whitespace-pre-line text-center text-sm ${guideValueClass(display)} overflow-hidden ${className}`}
      >
        {display || '-'}
      </span>
    )
  }

  if (multiline || formatSplit) {
    return (
      <textarea
        rows={2}
        value={display}
        onChange={(e) => onChange(e.target.value)}
        className={`${periodInputClass} h-full max-h-full min-h-0 resize-y leading-snug !py-0`}
      />
    )
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${periodInputClass} h-full min-h-0 !py-0`}
    />
  )
}
