import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { isValidDateStr, normalizeDate } from '../../utils/helpers'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function toInputValue(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function parseInputValue(value: string): Date | null {
  if (!value) return null
  const normalized = normalizeDate(value.trim())
  if (!isValidDateStr(normalized)) return null
  const [year, month, day] = normalized.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDisplayDate(value: string) {
  const date = parseInputValue(value)
  if (!date) return ''
  return `${date.getFullYear()}. ${pad2(date.getMonth() + 1)}. ${pad2(date.getDate())}.`
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

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  variant?: 'button' | 'input'
}

export function DatePicker({
  value,
  onChange,
  placeholder = '날짜 선택',
  className = '',
  variant = 'button',
}: DatePickerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const selectedDate = parseInputValue(value)
  const [viewDate, setViewDate] = useState(() => selectedDate ?? new Date())

  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate)
    }
  }, [value])

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

  const selectDate = (date: Date) => {
    onChange(toInputValue(date))
    setViewDate(date)
    setOpen(false)
  }

  const shiftMonth = (offset: number) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1))
  }

  const displayValue = formatDisplayDate(value)

  const handleInputBlur = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    if (isValidDateStr(trimmed)) {
      onChange(normalizeDate(trimmed))
    }
  }

  const calendarWidthClass =
    variant === 'input' ? 'w-[280px]' : 'w-[min(100%,280px)]'

  const calendarPanel = open ? (
    <div
      className={`absolute top-full left-0 z-50 mt-1 ${calendarWidthClass} rounded-lg border border-border bg-bg-secondary p-3 shadow-xl`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="rounded-md p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="이전 달"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1 text-sm font-medium text-text-primary">
          <span>
            {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
        </div>

        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="rounded-md p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="다음 달"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((weekday, index) => (
          <div
            key={weekday}
            className={`py-1 text-center text-xs font-medium ${
              index === 0 ? 'text-red-400' : index === 6 ? 'text-accent' : 'text-text-muted'
            }`}
          >
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ date, inCurrentMonth }) => {
          const selected = selectedDate ? isSameDay(date, selectedDate) : false
          const today = isSameDay(date, new Date())
          const weekday = date.getDay()

          return (
            <button
              key={toInputValue(date)}
              type="button"
              onClick={() => selectDate(date)}
              className={`h-8 rounded-md text-sm transition-colors ${
                selected
                  ? 'bg-accent font-semibold text-white'
                  : inCurrentMonth
                    ? today
                      ? 'border border-accent/50 text-accent hover:bg-accent/10'
                      : weekday === 0
                        ? 'text-red-400 hover:bg-bg-tertiary'
                        : weekday === 6
                          ? 'text-accent hover:bg-bg-tertiary'
                          : 'text-text-primary hover:bg-bg-tertiary'
                    : 'text-text-muted hover:bg-bg-tertiary/60'
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
          onClick={() => {
            onChange('')
            setOpen(false)
          }}
          className="text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          {variant === 'input' ? '초기화' : '삭제'}
        </button>
        <button
          type="button"
          onClick={() => selectDate(new Date())}
          className="text-sm text-accent transition-colors hover:text-accent-hover"
        >
          오늘
        </button>
      </div>
    </div>
  ) : null

  if (variant === 'input') {
    return (
      <div ref={ref} className={`relative ${className}`}>
        <div
          className={`flex items-center rounded-lg border border-border bg-bg-primary/50 transition-colors focus-within:border-accent ${
            open ? 'border-accent' : ''
          }`}
        >
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted"
            aria-label="날짜 입력"
          />
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex h-[38px] w-9 shrink-0 items-center justify-center text-text-muted transition-colors hover:text-text-primary"
            aria-label="달력 열기"
            aria-expanded={open}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
        {calendarPanel}
      </div>
    )
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-bg-primary/50 px-3 py-2.5 text-left text-sm outline-none transition-colors hover:border-accent/50 focus:border-accent ${
          displayValue ? 'text-text-primary' : 'text-text-muted'
        }`}
        aria-label="날짜 선택"
        aria-expanded={open}
      >
        <span className="truncate">{displayValue || placeholder}</span>
        <Calendar className="h-4 w-4 shrink-0 text-text-muted" />
      </button>
      {calendarPanel}
    </div>
  )
}
