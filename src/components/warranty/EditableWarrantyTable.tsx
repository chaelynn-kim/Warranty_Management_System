import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, GripVertical, X } from 'lucide-react'
import type { WarrantyRecord } from '../../types'
import {
  PAINT_COMPANIES,
  RESIN_TYPES,
  buildMultiSelectOptions,
  buildSelectOptions,
  joinMultiValue,
  normalizeOptionValue,
  parseMultiValue,
} from '../../constants/warrantyOptions'
import {
  toDateInputValue,
  formatDisplayDate,
  formatPeelDisplay,
  formatPeelValue,
  peelEditValue,
  formatFadeDisplay,
  formatFadeForStorage,
} from '../../utils/helpers'
import {
  WarrantyTableFilterRow,
  hasActiveWarrantyFilters,
  type WarrantyTableFilters,
} from './WarrantyTableFilterRow'
import { insertAnchorRowClass, isTableRowInteractiveTarget } from '../../utils/tableRowInteraction'

interface EditableWarrantyTableProps {
  editing: boolean
  records: WarrantyRecord[]
  highlightedRowId?: string | null
  insertAnchorId?: string | null
  onSelectInsertAnchor?: (id: string) => void
  onUpdate: (id: string, field: keyof WarrantyRecord, value: string) => void
  onDelete: (id: string) => void
  onReorder?: (fromId: string, toId: string) => void
  filters: WarrantyTableFilters
  onFiltersChange: (filters: WarrantyTableFilters) => void
}

const readOnlyCell =
  'px-2 py-2 text-xs text-text-primary whitespace-pre-wrap break-words leading-snug sm:text-sm'

const thBase =
  'px-2 py-2.5 text-xs font-semibold whitespace-nowrap text-text-secondary sm:px-3 sm:py-3 sm:text-sm'
const thStickyRow1 =
  'sticky top-0 z-20 bg-bg-tertiary shadow-[inset_0_-1px_0_0_var(--color-border)]'
const thStickyRowSpan = 'z-30'
const thStickyRow2Base =
  'sticky z-20 bg-bg-tertiary/95 shadow-[inset_0_-1px_0_0_var(--color-border)] backdrop-blur-sm'
const thCenter = `${thBase} text-center`
const thLeft = `${thBase} text-left`

const cellInput =
  'w-full min-w-0 rounded border border-transparent bg-bg-primary/50 px-1.5 py-1 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none sm:text-sm'

const cellInputCenter = `${cellInput} text-center`

const dateInputClass = `${cellInputCenter} min-w-[132px] cursor-pointer`

const optionCellWidth = 'w-[112px] min-w-[112px] max-w-[112px]'
const optionSelectClass = `${cellInputCenter} w-full cursor-pointer appearance-none truncate pr-7`
const optionButtonClass = `${cellInputCenter} flex w-full items-center justify-between gap-1`

const selectClass = optionSelectClass

function OptionChevron({ open = false, overlay = false }: { open?: boolean; overlay?: boolean }) {
  return (
    <ChevronDown
      className={`pointer-events-none h-3.5 w-3.5 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''} ${
        overlay ? 'absolute top-1/2 right-1.5 -translate-y-1/2' : ''
      }`}
    />
  )
}

