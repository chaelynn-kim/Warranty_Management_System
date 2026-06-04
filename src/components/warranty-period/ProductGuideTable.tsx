import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, GripVertical, X } from 'lucide-react'
import type { ProductWarranty } from '../../types'
import { resolveChalkMode, resolveColorFadingMode, type SectionDisplayMode } from '../../utils/productWarrantyHelpers'
import { insertAnchorRowClass, isTableRowInteractiveTarget } from '../../utils/tableRowInteraction'
import { GuideCell } from './GuideCell'
import { periodInputClass, periodRowClass, periodTdClass, periodThClass, periodThStickyRow1, periodThStickyRow2, periodThStickyRowSpan, periodThSubClass } from './periodTheme'

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
}

function ProductGroupHeaderFilter({
  options,
  selected,
  onChange,
}: {
  options: string[]
  selected: string
  onChange: (value: string) => void
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

  const label = selected || '제품군'
  const isFiltered = Boolean(selected)

  return (
    <div ref={ref} className="relative mx-auto min-w-[88px] max-w-[160px]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex w-full items-center justify-center gap-1 font-semibold transition-colors ${
          isFiltered ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
        }`}
        title={selected || '제품군 필터'}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-1/2 z-50 mt-1 max-h-56 min-w-[180px] -translate-x-1/2 overflow-y-auto rounded-lg border border-border bg-bg-secondary py-1 text-left shadow-xl">
          <button
            type="button"
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
            className={`block w-full px-3 py-2 text-xs transition-colors hover:bg-bg-tertiary ${
              !selected ? 'font-semibold text-accent' : 'text-text-primary'
            }`}
          >
            전체
          </button>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option)
                setOpen(false)
              }}
              className={`block w-full px-3 py-2 text-xs whitespace-pre-line transition-colors hover:bg-bg-tertiary ${
                selected === option ? 'font-semibold text-accent' : 'text-text-primary'
              }`}
            >
              {option}
            </button>
          ))}
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
}: ProductGuideTableProps) {
  const [selectedGroup, setSelectedGroup] = useState('')
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map())
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const headerRowRef = useRef<HTMLTableRowElement>(null)
  const [headerRowHeight, setHeaderRowHeight] = useState(0)

  useEffect(() => {
    if (addTick > 0) setSelectedGroup('')
  }, [addTick])

  const productGroupOptions = useMemo(() => {
    const seen = new Set<string>()
    const options: string[] = []
    for (const { product } of items) {
      const group = product.productGroup
      if (!seen.has(group)) {
        seen.add(group)
        options.push(group)
      }
    }
    return options
  }, [items])

  const filteredItems = useMemo(() => {
    if (!selectedGroup) return items
    return items.filter(({ product }) => product.productGroup === selectedGroup)
  }, [items, selectedGroup])

  useEffect(() => {
    const row = headerRowRef.current
    if (!row) return

    const syncHeight = () => setHeaderRowHeight(row.getBoundingClientRect().height)
    syncHeight()

    const observer = new ResizeObserver(syncHeight)
    observer.observe(row)
    return () => observer.disconnect()
  }, [editing])

  useEffect(() => {
    if (selectedGroup && !productGroupOptions.includes(selectedGroup)) {
      setSelectedGroup('')
    }
  }, [productGroupOptions, selectedGroup])

  useEffect(() => {
    if (highlightedIndex === null) return

    const scrollToHighlightedRow = () => {
      const row = rowRefs.current.get(highlightedIndex)
      const container = scrollContainerRef.current
      if (!row || !container) return false

      const targetTop =
        row.offsetTop - container.clientHeight / 2 + row.offsetHeight / 2
      container.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth',
      })

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

  const headerRow2Top = headerRowHeight > 0 ? headerRowHeight : 43
  const canReorder = editing && Boolean(onReorder) && !selectedGroup

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
          {onReorder && selectedGroup && (
            <p className="text-xs text-amber-400/90">제품군 필터 해제 후 순서 변경이 가능합니다.</p>
          )}
        </div>
      )}

    <div
      ref={scrollContainerRef}
      className="max-h-[calc(100dvh-420px)] min-h-[240px] overflow-auto rounded-lg border border-border"
    >
      <table className="w-full min-w-[960px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr ref={headerRowRef}>
            {editing && (onDelete || onReorder) && (
              <th
                rowSpan={2}
                className={`${periodThClass} ${periodThStickyRow1} ${periodThStickyRowSpan} w-11 min-w-11 align-middle`}
              />
            )}
            <th
              rowSpan={2}
              className={`${periodThClass} ${periodThStickyRow1} ${periodThStickyRowSpan} min-w-[100px] align-middle`}
            >
              <ProductGroupHeaderFilter
                options={productGroupOptions}
                selected={selectedGroup}
                onChange={setSelectedGroup}
              />
            </th>
            <th rowSpan={2} className={`${periodThClass} ${periodThStickyRow1} ${periodThStickyRowSpan} min-w-[72px]`}>
              PEEL/FLAKE
              <br />
              (도막박리)
            </th>
            <th rowSpan={2} className={`${periodThClass} ${periodThStickyRow1} ${periodThStickyRowSpan} min-w-[72px]`}>
              PERFORATION
              <br />
              (천공)
            </th>
            <th colSpan={3} className={`${periodThClass} ${periodThStickyRow1}`}>
              COLOR FADING (변색/탈색)
            </th>
            <th colSpan={3} className={`${periodThClass} ${periodThStickyRow1}`}>
              CHALK (백화/묻어남)
            </th>
            <th rowSpan={2} className={`${periodThClass} ${periodThStickyRow1} ${periodThStickyRowSpan} min-w-[140px]`}>
              비고
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
          {filteredItems.length === 0 ? (
            <tr>
              <td
                colSpan={editing && (onDelete || onReorder) ? 11 : 10}
                className="border border-border/50 px-4 py-8 text-center text-sm text-text-muted"
              >
                선택한 제품군에 해당하는 항목이 없습니다.
              </td>
            </tr>
          ) : (
            filteredItems.map(({ product, index }) => {
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
                  className={`group ${periodRowClass} transition-all duration-300 ${
                    editing && onSelectInsertAnchor ? 'cursor-pointer' : ''
                  } ${isHighlighted ? highlightRowClass : ''} ${
                    isInsertAnchor ? insertAnchorRowClass : ''
                  } ${isDragging ? 'opacity-40' : ''} ${
                    isDragOver ? 'bg-accent/15 ring-1 ring-inset ring-accent/50' : ''
                  }`}
                >
                  {editing && (onDelete || onReorder) && (
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
                              selectedGroup
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
                  <td className={`${periodTdClass} text-center font-semibold whitespace-pre-line text-text-primary`}>
                    {editing ? (
                      <>
                        <textarea
                          rows={2}
                          value={product.productGroup}
                          onChange={(e) => onUpdate(index, 'productGroup', e.target.value)}
                          className={`${periodInputClass} min-h-[52px] resize-y text-center font-semibold leading-snug`}
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
                  <td className={periodTdClass}>
                    <GuideCell
                      value={product.notes}
                      editing={editing}
                      multiline
                      onChange={(v) => onUpdate(index, 'notes', v)}
                    />
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
