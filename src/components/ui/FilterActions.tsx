import { Search, RotateCcw } from 'lucide-react'

/** Shared filter/toolbar action buttons — fixed height, no vertical padding conflict */
export const filterActionButtonClass =
  'inline-flex h-[38px] shrink-0 items-center justify-center gap-2 rounded-lg border box-border px-4 text-sm font-medium whitespace-nowrap transition-colors'

export const filterSearchButtonClass = `${filterActionButtonClass} border-transparent bg-accent text-white hover:bg-accent-hover`

export const filterResetButtonClass = `${filterActionButtonClass} border-border bg-bg-tertiary text-text-secondary hover:text-text-primary`

interface FilterActionsProps {
  onSearch: () => void
  onReset: () => void
}

export function FilterActions({ onSearch, onReset }: FilterActionsProps) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <button type="button" onClick={onSearch} className={filterSearchButtonClass}>
        <Search className="h-4 w-4 shrink-0" />
        조회
      </button>
      <button type="button" onClick={onReset} className={filterResetButtonClass}>
        <RotateCcw className="h-4 w-4 shrink-0" />
        초기화
      </button>
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent'

interface SearchInputProps {
  label?: string
  value: string
  onChange: (value: string) => void
  onEnter?: () => void
  placeholder?: string
  className?: string
}

export function SearchInput({
  label,
  value,
  onChange,
  onEnter,
  placeholder,
  className = '',
}: SearchInputProps) {
  return (
    <div className={`min-w-[140px] flex-1 ${className}`}>
      {label && <label className="mb-1 block text-xs text-text-muted">{label}</label>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        placeholder={placeholder}
        className={`${inputClass} h-[38px]`}
      />
    </div>
  )
}
