import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { GripVertical, X } from 'lucide-react'
import type { NotCoveredSection } from '../../types'
import { periodInputClass } from './periodTheme'
import { insertAnchorRowClass, isTableRowInteractiveTarget } from '../../utils/tableRowInteraction'

const highlightItemClass =
  'rounded-md bg-accent/20 ring-2 ring-inset ring-accent shadow-[inset_0_0_0_1px_rgba(59,130,246,0.35)]'

/** public/not-covered/{파일명}.png — 항목 문구에 키워드가 포함되면 해당 아이콘 표시 */
const NOT_COVERED_ICON_MATCHES: { keywords: string[]; file: string; tintItemText?: boolean }[] = [
  { keywords: ['멀티글로스'], file: '멀티글로스', tintItemText: true },
  { keywords: ['Metallic', '메탈릭'], file: '메탈릭', tintItemText: true },
  { keywords: ['고광', '고광택'], file: '고광', tintItemText: true },
  { keywords: ['유색'], file: '유색.재첨부', tintItemText: true },
]

function resolveNotCoveredIcon(item: string): { src: string; tintItemText: boolean } | null {
  const text = item.trim()
  for (const { keywords, file, tintItemText } of NOT_COVERED_ICON_MATCHES) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return { src: `/not-covered/${file}.png`, tintItemText: tintItemText ?? false }
    }
  }
  return null
}

const notCoveredIconMaskStyle = (src: string): CSSProperties => ({
  maskImage: `url(${src})`,
  WebkitMaskImage: `url(${src})`,
  maskSize: 'contain',
  WebkitMaskSize: 'contain',
  maskRepeat: 'no-repeat',
  WebkitMaskRepeat: 'no-repeat',
  maskPosition: 'center',
  WebkitMaskPosition: 'center',
})

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
            const icon = resolveNotCoveredIcon(item)
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
                {icon ? (
                  icon.tintItemText ? (
                    <span
                      aria-hidden
                      className="mt-0.5 h-6 w-6 shrink-0 bg-rose-100/95"
                      style={notCoveredIconMaskStyle(icon.src)}
                    />
                  ) : (
                    <img
                      src={icon.src}
                      alt=""
                      aria-hidden
                      className="mt-0.5 h-6 w-6 shrink-0 object-contain"
                    />
                  )
                ) : (
                  <span className="mt-0.5 shrink-0 font-semibold text-rose-300/90">•</span>
                )}
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
