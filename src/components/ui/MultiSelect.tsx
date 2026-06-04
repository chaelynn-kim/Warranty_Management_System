import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface MultiSelectProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  formatOption?: (value: string) => string
  className?: string
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
        checked
          ? 'border-accent bg-accent text-white'
          : 'border-border bg-bg-primary'
      }`}
    >
      {checked && <Check className="h-3 w-3" strokeWidth={3} />}
    </span>
  )
}

export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  formatOption,
  className = '',
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const displayLabel =
    selected.length === 0
      ? '전체'
      : selected.map((s) => formatOption?.(s) ?? s).join(', ')

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt))
    } else {
      onChange([...selected, opt])
    }
  }

  return (
    <div ref={ref} className={`relative min-w-[110px] flex-1 ${className}`}>
      <label className="mb-1 block text-xs text-text-muted">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-left text-sm text-text-primary outline-none transition-colors hover:border-text-muted focus:border-accent"
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full z-50 mt-1 max-h-56 w-full min-w-[160px] overflow-y-auto rounded-lg border border-border bg-bg-secondary py-1 shadow-xl">
          <button
            type="button"
            onClick={() => onChange([])}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-text-primary transition-colors hover:bg-bg-tertiary"
          >
            <Checkbox checked={selected.length === 0} />
            전체
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => toggleOption(opt)}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-text-primary transition-colors hover:bg-bg-tertiary"
            >
              <Checkbox checked={selected.includes(opt)} />
              <span className="truncate">{formatOption?.(opt) ?? opt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