function OptionCheckbox({ checked }: { checked: boolean }) {
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

function MultiSelectCell({
  value,
  options,
  onChange,
}: {
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = parseMultiValue(value)
  const selectOptions = buildMultiSelectOptions(options, value)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggleOption = (option: string) => {
    const next = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option]
    onChange(joinMultiValue(next))
  }

  const displayLabel = selected.length === 0 ? '-' : selected.join(', ')

  return (
    <div ref={ref} className={`relative ${optionCellWidth}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={optionButtonClass}
      >
        <span className="truncate">{displayLabel}</span>
        <OptionChevron open={open} />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-0.5 max-h-48 min-w-[140px] overflow-y-auto rounded-lg border border-border bg-bg-secondary py-1 shadow-xl">
          <button
            type="button"
            onClick={() => onChange('')}
            className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs text-text-primary transition-colors hover:bg-bg-tertiary"
          >
            <OptionCheckbox checked={selected.length === 0} />
            선택 없음
          </button>
          {selectOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => toggleOption(option)}
              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs text-text-primary transition-colors hover:bg-bg-tertiary"
            >
              <OptionCheckbox checked={selected.includes(option)} />
              <span className="truncate">{option}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SelectCell({
  value,
  options,
  onChange,
}: {
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  const normalized = normalizeOptionValue(value)
  const selectOptions = buildSelectOptions(options, normalized)

  return (
    <div className={`relative ${optionCellWidth}`}>
      <select
        value={normalized}
        onChange={(e) => onChange(e.target.value)}
        className={selectClass}
      >
        <option value="">-</option>
        {selectOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <OptionChevron overlay />
    </div>
  )
}

function EditableCell({
  value,
  onChange,
  align = 'left',
  multiline = false,
}: {
  value: string
  onChange: (value: string) => void
  align?: 'left' | 'center'
  multiline?: boolean
}) {
  const className = align === 'center' ? cellInputCenter : cellInput

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className={`${className} min-h-[52px] resize-y`}
      />
    )
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    />
  )
}

const fadeCellClass = `${cellInputCenter} block min-h-[52px] w-full resize-none leading-snug`

function FadeCell({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <textarea
      rows={2}
      value={formatFadeDisplay(value)}
      onChange={(e) => onChange(formatFadeForStorage(e.target.value))}
      className={fadeCellClass}
    />
  )
}

function PeelCell({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const isEditing = draft !== null

  return (
    <input
      type="text"
      value={isEditing ? draft : formatPeelDisplay(value)}
      onFocus={() => setDraft(peelEditValue(value))}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        onChange(formatPeelValue(draft ?? ''))
        setDraft(null)
      }}
      className={cellInputCenter}
    />
  )
}

function ReadOnlyCell({
  value,
  align = 'left',
}: {
  value: string
  align?: 'left' | 'center'
}) {
  const display = value.trim() || '-'
  return (
    <div className={`${readOnlyCell} ${align === 'center' ? 'text-center' : 'text-left'}`}>{display}</div>
  )
}

function ReadOnlyPaintCompanies({ value }: { value: string }) {
  const selected = parseMultiValue(value)
  const display = selected.length === 0 ? '-' : selected.join(', ')
  return <ReadOnlyCell value={display} align="center" />
}

export function EditableWarrantyTable({
  editing,
  records,
  highlightedRowId,
  insertAnchorId = null,
  onSelectInsertAnchor,
  onUpdate,
  onDelete,
  onReorder,
  filters,
  onFiltersChange,
}: EditableWarrantyTableProps) {
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map())
  const headerRowRef = useRef<HTMLTableRowElement>(null)
  const [headerRowHeight, setHeaderRowHeight] = useState(0)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const canReorder = editing && Boolean(onReorder) && !hasActiveWarrantyFilters(filters)

  useEffect(() => {
    const row = headerRowRef.current
    if (!row) return

    const syncHeight = () => setHeaderRowHeight(row.getBoundingClientRect().height)
    syncHeight()

    const observer = new ResizeObserver(syncHeight)
    observer.observe(row)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!highlightedRowId) return
    const rowId = highlightedRowId
    const timer = window.setTimeout(() => {
      rowRefs.current.get(rowId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
    return () => clearTimeout(timer)
  }, [highlightedRowId, records.length])

  const headerRow2Top = headerRowHeight > 0 ? headerRowHeight : 43

  return (
    <div>
      {editing && (
        <p className="mb-2 text-xs text-text-muted">
          행을 클릭해 선택한 뒤{' '}
          <span className="font-medium text-amber-400/90">+</span>를 누르면 해당 행{' '}
          <span className="text-amber-400/90">위</span>에 새 행이 추가됩니다.
          {onReorder && (
            <>
              {' '}
              {canReorder ? (
                '⋮⋮ 드래그로 순서를 변경할 수 있습니다.'
              ) : (
                <span className="text-amber-400/90">필터를 모두 비운 후 순서 변경이 가능합니다.</span>
              )}
            </>
          )}
        </p>
      )}
    <div className="max-h-[calc(100dvh-380px)] min-h-[240px] overflow-auto rounded-lg border border-border">
      <table className="w-full min-w-[1500px] border-separate border-spacing-0">
        <thead>
          <tr ref={headerRowRef} className="border-b border-border bg-bg-tertiary">
            <th
              rowSpan={2}
              className={`${thCenter} ${thStickyRow1} ${thStickyRowSpan} min-w-[168px] border-r border-border/60 align-middle`}
            >
              발행일자
            </th>
            <th
              rowSpan={2}
              className={`${thLeft} ${thStickyRow1} ${thStickyRowSpan} min-w-[100px] border-r border-border/60 align-middle`}
            >
              지역
            </th>
            <th
              rowSpan={2}
              className={`${thLeft} ${thStickyRow1} ${thStickyRowSpan} min-w-[90px] border-r border-border/60 align-middle`}
            >
              수요가
            </th>
            <th colSpan={7} className={`${thCenter} ${thStickyRow1} border-r border-border/60`}>
              색상 정보
            </th>
            <th colSpan={5} className={`${thCenter} ${thStickyRow1} border-r border-border/60`}>
              당사 보증
            </th>
            <th colSpan={5} className={`${thCenter} ${thStickyRow1} border-r border-border/60`}>
              도료사 보증
            </th>
            <th
              rowSpan={2}
              className={`${thCenter} ${thStickyRow1} ${thStickyRowSpan} min-w-[320px] align-middle`}
            >
              비고
            </th>
          </tr>
          <tr className="border-b border-border bg-bg-tertiary/80">
            <th className={`${thLeft} ${thStickyRow2Base} min-w-[100px]`} style={{ top: headerRow2Top }}>
              색상명
            </th>
            <th className={`${thCenter} ${thStickyRow2Base} ${optionCellWidth}`} style={{ top: headerRow2Top }}>
              도료사
            </th>
            <th className={`${thCenter} ${thStickyRow2Base} ${optionCellWidth}`} style={{ top: headerRow2Top }}>
              수지
            </th>
            <th className={`${thCenter} ${thStickyRow2Base} min-w-[80px]`} style={{ top: headerRow2Top }}>
              총 도막두께
            </th>
            <th className={`${thCenter} ${thStickyRow2Base} min-w-[64px]`} style={{ top: headerRow2Top }}>
              프라이머
            </th>
            <th className={`${thCenter} ${thStickyRow2Base} w-[48px]`} style={{ top: headerRow2Top }}>
              COAT
            </th>
            <th
              className={`${thCenter} ${thStickyRow2Base} w-[48px] border-r border-border/60`}
              style={{ top: headerRow2Top }}
            >
              BAKE
            </th>
            <th className={`${thCenter} ${thStickyRow2Base} min-w-[48px]`} style={{ top: headerRow2Top }}>
              박리
            </th>
            <th className={`${thCenter} ${thStickyRow2Base} min-w-[88px]`} style={{ top: headerRow2Top }}>
              변색(지붕)
            </th>
            <th className={`${thCenter} ${thStickyRow2Base} min-w-[88px]`} style={{ top: headerRow2Top }}>
              변색(벽체)
            </th>
            <th className={`${thCenter} ${thStickyRow2Base} min-w-[88px]`} style={{ top: headerRow2Top }}>
              백화(지붕)
            </th>
            <th
              className={`${thCenter} ${thStickyRow2Base} min-w-[88px] border-r border-border/60`}
              style={{ top: headerRow2Top }}
            >
              백화(벽체)
            </th>
            <th className={`${thCenter} ${thStickyRow2Base} min-w-[48px]`} style={{ top: headerRow2Top }}>
              박리
            </th>
            <th className={`${thCenter} ${thStickyRow2Base} min-w-[88px]`} style={{ top: headerRow2Top }}>
              변색(지붕)
            </th>
            <th className={`${thCenter} ${thStickyRow2Base} min-w-[88px]`} style={{ top: headerRow2Top }}>
              변색(벽체)
            </th>
            <th className={`${thCenter} ${thStickyRow2Base} min-w-[88px]`} style={{ top: headerRow2Top }}>
              백화(지붕)
            </th>
            <th
              className={`${thCenter} ${thStickyRow2Base} min-w-[88px] border-r border-border/60`}
              style={{ top: headerRow2Top }}
            >
              백화(벽체)
            </th>
          </tr>
        </thead>
        <tbody>
          <WarrantyTableFilterRow filters={filters} onChange={onFiltersChange} />
          {records.length === 0 ? (
            <tr>
              <td colSpan={21} className="px-4 py-12 text-center text-sm text-text-muted">
                조회 결과가 없습니다.
              </td>
            </tr>
          ) : (
            records.map((record) => {
              const isHighlighted = highlightedRowId === record.id
              const isInsertAnchor = editing && insertAnchorId === record.id
              const isDragging = draggingId === record.id
              const isDragOver = dragOverId === record.id && draggingId !== record.id
              return (
                <tr
                  key={record.id}
                  ref={(el) => {
                    if (el) rowRefs.current.set(record.id, el)
                    else rowRefs.current.delete(record.id)
                  }}
                  onClick={(e) => {
                    if (!editing || !onSelectInsertAnchor || isTableRowInteractiveTarget(e.target)) {
                      return
                    }
                    onSelectInsertAnchor(record.id)
                  }}
                  onDragOver={(e) => {
                    if (!canReorder || draggingId === null) return
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    setDragOverId(record.id)
                  }}
                  onDragLeave={() => {
                    setDragOverId((prev) => (prev === record.id ? null : prev))
                  }}
                  onDrop={(e) => {
                    if (!canReorder || draggingId === null) return
                    e.preventDefault()
                    if (draggingId !== record.id) {
                      onReorder?.(draggingId, record.id)
                    }
                    setDraggingId(null)
                    setDragOverId(null)
                  }}
                  className={`group border-b border-border/50 transition-all duration-300 even:bg-bg-tertiary/15 hover:bg-accent/10 hover:ring-1 hover:ring-inset hover:ring-accent/35 ${
                    editing && onSelectInsertAnchor ? 'cursor-pointer' : ''
                  } ${
                    isHighlighted
                      ? 'bg-accent/25 ring-2 ring-inset ring-accent shadow-[inset_0_0_0_1px_rgba(59,130,246,0.4)] hover:bg-accent/30'
                      : ''
                  } ${isInsertAnchor ? insertAnchorRowClass : ''} ${isDragging ? 'opacity-40' : ''} ${
                    isDragOver ? 'bg-accent/15 ring-1 ring-inset ring-accent/50' : ''
                  }`}
                >
                  <td className="border-r border-border/40 px-1 py-1 align-top">
                    {editing ? (
                      <div className="flex items-center gap-1">
                        {onReorder && (
                          <div
                            draggable={canReorder}
                            onDragStart={(e) => {
                              if (!canReorder) {
                                e.preventDefault()
                                return
                              }
                              setDraggingId(record.id)
                              e.dataTransfer.effectAllowed = 'move'
                              e.dataTransfer.setData('text/plain', record.id)
                            }}
                            onDragEnd={() => {
                              setDraggingId(null)
                              setDragOverId(null)
                            }}
                            title={
                              canReorder ? '드래그하여 행 이동' : '필터를 모두 비운 후 순서 변경'
                            }
                            className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-text-muted transition-colors ${
                              canReorder
                                ? 'cursor-grab opacity-70 hover:bg-bg-tertiary hover:text-text-primary active:cursor-grabbing group-hover:opacity-100'
                                : 'cursor-not-allowed opacity-30'
                            }`}
                            aria-label="행 순서 변경"
                          >
                            <GripVertical className="h-4 w-4" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => onDelete(record.id)}
                          aria-label="행 삭제"
                          title="행 삭제"
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-text-muted opacity-70 transition-colors hover:bg-red-500/15 hover:text-red-400 group-hover:opacity-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <input
                          type="date"
                          value={toDateInputValue(record.issueDate)}
                          onChange={(e) => onUpdate(record.id, 'issueDate', e.target.value)}
                          className={`${dateInputClass} min-w-0 flex-1`}
                        />
                      </div>
                    ) : (
                      <ReadOnlyCell value={formatDisplayDate(record.issueDate)} align="center" />
                    )}
                  </td>
                  <td className="px-1 py-1 align-top">
                    {editing ? (
                      <EditableCell value={record.region} onChange={(v) => onUpdate(record.id, 'region', v)} />
                    ) : (
                      <ReadOnlyCell value={record.region} />
                    )}
                  </td>
                  <td className="px-1 py-1 align-top">
                    {editing ? (
                      <EditableCell value={record.customer} onChange={(v) => onUpdate(record.id, 'customer', v)} />
                    ) : (
                      <ReadOnlyCell value={record.customer} />
                    )}
                  </td>
                  <td className="px-1 py-1 align-top">
                    {editing ? (
                      <EditableCell value={record.colorName} onChange={(v) => onUpdate(record.id, 'colorName', v)} />
                    ) : (
                      <ReadOnlyCell value={record.colorName} />
                    )}
                  </td>
                  <td className={`px-1 py-1 align-top ${optionCellWidth}`}>
                    {editing ? (
                      <MultiSelectCell
                        value={record.paintCompany}
                        options={PAINT_COMPANIES}
                        onChange={(v) => onUpdate(record.id, 'paintCompany', v)}
                      />
                    ) : (
                      <ReadOnlyPaintCompanies value={record.paintCompany} />
                    )}
                  </td>
                  <td className={`px-1 py-1 align-top ${optionCellWidth}`}>
                    {editing ? (
                      <SelectCell
                        value={record.resin}
                        options={RESIN_TYPES}
                        onChange={(v) => onUpdate(record.id, 'resin', v)}
                      />
                    ) : (
                      <ReadOnlyCell value={record.resin} align="center" />
                    )}
                  </td>
                  <td className="px-1 py-1 align-top">
                    {editing ? (
                      <EditableCell
                        value={record.totalThickness}
                        onChange={(v) => onUpdate(record.id, 'totalThickness', v)}
                        align="center"
                      />
                    ) : (
                      <ReadOnlyCell value={record.totalThickness} align="center" />
                    )}
                  </td>
                  <td className="px-1 py-1 align-top">
                    {editing ? (
                      <EditableCell
                        value={record.primerThickness}
                        onChange={(v) => onUpdate(record.id, 'primerThickness', v)}
                        align="center"
                      />
                    ) : (
                      <ReadOnlyCell value={record.primerThickness} align="center" />
                    )}
                  </td>
                  <td className="px-1 py-1 align-top">
                    {editing ? (
                      <EditableCell value={record.coat} onChange={(v) => onUpdate(record.id, 'coat', v)} align="center" />
                    ) : (
                      <ReadOnlyCell value={record.coat} align="center" />
                    )}
                  </td>
                  <td className="border-r border-border/40 px-1 py-1 align-top">
                    {editing ? (
                      <EditableCell value={record.bake} onChange={(v) => onUpdate(record.id, 'bake', v)} align="center" />
                    ) : (
                      <ReadOnlyCell value={record.bake} align="center" />
                    )}
                  </td>
                  <td className="px-1 py-1 text-center align-top">
                    {editing ? (
                      <PeelCell
                        value={record.companyPeel}
                        onChange={(v) => onUpdate(record.id, 'companyPeel', v)}
                      />
                    ) : (
                      <ReadOnlyCell value={formatPeelDisplay(record.companyPeel)} align="center" />
                    )}
                  </td>
                  <td className="px-1 py-1 text-center align-top">
                    {editing ? (
                      <FadeCell
                        value={record.companyFadeRoof}
                        onChange={(v) => onUpdate(record.id, 'companyFadeRoof', v)}
                      />
                    ) : (
                      <ReadOnlyCell value={formatFadeDisplay(record.companyFadeRoof)} align="center" />
                    )}
                  </td>
                  <td className="px-1 py-1 text-center align-top">
                    {editing ? (
                      <FadeCell
                        value={record.companyFadeWall}
                        onChange={(v) => onUpdate(record.id, 'companyFadeWall', v)}
                      />
                    ) : (
                      <ReadOnlyCell value={formatFadeDisplay(record.companyFadeWall)} align="center" />
                    )}
                  </td>
                  <td className="px-1 py-1 text-center align-top">
                    {editing ? (
                      <FadeCell
                        value={record.companyChalkRoof}
                        onChange={(v) => onUpdate(record.id, 'companyChalkRoof', v)}
                      />
                    ) : (
                      <ReadOnlyCell value={formatFadeDisplay(record.companyChalkRoof)} align="center" />
                    )}
                  </td>
                  <td className="border-r border-border/40 px-1 py-1 text-center align-top">
                    {editing ? (
                      <FadeCell
                        value={record.companyChalkWall}
                        onChange={(v) => onUpdate(record.id, 'companyChalkWall', v)}
                      />
                    ) : (
                      <ReadOnlyCell value={formatFadeDisplay(record.companyChalkWall)} align="center" />
                    )}
                  </td>
                  <td className="px-1 py-1 text-center align-top">
                    {editing ? (
                      <PeelCell
                        value={record.supplierPeel}
                        onChange={(v) => onUpdate(record.id, 'supplierPeel', v)}
                      />
                    ) : (
                      <ReadOnlyCell value={formatPeelDisplay(record.supplierPeel)} align="center" />
                    )}
                  </td>
                  <td className="px-1 py-1 text-center align-top">
                    {editing ? (
                      <FadeCell
                        value={record.supplierFadeRoof}
                        onChange={(v) => onUpdate(record.id, 'supplierFadeRoof', v)}
                      />
                    ) : (
                      <ReadOnlyCell value={formatFadeDisplay(record.supplierFadeRoof)} align="center" />
                    )}
                  </td>
                  <td className="px-1 py-1 text-center align-top">
                    {editing ? (
                      <FadeCell
                        value={record.supplierFadeWall}
                        onChange={(v) => onUpdate(record.id, 'supplierFadeWall', v)}
                      />
                    ) : (
                      <ReadOnlyCell value={formatFadeDisplay(record.supplierFadeWall)} align="center" />
                    )}
                  </td>
                  <td className="px-1 py-1 text-center align-top">
                    {editing ? (
                      <FadeCell
                        value={record.supplierChalkRoof}
                        onChange={(v) => onUpdate(record.id, 'supplierChalkRoof', v)}
                      />
                    ) : (
                      <ReadOnlyCell value={formatFadeDisplay(record.supplierChalkRoof)} align="center" />
                    )}
                  </td>
                  <td className="border-r border-border/40 px-1 py-1 text-center align-top">
                    {editing ? (
                      <FadeCell
                        value={record.supplierChalkWall}
                        onChange={(v) => onUpdate(record.id, 'supplierChalkWall', v)}
                      />
                    ) : (
                      <ReadOnlyCell value={formatFadeDisplay(record.supplierChalkWall)} align="center" />
                    )}
                  </td>
                  <td className="min-w-[320px] px-1 py-1 align-top">
                    {editing ? (
                      <EditableCell
                        value={record.notes}
                        onChange={(v) => onUpdate(record.id, 'notes', v)}
                        multiline
                      />
                    ) : (
                      <ReadOnlyCell value={record.notes} />
                    )}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
    </div>
  )
}
