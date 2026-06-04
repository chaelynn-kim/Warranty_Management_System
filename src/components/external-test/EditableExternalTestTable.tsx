import { useEffect, useRef, useState } from 'react'
import { ChevronDown, GripVertical, X } from 'lucide-react'
import type { ExternalTestRecord } from '../../types'
import {
  EXTERNAL_TEST_INSTITUTION_OTHER,
  EXTERNAL_TEST_INSTITUTIONS,
  EXTERNAL_TEST_STATUSES,
  institutionCustomValue,
  isPresetInstitution,
} from '../../constants/externalTestOptions'
import { buildSelectOptions, normalizeOptionValue } from '../../constants/warrantyOptions'
import { normalizeDate, toDateInputValue } from '../../utils/helpers'
import { insertAnchorRowClass, isTableRowInteractiveTarget } from '../../utils/tableRowInteraction'
import {
  ExternalTestTableFilterRow,
  hasActiveExternalTestFilters,
  type ExternalTestTableFilters,
} from './ExternalTestTableFilterRow'

const cellInput =
  'w-full min-w-0 rounded border border-transparent bg-bg-primary/50 px-1.5 py-1 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none sm:text-sm'

const cellInputCenter = `${cellInput} text-center`

const optionSelectClass = `${cellInputCenter} w-full min-w-[88px] cursor-pointer appearance-none truncate pr-7`

function OptionChevron({ overlay = false }: { overlay?: boolean }) {
  return (
    <ChevronDown
      className={`pointer-events-none h-3.5 w-3.5 shrink-0 text-text-muted ${
        overlay ? 'absolute top-1/2 right-1.5 -translate-y-1/2' : ''
      }`}
    />
  )
}

