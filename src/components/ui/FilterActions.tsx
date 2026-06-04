import { Search, RotateCcw } from 'lucide-react'

interface FilterActionsProps {
  onSearch: () => void
  onReset: () => void
}

export function FilterActions({ onSearch, onReset }: FilterActionsProps) {
  return (
    <div className="flex shrink-0 items-end gap-2">
      <button
        type="button"
        onClick={onSearch}
        className="inline-flex h-[38px] items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-accent-hover"
      >
        <Search className="h-4 w-4" />
        조회
      </button>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex h-[38px] items-center gap-2 rounded-lg border border-border bg-bg-tertiary px-4 py-2 text-sm font-medium whitespace-nowrap text-text-secondary transition-colors hover:text-text-primary"
      >
        <RotateCcw className="h-4 w-4" />
        초기화
      </button>
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent'

interface SearchInputProps {
  label: string
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
      <label className="mb-1 block text-xs text-text-muted">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  )
}
