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
} from '../../utils/helpers'
import {
  WarrantyTableFilterRow,
  hasActiveWarrantyFilters,
  type WarrantyTableFilters,
} from './WarrantyTableFilterRow'
import { insertAnchorRowClass, isTableRowInteractiveTarget } from '../../utils/tableRowInteraction'
import { FileAttachmentCell } from './FileAttachmentCell'

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
const thSticky =
  'sticky top-0 z-20 bg-bg-tertiary shadow-[inset_0_-1px_0_0_var(--color-border)]'
const thCenter = `${thBase} text-center`

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
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const canReorder = editing && Boolean(onReorder) && !hasActiveWarrantyFilters(filters)

  useEffect(() => {
    if (!highlightedRowId) return
    const rowId = highlightedRowId
    const timer = window.setTimeout(() => {
      rowRefs.current.get(rowId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
    return () => clearTimeout(timer)
  }, [highlightedRowId, records.length])

  return (
    <div>
      {editing && (
        <p className="mb-2 text-xs text-text-muted">
          행을 클릭해 선택한 뒤{' '}
          <span className="font-medium text-amber-400/90">+</span>를 누르면 해당 행{' '}
          <span className="text-amber-400/90">아래</span>에 새 행이 추가됩니다. 선택하지 않으면{' '}
          <span className="text-amber-400/90">맨 아래</span>에 추가됩니다.
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
      <table className="w-full min-w-[1200px] border-separate border-spacing-0">
        <thead>
          <tr className="border-b border-border bg-bg-tertiary">
            <th className={`${thCenter} ${thSticky} min-w-[220px] border-r border-border/60`}>요청일자</th>
            <th className={`${thCenter} ${thSticky} min-w-[80px] border-r border-border/60`}>요청자</th>
            <th className={`${thCenter} ${thSticky} min-w-[100px] border-r border-border/60`}>국가</th>
            <th className={`${thCenter} ${thSticky} min-w-[100px] border-r border-border/60`}>세부국가명</th>
            <th className={`${thCenter} ${thSticky} min-w-[90px] border-r border-border/60`}>수요가명</th>
            <th className={`${thCenter} ${thSticky} min-w-[100px]`}>색상명</th>
            <th className={`${thCenter} ${thSticky} ${optionCellWidth}`}>도료사</th>
            <th className={`${thCenter} ${thSticky} ${optionCellWidth} border-r border-border/60`}>수지</th>
            <th className={`${thCenter} ${thSticky} min-w-[200px] border-r border-border/60`}>추가 요청 사항</th>
            <th className={`${thCenter} ${thSticky} min-w-[140px] border-r border-border/60`}>파일첨부</th>
            <th className={`${thCenter} ${thSticky} min-w-[220px] border-r border-border/60`}>발행일자</th>
            <th className={`${thCenter} ${thSticky} min-w-[100px]`}>검토결과</th>
          </tr>
        </thead>
        <tbody>
          <WarrantyTableFilterRow filters={filters} onChange={onFiltersChange} />
          {records.length === 0 ? (
            <tr>
              <td colSpan={12} className="px-4 py-12 text-center text-sm text-text-muted">
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
                          value={toDateInputValue(record.requestDate)}
                          onChange={(e) => onUpdate(record.id, 'requestDate', e.target.value)}
                          className={`${dateInputClass} min-w-0 flex-1`}
                        />
                      </div>
                    ) : (
                      <ReadOnlyCell value={formatDisplayDate(record.requestDate)} align="center" />
                    )}
                  </td>
                  <td className="px-1 py-1 align-top">
                    {editing ? (
                      <EditableCell
                        value={record.requester}
                        onChange={(v) => onUpdate(record.id, 'requester', v)}
                      />
                    ) : (
                      <ReadOnlyCell value={record.requester} />
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
                      <EditableCell
                        value={record.detailRegion}
                        onChange={(v) => onUpdate(record.id, 'detailRegion', v)}
                      />
                    ) : (
                      <ReadOnlyCell value={record.detailRegion} />
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
                      <EditableCell
                        value={record.colorName}
                        onChange={(v) => onUpdate(record.id, 'colorName', v)}
                        align="center"
                      />
                    ) : (
                      <ReadOnlyCell value={record.colorName} align="center" />
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
                  <td className={`border-r border-border/40 px-1 py-1 align-top ${optionCellWidth}`}>
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
                  <td className="min-w-[200px] px-1 py-1 align-top">
                    {editing ? (
                      <EditableCell
                        value={record.additionalRequest}
                        onChange={(v) => onUpdate(record.id, 'additionalRequest', v)}
                        multiline
                      />
                    ) : (
                      <ReadOnlyCell value={record.additionalRequest} />
                    )}
                  </td>
                  <td className="min-w-[140px] px-1 py-1 align-top">
                    <FileAttachmentCell
                      editing={editing}
                      value={record.fileAttachment}
                      onChange={(v) => onUpdate(record.id, 'fileAttachment', v)}
                    />
                  </td>
                  <td className="border-r border-border/40 px-1 py-1 align-top">
                    {editing ? (
                      <input
                        type="date"
                        value={toDateInputValue(record.issueDate)}
                        onChange={(e) => onUpdate(record.id, 'issueDate', e.target.value)}
                        className={dateInputClass}
                      />
                    ) : (
                      <ReadOnlyCell value={formatDisplayDate(record.issueDate)} align="center" />
                    )}
                  </td>
                  <td className="px-1 py-1 align-top">
                    {editing ? (
                      <EditableCell
                        value={record.reviewResult}
                        onChange={(v) => onUpdate(record.id, 'reviewResult', v)}
                      />
                    ) : (
                      <ReadOnlyCell value={record.reviewResult} />
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
