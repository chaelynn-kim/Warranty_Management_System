import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown, Filter, GripVertical, X } from 'lucide-react'
import type { ProductWarranty } from '../../types'
import {
  resolveProductLine,
  resolveChalkMode,
  resolveColorFadingMode,
  type SectionDisplayMode,
} from '../../utils/productWarrantyHelpers'
import { insertAnchorRowClass, isTableRowInteractiveTarget } from '../../utils/tableRowInteraction'
import { GuideCell } from './GuideCell'
import {
  periodInputClass,
  periodRowClass,
  periodTdClass,
  periodThClass,
  periodThGroupClass,
  periodThStackedClass,
  periodThStickyRow1,
  periodThStickyRow2,
  periodThStickyRowSpan,
  periodThSubClass,
  periodTableClass,
  periodDataColCount,
  periodRowHoverClass,
  periodRiskBorderClass,
  periodRiskHeaderBorderClass,
} from './periodTheme'

type ProductField = keyof ProductWarranty

export interface ProductGuideTableItem {
  product: ProductWarranty
  index: number
}

const highlightRowClass =
  'bg-accent/30 ring-2 ring-inset ring-accent shadow-[inset_0_0_0_1px_rgba(59,130,246,0.45)] hover:bg-accent/35'

interface ProductGuideTableProps {
  items: ProductGuideTableItem[]
  editing: boolean
  highlightedIndex?: number | null
  highlightSequence?: number
  onUpdate: (index: number, field: ProductField, value: string) => void
  addTick?: number
  insertAnchorIndex?: number | null
  onSelectInsertAnchor?: (index: number) => void
  onDelete?: (index: number) => void
  onReorder?: (fromIndex: number, toIndex: number) => void
  splitByPrintPaint?: boolean
  riskVariant?: 'high' | 'low'
}

