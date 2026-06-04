import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
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
}

export function NotCoveredGuide({
  section,
  editing,
  highlightedIndex = null,
  insertAnchorIndex = null,
  onSelectInsertAnchor,
  onUpdateItem,
  onDeleteItem,
}: NotCoveredGuideProps) {
  const itemRefs = useRef<Map<number, HTMLLIElement>>(new Map())

  useEffect(() => {
    if (highlightedIndex === null) return
    const timer = window.setTimeout(() => {
      itemRefs.current.get(highlightedIndex)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
    return () => clearTimeout(timer)
  }, [highlightedIndex, section.items.length])

  return (
    <div>
      {editing && (
        <p className="mb-3 text-xs text-text-muted">
          항목을 클릭해 선택한 뒤 <span className="font-medium text-amber-400/90">+</span>를 누르면 해당 항목{' '}
          <span className="text-amber-400/90">위</span>에 새 항목이 추가됩니다.
        </p>
      )}
      <div className="rounded-lg border border-rose-900/40 bg-rose-950/25 px-5 py-4">
        <ul className="space-y-3">
          {section.items.map((item, index) => {
            const isHighlighted = highlightedIndex === index
            const isInsertAnchor = editing && insertAnchorIndex === index
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
                className={`group flex items-start gap-2 rounded-md px-2 py-1.5 text-sm leading-relaxed transition-all duration-300 ${
                  editing && onSelectInsertAnchor ? 'cursor-pointer' : ''
                } ${isHighlighted ? highlightItemClass : ''} ${
                  isInsertAnchor ? insertAnchorRowClass : ''
                }`}
              >
                {editing && onDeleteItem && (
                  <button
                    type="button"
                    onClick={() => onDeleteItem(index)}
                    aria-label="항목 삭제"
                    title="항목 삭제"
                    className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-text-muted opacity-70 transition-colors hover:bg-red-500/15 hover:text-red-400 group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
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