function StatusSelectCell({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const normalized = normalizeOptionValue(value)
  const options = buildSelectOptions(EXTERNAL_TEST_STATUSES, normalized)

  return (
    <div className="relative min-w-[88px]">
      <select
        value={normalized}
        onChange={(e) => onChange(e.target.value)}
        className={optionSelectClass}
        aria-label="진행여부"
      >
        <option value="">선택</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <OptionChevron overlay />
      <StatusBadge status={normalized} />
    </div>
  )
}

function InstitutionSelectCell({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const customValue = institutionCustomValue(value)
  const isPreset = isPresetInstitution(value)
  const derivedOther = !isPreset && Boolean(normalizeOptionValue(value))
  const [otherMode, setOtherMode] = useState(derivedOther)

  useEffect(() => {
    if (isPreset) {
      setOtherMode(false)
      return
    }
    if (customValue) {
      setOtherMode(true)
    }
  }, [isPreset, customValue])

  const selectDisplay =
    otherMode || derivedOther ? EXTERNAL_TEST_INSTITUTION_OTHER : isPreset ? value : ''

  return (
    <div className="flex min-w-[120px] flex-col gap-1">
      <div className="relative">
        <select
          value={selectDisplay}
          onChange={(e) => {
            const next = e.target.value
            if (next === EXTERNAL_TEST_INSTITUTION_OTHER) {
              setOtherMode(true)
              if (!customValue) onChange('')
            } else if (next === '') {
              setOtherMode(false)
              onChange('')
            } else {
              setOtherMode(false)
              onChange(next)
            }
          }}
          className={optionSelectClass}
          aria-label="의뢰기관"
        >
          <option value="">선택</option>
          {EXTERNAL_TEST_INSTITUTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          <option value={EXTERNAL_TEST_INSTITUTION_OTHER}>{EXTERNAL_TEST_INSTITUTION_OTHER}</option>
        </select>
        <OptionChevron overlay />
      </div>
      {otherMode && (
        <input
          type="text"
          value={customValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder="기관명 직접 입력"
          className={cellInputCenter}
          aria-label="의뢰기관 직접 입력"
          autoFocus={!customValue}
        />
      )}
    </div>
  )
}

const highlightRowClass =
  'bg-accent/25 ring-2 ring-inset ring-accent shadow-[inset_0_0_0_1px_rgba(59,130,246,0.4)] hover:bg-accent/30'

const colPurpose = 'min-w-[220px] w-[28%]'
const colItemName = 'min-w-[300px] w-[32%]'
const colNotes = 'min-w-[240px] w-[22%]'
const colDate = 'min-w-[108px] w-[108px] whitespace-nowrap'

const dateInputClass = `${cellInputCenter} min-w-[104px] whitespace-nowrap`

const readOnlyCell =
  'px-2 py-2 text-text-primary whitespace-pre-wrap break-words leading-snug'

interface EditableExternalTestTableProps {
  editing: boolean
  records: ExternalTestRecord[]
  highlightedRowId?: string | null
  filters: ExternalTestTableFilters
  onFiltersChange: (filters: ExternalTestTableFilters) => void
  onUpdate: (id: string, field: keyof ExternalTestRecord, value: string) => void
  onDelete: (id: string) => void
  onReorder?: (fromId: string, toId: string) => void
  insertAnchorId?: string | null
  onSelectInsertAnchor?: (id: string) => void
}

function StatusBadge({ status }: { status: string }) {
  if (!status) return null

  const styles: Record<string, string> = {
    종결: 'bg-emerald-950/60 text-emerald-300 border-emerald-900/50',
    진행중: 'bg-blue-950/60 text-blue-300 border-blue-900/50',
    진행대기: 'bg-amber-950/60 text-amber-300 border-amber-900/50',
    취소: 'bg-red-950/60 text-red-300 border-red-900/50',
  }

  return (
    <span
      className={`mt-1 inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${styles[status] ?? 'bg-bg-tertiary text-text-secondary border-border'}`}
    >
      {status}
    </span>
  )
}

function CellInput({
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
  const className = `${cellInput} ${align === 'center' ? 'text-center' : 'text-left'} ${multiline ? 'min-h-[52px] resize-y' : ''}`

  if (multiline) {
    return <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} className={className} />
  }

  return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={className} />
}

function ReadOnlyCell({
  value,
  align = 'left',
  nowrap = false,
}: {
  value: string
  align?: 'left' | 'center'
  nowrap?: boolean
}) {
  const display = value.trim() || '-'
  const wrapClass = nowrap ? 'whitespace-nowrap' : 'whitespace-pre-wrap break-words'
  return (
    <div
      className={`${readOnlyCell} ${wrapClass} ${align === 'center' ? 'text-center' : 'text-left'}`}
    >
      {display}
    </div>
  )
}

function formatDisplayDate(value: string): string {
  if (!value.trim()) return '-'
  return normalizeDate(value)
}

export function EditableExternalTestTable({
  editing,
  records,
  highlightedRowId = null,
  filters,
  onFiltersChange,
  onUpdate,
  onDelete,
  onReorder,
  insertAnchorId = null,
  onSelectInsertAnchor,
}: EditableExternalTestTableProps) {
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map())
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const canReorder = editing && Boolean(onReorder) && !hasActiveExternalTestFilters(filters)
  const colSpan = editing ? 16 : 15

  useEffect(() => {
    if (!highlightedRowId) return

    const scrollToHighlightedRow = () => {
      const row = rowRefs.current.get(highlightedRowId)
      const container = scrollContainerRef.current
      if (!row || !container) return false

      const targetTop = row.offsetTop - container.clientHeight / 2 + row.offsetHeight / 2
      container.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth',
      })
      return true
    }

    const timer = window.setTimeout(() => {
      if (!scrollToHighlightedRow()) {
        window.setTimeout(scrollToHighlightedRow, 120)
      }
    }, 80)

    return () => clearTimeout(timer)
  }, [highlightedRowId, records.length])

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

      <div
        ref={scrollContainerRef}
        className="max-h-[calc(100dvh-420px)] min-h-[240px] overflow-auto rounded-lg border border-border"
      >
        <table className="w-full min-w-[1560px] border-separate border-spacing-0 text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-tertiary">
              {editing && <th className="w-11 min-w-11 px-1 py-3" />}
              <th className="px-3 py-3 font-medium whitespace-nowrap text-text-secondary">NO</th>
              <th className={`px-3 py-3 font-medium text-text-secondary ${colPurpose}`}>용도</th>
              <th className="px-3 py-3 font-medium whitespace-nowrap text-text-secondary">규격명</th>
              <th className="px-3 py-3 font-medium whitespace-nowrap text-text-secondary">색상명</th>
              <th className="px-3 py-3 font-medium whitespace-nowrap text-text-secondary">작업장</th>
              <th className={`px-3 py-3 font-medium text-text-secondary ${colDate}`}>생산일자</th>
              <th className="px-3 py-3 font-medium whitespace-nowrap text-text-secondary">품목코드</th>
              <th className={`px-3 py-3 font-medium text-text-secondary ${colItemName}`}>품목명</th>
              <th className="px-3 py-3 font-medium whitespace-nowrap text-text-secondary">수지</th>
              <th className={`px-3 py-3 font-medium text-text-secondary ${colDate}`}>의뢰날짜</th>
              <th className={`px-3 py-3 font-medium text-text-secondary ${colDate}`}>접수일자</th>
              <th className={`px-3 py-3 font-medium text-text-secondary ${colDate}`}>완료일자</th>
              <th className="px-3 py-3 font-medium whitespace-nowrap text-text-secondary">진행여부</th>
              <th className="px-3 py-3 font-medium whitespace-nowrap text-text-secondary">의뢰기관</th>
              <th className={`px-3 py-3 font-medium text-text-secondary ${colNotes}`}>비고</th>
            </tr>
          </thead>
          <tbody>
            <ExternalTestTableFilterRow
              filters={filters}
              onChange={onFiltersChange}
              showActionColumn={editing}
            />
            {records.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-12 text-center text-text-muted">
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
                    className={`group border-b border-border/60 transition-all duration-300 hover:bg-bg-tertiary/40 ${
                      editing && onSelectInsertAnchor ? 'cursor-pointer' : ''
                    } ${isHighlighted ? highlightRowClass : ''} ${
                      isInsertAnchor ? insertAnchorRowClass : ''
                    } ${isDragging ? 'opacity-40' : ''} ${
                      isDragOver ? 'bg-accent/15 ring-1 ring-inset ring-accent/50' : ''
                    }`}
                  >
                    {editing && (
                      <td className="border-r border-border/40 px-1 py-1 align-middle">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onDelete(record.id)}
                            aria-label="행 삭제"
                            title="행 삭제"
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-text-muted opacity-70 transition-colors hover:bg-red-500/15 hover:text-red-400 group-hover:opacity-100"
                          >
                            <X className="h-4 w-4" />
                          </button>
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
                              className={`inline-flex h-7 w-7 items-center justify-center rounded text-text-muted transition-colors ${
                                canReorder
                                  ? 'cursor-grab opacity-70 hover:bg-bg-tertiary hover:text-text-primary active:cursor-grabbing group-hover:opacity-100'
                                  : 'cursor-not-allowed opacity-30'
                              }`}
                              aria-label="행 순서 변경"
                            >
                              <GripVertical className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-1 py-1 align-top">
                      {editing ? (
                        <CellInput
                          value={record.no}
                          onChange={(v) => onUpdate(record.id, 'no', v)}
                          align="center"
                        />
                      ) : (
                        <ReadOnlyCell value={record.no} align="center" />
                      )}
                    </td>
                    <td className={`px-1 py-1 align-top ${colPurpose}`}>
                      {editing ? (
                        <CellInput
                          value={record.purpose}
                          onChange={(v) => onUpdate(record.id, 'purpose', v)}
                          multiline
                        />
                      ) : (
                        <ReadOnlyCell value={record.purpose} />
                      )}
                    </td>
                    <td className="px-1 py-1 align-top">
                      {editing ? (
                        <CellInput
                          value={record.sampleName}
                          onChange={(v) => onUpdate(record.id, 'sampleName', v)}
                        />
                      ) : (
                        <ReadOnlyCell value={record.sampleName} />
                      )}
                    </td>
                    <td className="px-1 py-1 align-top">
                      {editing ? (
                        <CellInput
                          value={record.colorName}
                          onChange={(v) => onUpdate(record.id, 'colorName', v)}
                        />
                      ) : (
                        <ReadOnlyCell value={record.colorName} />
                      )}
                    </td>
                    <td className="px-1 py-1 align-top">
                      {editing ? (
                        <CellInput
                          value={record.workshop}
                          onChange={(v) => onUpdate(record.id, 'workshop', v)}
                          align="center"
                        />
                      ) : (
                        <ReadOnlyCell value={record.workshop} align="center" />
                      )}
                    </td>
                    <td className={`px-1 py-1 align-top ${colDate}`}>
                      {editing ? (
                        <input
                          type="date"
                          value={toDateInputValue(record.productionDate)}
                          onChange={(e) => onUpdate(record.id, 'productionDate', e.target.value)}
                          className={dateInputClass}
                        />
                      ) : (
                        <ReadOnlyCell
                          value={formatDisplayDate(record.productionDate)}
                          align="center"
                          nowrap
                        />
                      )}
                    </td>
                    <td className="px-1 py-1 align-top">
                      {editing ? (
                        <CellInput
                          value={record.itemCode}
                          onChange={(v) => onUpdate(record.id, 'itemCode', v)}
                        />
                      ) : (
                        <ReadOnlyCell value={record.itemCode} />
                      )}
                    </td>
                    <td className={`px-1 py-1 align-top ${colItemName}`}>
                      {editing ? (
                        <CellInput
                          value={record.itemName}
                          onChange={(v) => onUpdate(record.id, 'itemName', v)}
                          multiline
                        />
                      ) : (
                        <ReadOnlyCell value={record.itemName} />
                      )}
                    </td>
                    <td className="px-1 py-1 align-top">
                      {editing ? (
                        <CellInput
                          value={record.resin}
                          onChange={(v) => onUpdate(record.id, 'resin', v)}
                          align="center"
                        />
                      ) : (
                        <ReadOnlyCell value={record.resin} align="center" />
                      )}
                    </td>
                    <td className={`px-1 py-1 align-top ${colDate}`}>
                      {editing ? (
                        <input
                          type="date"
                          value={toDateInputValue(record.requestDate)}
                          onChange={(e) => onUpdate(record.id, 'requestDate', e.target.value)}
                          className={dateInputClass}
                        />
                      ) : (
                        <ReadOnlyCell
                          value={formatDisplayDate(record.requestDate)}
                          align="center"
                          nowrap
                        />
                      )}
                    </td>
                    <td className={`px-1 py-1 align-top ${colDate}`}>
                      {editing ? (
                        <input
                          type="date"
                          value={toDateInputValue(record.receiptDate)}
                          onChange={(e) => onUpdate(record.id, 'receiptDate', e.target.value)}
                          className={dateInputClass}
                        />
                      ) : (
                        <ReadOnlyCell
                          value={formatDisplayDate(record.receiptDate)}
                          align="center"
                          nowrap
                        />
                      )}
                    </td>
                    <td className={`px-1 py-1 align-top ${colDate}`}>
                      {editing ? (
                        <input
                          type="date"
                          value={toDateInputValue(record.completionDate)}
                          onChange={(e) => onUpdate(record.id, 'completionDate', e.target.value)}
                          className={dateInputClass}
                        />
                      ) : (
                        <ReadOnlyCell
                          value={formatDisplayDate(record.completionDate)}
                          align="center"
                          nowrap
                        />
                      )}
                    </td>
                    <td className="px-1 py-1 align-top">
                      {editing ? (
                        <StatusSelectCell
                          value={record.status}
                          onChange={(v) => onUpdate(record.id, 'status', v)}
                        />
                      ) : (
                        <div className="text-center">
                          <StatusBadge status={record.status} />
                        </div>
                      )}
                    </td>
                    <td className="px-1 py-1 align-top">
                      {editing ? (
                        <InstitutionSelectCell
                          value={record.institution}
                          onChange={(v) => onUpdate(record.id, 'institution', v)}
                        />
                      ) : (
                        <ReadOnlyCell value={record.institution} align="center" />
                      )}
                    </td>
                    <td className={`px-1 py-1 align-top ${colNotes}`}>
                      {editing ? (
                        <CellInput
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