function ProductGroupMultiSelectFilter({
  label = '제품군 선택',
  options,
  selectedGroups,
  onChange,
}: {
  label?: string
  options: string[]
  selectedGroups: string[]
  onChange: (groups: string[]) => void
}) {
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

  const isAll = selectedGroups.length === 0

  const buttonLabel = useMemo(() => {
    if (isAll) return label
    if (selectedGroups.length === 1) return selectedGroups[0].replace(/\n/g, ' ')
    return `${selectedGroups[0].replace(/\n/g, ' ')} 외 ${selectedGroups.length - 1}건`
  }, [isAll, label, selectedGroups])

  const toggleGroup = (group: string) => {
    onChange(
      selectedGroups.includes(group)
        ? selectedGroups.filter((g) => g !== group)
        : [...selectedGroups, group]
    )
  }

  return (
    <div ref={ref} className="relative mb-3 max-w-md">
      <Filter className="pointer-events-none absolute top-1/2 left-2.5 z-10 h-4 w-4 -translate-y-1/2 text-text-muted" />
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`${periodInputClass} flex h-9 w-full items-center pr-8 pl-8 text-left ${
          isAll ? 'text-text-muted' : 'font-medium text-text-primary'
        }`}
        aria-label={label}
        aria-expanded={open}
      >
        <span className="truncate">{buttonLabel}</span>
      </button>
      <ChevronDown
        className={`pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-text-muted transition-transform ${
          open ? 'rotate-180' : ''
        }`}
      />

      {open && (
        <div className="absolute top-full z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-bg-secondary py-1 shadow-xl">
          <button
            type="button"
            onClick={() => onChange([])}
            className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-bg-tertiary ${
              isAll ? 'font-semibold text-accent' : 'text-text-primary'
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                isAll ? 'border-accent bg-accent text-white' : 'border-border bg-bg-primary/50'
              }`}
            >
              {isAll && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            전체
          </button>
          {options.map((option) => {
            const checked = selectedGroups.includes(option)
            const display = option.replace(/\n/g, ' ')
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleGroup(option)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-bg-tertiary ${
                  checked ? 'font-medium text-accent' : 'text-text-primary'
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    checked ? 'border-accent bg-accent text-white' : 'border-border bg-bg-primary/50'
                  }`}
                >
                  {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span className="whitespace-pre-line">{display}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SectionModeToggle({
  label,
  mode,
  onChange,
}: {
  label: string
  mode: SectionDisplayMode
  onChange: (mode: SectionDisplayMode) => void
}) {
  const base =
    'rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors sm:px-2 sm:text-[11px]'
  const active = 'bg-accent text-white shadow-sm'
  const inactive = 'text-text-muted hover:text-text-primary'

  return (
    <div className="flex items-center justify-center gap-1.5">
      <span className="shrink-0 text-[10px] font-medium text-text-muted">{label}</span>
      <div
        className="inline-flex rounded-md border border-border bg-bg-primary/50 p-0.5"
        role="group"
        aria-label={`${label} 표시 방식`}
      >
        <button
          type="button"
          onClick={() => onChange('detail')}
          className={`${base} ${mode === 'detail' ? active : inactive}`}
        >
          상세
        </button>
        <button
          type="button"
          onClick={() => onChange('merged')}
          className={`${base} ${mode === 'merged' ? active : inactive}`}
        >
          병합
        </button>
      </div>
    </div>
  )
}

function ProductCategoryBox({
  title,
  children,
  riskVariant,
}: {
  title: string
  children: ReactNode
  riskVariant?: 'high' | 'low'
}) {
  return (
    <div
      className={`overflow-hidden rounded-lg border-2 bg-bg-secondary/50 ${periodRiskBorderClass(riskVariant)}`}
    >
      <div
        className={`border-b bg-bg-tertiary px-4 py-2.5 ${periodRiskHeaderBorderClass(riskVariant)}`}
      >
        <span className="text-xs font-bold tracking-[0.14em] text-text-primary">{title}</span>
      </div>
      {children}
    </div>
  )
}

interface ProductGuideTableGridProps {
  items: ProductGuideTableItem[]
  editing: boolean
  highlightedIndex: number | null
  groupHeader: ReactNode
  insertAnchorIndex: number | null
  onSelectInsertAnchor?: (index: number) => void
  onDelete?: (index: number) => void
  onReorder?: (fromIndex: number, toIndex: number) => void
  onUpdate: (index: number, field: ProductField, value: string) => void
  canReorder: boolean
  filterActive: boolean
  rowRefs: React.MutableRefObject<Map<number, HTMLTableRowElement>>
  draggingIndex: number | null
  setDraggingIndex: (index: number | null) => void
  dragOverIndex: number | null
  setDragOverIndex: (index: number | null | ((prev: number | null) => number | null)) => void
  emptyMessage: string
  bordered?: boolean
  riskVariant?: 'high' | 'low'
}

function ProductGuideTableGrid({
  items,
  editing,
  highlightedIndex,
  groupHeader,
  insertAnchorIndex,
  onSelectInsertAnchor,
  onDelete,
  onReorder,
  onUpdate,
  canReorder,
  filterActive,
  rowRefs,
  draggingIndex,
  setDraggingIndex,
  dragOverIndex,
  setDragOverIndex,
  emptyMessage,
  bordered = true,
  riskVariant,
}: ProductGuideTableGridProps) {
  const headerRowRef = useRef<HTMLTableRowElement>(null)
  const [headerRowHeight, setHeaderRowHeight] = useState(0)

  useEffect(() => {
    const row = headerRowRef.current
    if (!row) return

    const syncHeight = () => setHeaderRowHeight(row.getBoundingClientRect().height)
    syncHeight()

    const observer = new ResizeObserver(syncHeight)
    observer.observe(row)
    return () => observer.disconnect()
  }, [editing])

  const headerRow2Top = headerRowHeight > 0 ? headerRowHeight : 43
  const hasActionColumn = editing && (onDelete || onReorder)

  return (
    <div className={bordered ? 'overflow-x-auto rounded-lg border border-border' : 'overflow-x-auto'}>
      <table className={periodTableClass}>
        <colgroup>
          {hasActionColumn && <col className="w-11" />}
          {Array.from({ length: periodDataColCount }, (_, index) => (
            <col key={index} />
          ))}
        </colgroup>
        <thead>
          <tr ref={headerRowRef}>
            {hasActionColumn && (
              <th
                rowSpan={2}
                className={`${periodThClass} ${periodThStickyRow1} ${periodThStickyRowSpan} w-11 min-w-11 align-middle`}
              />
            )}
            <th
              rowSpan={2}
              className={`${periodThClass} ${periodThStickyRow1} ${periodThStickyRowSpan} align-middle`}
            >
              {groupHeader}
            </th>
            <th rowSpan={2} className={`${periodThStackedClass} ${periodThStickyRow1} ${periodThStickyRowSpan}`}>
              <span className="block break-all">PEEL/FLAKE</span>
              <span className="block">(도막박리)</span>
            </th>
            <th rowSpan={2} className={`${periodThStackedClass} ${periodThStickyRow1} ${periodThStickyRowSpan}`}>
              <span className="block break-all">PERFORATION</span>
              <span className="block">(천공)</span>
            </th>
            <th colSpan={3} className={`${periodThGroupClass} ${periodThStickyRow1}`}>
              COLOR FADING (변색/탈색)
            </th>
            <th colSpan={3} className={`${periodThGroupClass} ${periodThStickyRow1}`}>
              CHALK (백화/묻어남)
            </th>
          </tr>
          <tr>
            <th className={`${periodThSubClass} ${periodThStickyRow2}`} style={{ top: headerRow2Top }}>
              기간
            </th>
            <th className={`${periodThSubClass} ${periodThStickyRow2}`} style={{ top: headerRow2Top }}>
              ROOF
            </th>
            <th className={`${periodThSubClass} ${periodThStickyRow2}`} style={{ top: headerRow2Top }}>
              WALL
            </th>
            <th className={`${periodThSubClass} ${periodThStickyRow2}`} style={{ top: headerRow2Top }}>
              기간
            </th>
            <th className={`${periodThSubClass} ${periodThStickyRow2}`} style={{ top: headerRow2Top }}>
              ROOF
            </th>
            <th className={`${periodThSubClass} ${periodThStickyRow2}`} style={{ top: headerRow2Top }}>
              WALL
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td
                colSpan={hasActionColumn ? periodDataColCount + 1 : periodDataColCount}
                className="border border-border/50 px-4 py-8 text-center text-sm text-text-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            items.map(({ product, index }) => {
              const colorFadingMode = resolveColorFadingMode(product)
              const chalkMode = resolveChalkMode(product)
              const isColorFadingMerged = colorFadingMode === 'merged'
              const isChalkMerged = chalkMode === 'merged'
              const isHighlighted = highlightedIndex === index
              const isInsertAnchor = editing && insertAnchorIndex === index
              const isDragging = draggingIndex === index
              const isDragOver = dragOverIndex === index && draggingIndex !== index
              return (
                <tr
                  key={`product-row-${index}`}
                  ref={(el) => {
                    if (el) rowRefs.current.set(index, el)
                    else rowRefs.current.delete(index)
                  }}
                  onClick={(e) => {
                    if (!editing || !onSelectInsertAnchor || isTableRowInteractiveTarget(e.target)) {
                      return
                    }
                    onSelectInsertAnchor(index)
                  }}
                  onDragOver={(e) => {
                    if (!canReorder || draggingIndex === null) return
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    setDragOverIndex(index)
                  }}
                  onDragLeave={() => {
                    setDragOverIndex((prev) => (prev === index ? null : prev))
                  }}
                  onDrop={(e) => {
                    if (!canReorder || draggingIndex === null) return
                    e.preventDefault()
                    if (draggingIndex !== index) {
                      onReorder?.(draggingIndex, index)
                    }
                    setDraggingIndex(null)
                    setDragOverIndex(null)
                  }}
                  className={`group ${periodRowClass} transition-colors duration-200 ${periodRowHoverClass(riskVariant)} ${
                    editing && onSelectInsertAnchor ? 'cursor-pointer' : ''
                  } ${isHighlighted ? highlightRowClass : ''} ${
                    isInsertAnchor ? insertAnchorRowClass : ''
                  } ${isDragging ? 'opacity-40' : ''} ${
                    isDragOver ? 'bg-accent/15 ring-1 ring-inset ring-accent/50' : ''
                  }`}
                >
                  {hasActionColumn && (
                    <td className={`${periodTdClass} w-11 px-1 align-middle`}>
                      <div className="flex flex-col items-center gap-1">
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(index)}
                            aria-label="행 삭제"
                            title="행 삭제"
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-text-muted opacity-70 transition-colors hover:bg-red-500/15 hover:text-red-400 group-hover:opacity-100"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        {onReorder && (
                          <div
                            draggable={canReorder}
                            onDragStart={(e) => {
                              if (!canReorder) {
                                e.preventDefault()
                                return
                              }
                              setDraggingIndex(index)
                              e.dataTransfer.effectAllowed = 'move'
                              e.dataTransfer.setData('text/plain', String(index))
                            }}
                            onDragEnd={() => {
                              setDraggingIndex(null)
                              setDragOverIndex(null)
                            }}
                            title={
                              filterActive
                                ? '제품군 필터 해제 후 순서 변경'
                                : '드래그하여 행 이동'
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
                  <td className={`${periodTdClass} break-words text-center font-semibold whitespace-pre-line text-text-primary`}>
                    {editing ? (
                      <>
                        <textarea
                          rows={2}
                          value={product.productGroup}
                          onChange={(e) => onUpdate(index, 'productGroup', e.target.value)}
                          className={`${periodInputClass} h-full max-h-full min-h-0 resize-y text-center font-semibold leading-snug !py-0`}
                          placeholder="제품군"
                        />
                        <div className="mt-2 space-y-1">
                          <SectionModeToggle
                            label="변색"
                            mode={colorFadingMode}
                            onChange={(mode) => onUpdate(index, 'colorFadingMode', mode)}
                          />
                          <SectionModeToggle
                            label="백화"
                            mode={chalkMode}
                            onChange={(mode) => onUpdate(index, 'chalkMode', mode)}
                          />
                        </div>
                      </>
                    ) : (
                      product.productGroup
                    )}
                  </td>
                  <td className={periodTdClass}>
                    <GuideCell
                      value={product.peelFlake}
                      editing={editing}
                      onChange={(v) => onUpdate(index, 'peelFlake', v)}
                    />
                  </td>
                  <td className={periodTdClass}>
                    <GuideCell
                      value={product.perforation}
                      editing={editing}
                      onChange={(v) => onUpdate(index, 'perforation', v)}
                    />
                  </td>
                  {isColorFadingMerged ? (
                    <td colSpan={3} className={`${periodTdClass} text-center`}>
                      <GuideCell
                        value={product.colorFading}
                        editing={editing}
                        onChange={(v) => onUpdate(index, 'colorFading', v)}
                      />
                    </td>
                  ) : (
                    <>
                      <td className={periodTdClass}>
                        <GuideCell
                          value={product.colorFading}
                          editing={editing}
                          onChange={(v) => onUpdate(index, 'colorFading', v)}
                        />
                      </td>
                      <td className={periodTdClass}>
                        <GuideCell
                          value={product.colorFadingRoof}
                          editing={editing}
                          formatSplit
                          onChange={(v) => onUpdate(index, 'colorFadingRoof', v)}
                        />
                      </td>
                      <td className={periodTdClass}>
                        <GuideCell
                          value={product.colorFadingWall}
                          editing={editing}
                          formatSplit
                          onChange={(v) => onUpdate(index, 'colorFadingWall', v)}
                        />
                      </td>
                    </>
                  )}
                  {isChalkMerged ? (
                    <td colSpan={3} className={`${periodTdClass} text-center`}>
                      <GuideCell
                        value={product.chalk}
                        editing={editing}
                        onChange={(v) => onUpdate(index, 'chalk', v)}
                      />
                    </td>
                  ) : (
                    <>
                      <td className={periodTdClass}>
                        <GuideCell
                          value={product.chalk}
                          editing={editing}
                          onChange={(v) => onUpdate(index, 'chalk', v)}
                        />
                      </td>
                      <td className={periodTdClass}>
                        <GuideCell
                          value={product.chalkRoof}
                          editing={editing}
                          formatSplit
                          onChange={(v) => onUpdate(index, 'chalkRoof', v)}
                        />
                      </td>
                      <td className={periodTdClass}>
                        <GuideCell
                          value={product.chalkWall}
                          editing={editing}
                          formatSplit
                          onChange={(v) => onUpdate(index, 'chalkWall', v)}
                        />
                      </td>
                    </>
                  )}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

function collectProductGroupOptions(lineItems: ProductGuideTableItem[]) {
  const seen = new Set<string>()
  const options: string[] = []
  for (const { product } of lineItems) {
    const group = product.productGroup
    if (!seen.has(group)) {
      seen.add(group)
      options.push(group)
    }
  }
  return options
}

function filterItemsByGroups(items: ProductGuideTableItem[], selectedGroups: string[]) {
  if (selectedGroups.length === 0) return items
  const selected = new Set(selectedGroups)
  return items.filter(({ product }) => selected.has(product.productGroup))
}

export function ProductGuideTable({
  items,
  editing,
  highlightedIndex = null,
  highlightSequence = 0,
  onUpdate,
  addTick = 0,
  insertAnchorIndex = null,
  onSelectInsertAnchor,
  onDelete,
  onReorder,
  splitByPrintPaint = false,
  riskVariant,
}: ProductGuideTableProps) {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [selectedPaintGroups, setSelectedPaintGroups] = useState<string[]>([])
  const [selectedPrintGroups, setSelectedPrintGroups] = useState<string[]>([])
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map())

  useEffect(() => {
    if (addTick > 0) {
      setSelectedGroups([])
      setSelectedPaintGroups([])
      setSelectedPrintGroups([])
    }
  }, [addTick])

  const paintSourceItems = useMemo(
    () => items.filter(({ product }) => resolveProductLine(product) === 'paint'),
    [items]
  )

  const printSourceItems = useMemo(
    () => items.filter(({ product }) => resolveProductLine(product) === 'print'),
    [items]
  )

  const productGroupOptions = useMemo(() => collectProductGroupOptions(items), [items])

  const paintGroupOptions = useMemo(
    () => collectProductGroupOptions(paintSourceItems),
    [paintSourceItems]
  )

  const printGroupOptions = useMemo(
    () => collectProductGroupOptions(printSourceItems),
    [printSourceItems]
  )

  const filteredItems = useMemo(
    () => filterItemsByGroups(items, selectedGroups),
    [items, selectedGroups]
  )

  const paintItems = useMemo(
    () => filterItemsByGroups(paintSourceItems, selectedPaintGroups),
    [paintSourceItems, selectedPaintGroups]
  )

  const printItems = useMemo(
    () => filterItemsByGroups(printSourceItems, selectedPrintGroups),
    [printSourceItems, selectedPrintGroups]
  )

  useEffect(() => {
    setSelectedGroups((prev) => prev.filter((group) => productGroupOptions.includes(group)))
  }, [productGroupOptions])

  useEffect(() => {
    setSelectedPaintGroups((prev) => prev.filter((group) => paintGroupOptions.includes(group)))
  }, [paintGroupOptions])

  useEffect(() => {
    setSelectedPrintGroups((prev) => prev.filter((group) => printGroupOptions.includes(group)))
  }, [printGroupOptions])

  useEffect(() => {
    if (highlightedIndex === null) return

    const scrollToHighlightedRow = () => {
      const row = rowRefs.current.get(highlightedIndex)
      if (!row) return false

      row.scrollIntoView({ behavior: 'smooth', block: 'center' })

      const textarea = row.querySelector('textarea')
      if (textarea instanceof HTMLTextAreaElement) {
        textarea.focus({ preventScroll: true })
      }
      return true
    }

    const timer = window.setTimeout(() => {
      if (!scrollToHighlightedRow()) {
        window.setTimeout(scrollToHighlightedRow, 120)
      }
    }, 80)

    return () => clearTimeout(timer)
  }, [highlightedIndex, highlightSequence, filteredItems.length, items.length])

  const hasActiveFilter = splitByPrintPaint
    ? selectedPaintGroups.length > 0 || selectedPrintGroups.length > 0
    : selectedGroups.length > 0

  const canReorder = editing && Boolean(onReorder) && !hasActiveFilter

  const groupHeader = <span className="font-semibold text-text-secondary">제품군</span>

  const defaultEmptyMessage = '등록된 항목이 없습니다.'
  const filteredEmptyMessage = '선택한 제품군에 해당하는 항목이 없습니다.'
  const paintEmptyMessage =
    selectedPaintGroups.length > 0 ? filteredEmptyMessage : defaultEmptyMessage
  const printEmptyMessage =
    selectedPrintGroups.length > 0 ? filteredEmptyMessage : defaultEmptyMessage
  const emptyMessage = selectedGroups.length > 0 ? filteredEmptyMessage : defaultEmptyMessage

  const handleUpdate = (index: number, field: ProductField, value: string) => {
    if (field === 'productGroup') {
      const current = items.find((item) => item.index === index)
      if (current) {
        const oldGroup = current.product.productGroup
        if (splitByPrintPaint) {
          const line = resolveProductLine(current.product)
          if (line === 'paint' && selectedPaintGroups.includes(oldGroup)) {
            setSelectedPaintGroups((prev) =>
              prev.map((group) => (group === oldGroup ? value : group))
            )
          }
          if (line === 'print' && selectedPrintGroups.includes(oldGroup)) {
            setSelectedPrintGroups((prev) =>
              prev.map((group) => (group === oldGroup ? value : group))
            )
          }
        } else if (selectedGroups.includes(oldGroup)) {
          setSelectedGroups((prev) =>
            prev.map((group) => (group === oldGroup ? value : group))
          )
        }
      }
    }
    onUpdate(index, field, value)
  }

  const baseGridProps = {
    editing,
    highlightedIndex,
    insertAnchorIndex,
    onSelectInsertAnchor,
    onDelete,
    onReorder,
    onUpdate: handleUpdate,
    canReorder,
    rowRefs,
    draggingIndex,
    setDraggingIndex,
    dragOverIndex,
    setDragOverIndex,
    riskVariant,
  }

  return (
    <div>
      {editing && (
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <p className="text-xs text-text-muted">
            행을 클릭해 선택한 뒤 <span className="font-medium text-amber-400/90">+</span>를 누르면 해당 행{' '}
            <span className="text-amber-400/90">위</span>에 새 행이 추가됩니다.
          </p>
          {onReorder && canReorder && (
            <p className="text-xs text-text-muted">⋮⋮ 드래그로 순서를 변경할 수 있습니다.</p>
          )}
          {onReorder && hasActiveFilter && (
            <p className="text-xs text-amber-400/90">제품군 필터 해제 후 순서 변경이 가능합니다.</p>
          )}
        </div>
      )}

      {!splitByPrintPaint && productGroupOptions.length > 0 && (
        <ProductGroupMultiSelectFilter
          options={productGroupOptions}
          selectedGroups={selectedGroups}
          onChange={setSelectedGroups}
        />
      )}

      {splitByPrintPaint ? (
        <div className="space-y-5">
          <div>
            {paintGroupOptions.length > 0 && (
              <ProductGroupMultiSelectFilter
                label="PAINT 제품군 선택"
                options={paintGroupOptions}
                selectedGroups={selectedPaintGroups}
                onChange={setSelectedPaintGroups}
              />
            )}
            <ProductCategoryBox title="PAINT" riskVariant={riskVariant}>
              <ProductGuideTableGrid
                {...baseGridProps}
                items={paintItems}
                groupHeader={groupHeader}
                bordered={false}
                filterActive={selectedPaintGroups.length > 0}
                emptyMessage={paintEmptyMessage}
              />
            </ProductCategoryBox>
          </div>
          <div>
            {printGroupOptions.length > 0 && (
              <ProductGroupMultiSelectFilter
                label="PRINT 제품군 선택"
                options={printGroupOptions}
                selectedGroups={selectedPrintGroups}
                onChange={setSelectedPrintGroups}
              />
            )}
            <ProductCategoryBox title="PRINT" riskVariant={riskVariant}>
              <ProductGuideTableGrid
                {...baseGridProps}
                items={printItems}
                groupHeader={groupHeader}
                bordered={false}
                filterActive={selectedPrintGroups.length > 0}
                emptyMessage={printEmptyMessage}
              />
            </ProductCategoryBox>
          </div>
        </div>
      ) : (
        <ProductGuideTableGrid
          {...baseGridProps}
          items={filteredItems}
          groupHeader={groupHeader}
          filterActive={selectedGroups.length > 0}
          emptyMessage={emptyMessage}
        />
      )}
    </div>
  )
}
