import { useEffect, useRef, useState } from 'react'
import { GripVertical, X } from 'lucide-react'
import type { NotCoveredSection } from '../../types'
import { periodInputClass } from './periodTheme'
import { insertAnchorRowClass, isTableRowInteractiveTarget } from '../../utils/tableRowInteraction'

const highlightItemClass =
  'rounded-md bg-accent/20 ring-2 ring-inset ring-accent shadow-[inset_0_0_0_1px_rgba(59,130,246,0.35)]'

interface NotCoveredGuideProps {
  section: NotCoveredSection
  editing: boolean
  highlightedIndex?: number | null
  insertAnchorIndex?: number | null
  onSelectInsertAnchor?: (index: number) => void
  onUpdateItem: (index: number, value: string) => void
  onDeleteItem?: (index: number) => void
  onReorderItem?: (fromIndex: number, toIndex: number) => void
}

export function NotCoveredGuide({
  section,
  editing,
  highlightedIndex = null,
  insertAnchorIndex = null,
  onSelectInsertAnchor,
  onUpdateItem,
  onDeleteItem,
  onReorderItem,
}: NotCoveredGuideProps) {
  const itemRefs = useRef<Map<number, HTMLLIElement>>(new Map())
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const canReorder = editing && Boolean(onReorderItem)

  useEffect(() => {
    if (highlightedIndex === null) return
    const timer = window.setTimeout(() => {
      itemRefs.current.get(highlightedIndex)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
    return () => clearTimeout(timer)
  }, [highlightedIndex, section.items.length])

  return (
    <div>
      <div className="mb-4 space-y-2 text-sm leading-relaxed text-text-secondary">
        <p>
          ※ 본 WARRANTY GUIDE는 판매 활성화를 위한 기준이며, 구체적인 사안별 (색상 / 시공 지역 / 환경 / 용도)에 따라
          기준이 달라질 수 있습니다.
        </p>
        <p>
   또한, 특수 환경(강산, 강알칼리 지역 등) 및 특수 용도의 경우 반드시 사전 협의가 필요합니다.
        </p>
      </div>

      {editing && (onDeleteItem || onReorderItem) && (
        <p className="mb-3 text-xs text-text-muted">
          항목을 클릭해 선택한 뒤 <span className="font-medium text-amber-400/90">+</span>를 누르면 해당 항목{' '}
          <span className="text-amber-400/90">위</span>에 새 항목이 추가됩니다.
          {onReorderItem && (
            <>
              {' '}
              <span className="text-amber-400/90">⋮⋮</span> 드래그로 순서를 변경할 수 있습니다.
            </>
          )}
        </p>
      )}
      <div className="rounded-lg border border-rose-900/40 bg-rose-950/25 px-5 py-4">
        <ul className="space-y-3">
          {section.items.map((item, index) => {
            const isHighlighted = highlightedIndex === index
            const isInsertAnchor = editing && insertAnchorIndex === index
            const isDragging = draggingIndex === index
            const isDragOver = dragOverIndex === index && draggingIndex !== index
            return (
              <li
                key={`not-covered-${index}`}
                ref={(el) => {
                  if (el) itemRefs.current.set(index, el)
                  else itemRefs.current.delete(index)
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
                    onReorderItem?.(draggingIndex, index)
                  }
                  setDraggingIndex(null)
                  setDragOverIndex(null)
                }}
                className={`group flex items-start gap-2 rounded-md px-2 py-1.5 text-sm leading-relaxed transition-all duration-300 ${
                  editing && onSelectInsertAnchor ? 'cursor-pointer' : ''
                } ${isHighlighted ? highlightItemClass : ''} ${
                  isInsertAnchor ? insertAnchorRowClass : ''
                } ${isDragging ? 'opacity-40' : ''} ${
                  isDragOver ? 'bg-accent/15 ring-1 ring-inset ring-accent/50' : ''
                }`}
              >
                {editing && (onDeleteItem || onReorderItem) && (
                  <div className="mt-0.5 flex shrink-0 flex-col items-center gap-1">
                    {onDeleteItem && (
                      <button
                        type="button"
                        onClick={() => onDeleteItem(index)}
                        aria-label="항목 삭제"
                        title="항목 삭제"
                        className="inline-flex h-7 w-7 items-center justify-center rounded text-text-muted opacity-70 transition-colors hover:bg-red-500/15 hover:text-red-400 group-hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    {onReorderItem && (
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
                        title="드래그하여 항목 이동"
                        className={`inline-flex h-7 w-7 items-center justify-center rounded text-text-muted transition-colors ${
                          canReorder
                            ? 'cursor-grab opacity-70 hover:bg-bg-tertiary hover:text-text-primary active:cursor-grabbing group-hover:opacity-100'
                            : 'cursor-not-allowed opacity-30'
                        }`}
                        aria-label="항목 순서 변경"
                      >
                        <GripVertical className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                )}
                <span className="mt-0.5 shrink-0 font-semibold text-rose-300/90">•</span>
                {editing ? (
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => onUpdateItem(index, e.target.value)}
                    className={`${periodInputClass} flex-1 text-left text-rose-100`}
                  />
                ) : (
                  <span className="text-rose-100/95">{item}</span>
                )}
              </li>
            )
          })}
        </ul>
      </div>

    </div>
  )
}
