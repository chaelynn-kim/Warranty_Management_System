import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

export interface DateRangeValue {
  from: string
  to: string
}

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function toInputValue(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function parseInputValue(value: string): Date | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  return date
}

function normalizeTypedDate(value: string): string {
  const parsed = parseInputValue(value)
  return parsed ? toInputValue(parsed) : value.trim()
}

function buildMonthGrid(year: number, month: number) {
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  const cells: { date: Date; inCurrentMonth: boolean }[] = []

  for (let index = firstWeekday - 1; index >= 0; index -= 1) {
    cells.push({
      date: new Date(year, month - 1, daysInPrevMonth - index),
      inCurrentMonth: false,
    })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: new Date(year, month, day), inCurrentMonth: true })
  }

  let nextDay = 1
  while (cells.length % 7 !== 0) {
    cells.push({ date: new Date(year, month + 1, nextDay), inCurrentMonth: false })
    nextDay += 1
  }

  while (cells.length < 42) {
    cells.push({ date: new Date(year, month + 1, nextDay), inCurrentMonth: false })
    nextDay += 1
  }

  return cells
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

interface DateRangePickerProps {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  compact?: boolean
}

interface RangeInputProps {
  value: string
  active: boolean
  compact: boolean
  onFocus: () => void
  onOpen: () => void
  onChange: (value: string) => void
  onCommit: (value: string) => void
}

function RangeInput({ value, active, compact, onFocus, onOpen, onChange, onCommit }: RangeInputProps) {
  return (
    <div className={`relative flex-1 ${compact ? 'min-w-[88px]' : 'min-w-[110px]'}`}>
      <input
        type="text"
        inputMode="numeric"
        placeholder="YYYY-MM-DD"
        value={value}
        onFocus={onFocus}
        onClick={onOpen}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onCommit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onCommit((e.target as HTMLInputElement).value)
          }
        }}
        className={`w-full rounded border bg-bg-primary pr-6 text-text-primary outline-none placeholder:text-text-muted focus:border-accent ${
          compact ? 'h-8 px-2 text-xs' : 'px-3 py-2.5 text-sm'
        } ${active ? 'border-accent' : 'border-border'}`}
      />
      <ChevronDown
        className={`pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 text-text-muted ${
          compact ? 'h-3 w-3' : 'h-3.5 w-3.5'
        }`}
      />
    </div>
  )
}

