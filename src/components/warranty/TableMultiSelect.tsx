import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface TableMultiSelectProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  formatOption?: (value: string) => string
  placeholder?: string
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
        checked ? 'border-accent bg-accent text-white' : 'border-border bg-bg-primary'
      }`}
    >
      {checked && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
    </span>
  )
}

export function TableMultiSelect({
  options,
  selected,
  onChange,
  formatOption,
  placeholder = '전체',
}: TableMultiSelectProps) {
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
      ? placeholder
      : selected.map((s) => formatOption?.(s) ?? s).join(', ')

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt))
    } else {
      onChange([...selected, opt])
    }
  }

  return (
    <div ref={ref} className="relative w-full min-w-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-8 w-full items-center justify-between gap-1 rounded border border-border bg-bg-primary px-2 text-left text-xs text-text-primary outline-none transition-colors hover:border-text-muted focus:border-accent"
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-[60] mt-0.5 max-h-48 w-full min-w-[120px] overflow-y-auto rounded-lg border border-border bg-bg-secondary py-1 shadow-xl">
          <button
            type="button"
            onClick={() => onChange([])}
            className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs text-text-primary transition-colors hover:bg-bg-tertiary"
          >
            <Checkbox checked={selected.length === 0} />
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => toggleOption(opt)}
              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs text-text-primary transition-colors hover:bg-bg-tertiary"
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