export function DateRangePicker({ value, onChange, compact = false }: DateRangePickerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [activeField, setActiveField] = useState<'from' | 'to'>('from')
  const [draftFrom, setDraftFrom] = useState(value.from)
  const [draftTo, setDraftTo] = useState(value.to)

  const activeValue = activeField === 'from' ? draftFrom : draftTo
  const selectedDate = parseInputValue(activeValue)
  const [viewDate, setViewDate] = useState(() => selectedDate ?? new Date())

  useEffect(() => {
    setDraftFrom(value.from)
    setDraftTo(value.to)
  }, [value.from, value.to])

  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate)
    }
  }, [activeValue])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const cells = useMemo(
    () => buildMonthGrid(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate]
  )

  const fromDate = parseInputValue(draftFrom)
  const toDate = parseInputValue(draftTo)

  const applyRange = (next: DateRangeValue) => {
    onChange(next)
    setDraftFrom(next.from)
    setDraftTo(next.to)
  }

  const commitField = (field: 'from' | 'to', raw: string) => {
    const normalized = normalizeTypedDate(raw)
    const parsed = parseInputValue(normalized)

    if (!raw.trim()) {
      applyRange(field === 'from' ? { ...value, from: '' } : { ...value, to: '' })
      return
    }

    if (!parsed) {
      if (field === 'from') setDraftFrom(value.from)
      else setDraftTo(value.to)
      return
    }

    const dateStr = toInputValue(parsed)
    if (field === 'from') {
      const next = { from: dateStr, to: value.to }
      if (value.to && dateStr > value.to) next.to = ''
      applyRange(next)
    } else {
      const next = { from: value.from, to: dateStr }
      if (value.from && dateStr < value.from) next.from = dateStr
      applyRange(next)
    }
  }

  const selectDate = (date: Date) => {
    const dateStr = toInputValue(date)
    if (activeField === 'from') {
      const next = { from: dateStr, to: value.to }
      if (value.to && dateStr > value.to) next.to = ''
      applyRange(next)
      setActiveField('to')
      setViewDate(date)
      return
    }
    const next = { from: value.from, to: dateStr }
    if (value.from && dateStr < value.from) next.from = dateStr
    applyRange(next)
    setOpen(false)
  }

  const openField = (field: 'from' | 'to') => {
    setActiveField(field)
    setOpen(true)
    const target = field === 'from' ? parseInputValue(draftFrom) : parseInputValue(draftTo)
    if (target) setViewDate(target)
  }

  const shiftMonth = (offset: number) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1))
  }

  const shiftYear = (offset: number) => {
    setViewDate((prev) => new Date(prev.getFullYear() + offset, prev.getMonth(), 1))
  }

  return (
    <div ref={ref} className="relative">
      <div className={`flex items-center ${compact ? 'gap-0.5' : 'gap-1'}`}>
        <RangeInput
          value={draftFrom}
          active={open && activeField === 'from'}
          compact={compact}
          onFocus={() => openField('from')}
          onOpen={() => openField('from')}
          onChange={setDraftFrom}
          onCommit={(v) => commitField('from', v)}
        />
        <span className={`shrink-0 text-text-muted ${compact ? 'text-xs' : 'text-sm'}`}>~</span>
        <RangeInput
          value={draftTo}
          active={open && activeField === 'to'}
          compact={compact}
          onFocus={() => openField('to')}
          onOpen={() => openField('to')}
          onChange={setDraftTo}
          onCommit={(v) => commitField('to', v)}
        />
      </div>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-[280px] rounded-lg border border-border bg-bg-secondary p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="rounded p-0.5 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                aria-label="이전 달"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[36px] text-center text-sm font-medium text-text-primary">
                {viewDate.getMonth() + 1}월
              </span>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="rounded p-0.5 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                aria-label="다음 달"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => shiftYear(-1)}
                className="rounded p-0.5 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                aria-label="이전 년"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[44px] text-center text-sm font-medium text-text-primary">
                {viewDate.getFullYear()}
              </span>
              <button
                type="button"
                onClick={() => shiftYear(1)}
                className="rounded p-0.5 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                aria-label="다음 년"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {WEEKDAYS.map((weekday, index) => (
              <div
                key={weekday}
                className={`py-1 text-center text-xs font-medium ${
                  index === 0 ? 'text-red-400' : index === 6 ? 'text-orange-400' : 'text-text-muted'
                }`}
              >
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {cells.map(({ date, inCurrentMonth }) => {
              const isFrom = fromDate ? isSameDay(date, fromDate) : false
              const isTo = toDate ? isSameDay(date, toDate) : false
              const selected = isFrom || isTo
              const today = isSameDay(date, new Date())
              const weekday = date.getDay()

              return (
                <button
                  key={`${toInputValue(date)}-${inCurrentMonth}`}
                  type="button"
                  onClick={() => selectDate(date)}
                  className={`h-8 rounded text-sm transition-colors ${
                    selected
                      ? 'bg-sky-500 font-semibold text-white'
                      : inCurrentMonth
                        ? today
                          ? 'border border-accent/50 text-accent hover:bg-accent/10'
                          : weekday === 0
                            ? 'text-red-400 hover:bg-bg-tertiary'
                            : weekday === 6
                              ? 'text-orange-400 hover:bg-bg-tertiary'
                              : 'text-text-primary hover:bg-bg-tertiary'
                        : 'text-text-muted/50 hover:bg-bg-tertiary/60'
                  }`}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2">
            <button
              type="button"
              onClick={() => selectDate(new Date())}
              className="text-sm text-text-secondary transition-colors hover:text-accent"
            >
              오늘
            </button>
            <button
              type="button"
              onClick={() => {
                applyRange({ from: '', to: '' })
                setOpen(false)
              }}
              className="text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              초기화
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
