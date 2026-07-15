import { useMemo, useState } from 'react'
import { GripVertical, Search, X } from 'lucide-react'
import type { CountryEntry } from '../../types'
import { PageHeaderCautionIcon } from '../layout/PageHeader'
import {
  PeriodSectionInlineHeader,
  type SectionEditControl,
} from './PeriodSection'
import {
  periodCardHoverClass,
  periodCautionNoticeClass,
  periodInputClass,
  periodRiskBorderClass,
  periodRiskHeaderBorderClass,
} from './periodTheme'
import { isTableRowInteractiveTarget } from '../../utils/tableRowInteraction'

const LOW_RISK_NOTE_HIGHLIGHT = '호주, 뉴질랜드, 남미국가 (UV 지수 고위험 국가)'

function renderLowRiskNote(note: string) {
  const text = note.replace(/^※\s*/, '')
  const highlightIndex = text.indexOf(LOW_RISK_NOTE_HIGHLIGHT)
  if (highlightIndex < 0) return text

  const before = text.slice(0, highlightIndex)
  const after = text.slice(highlightIndex + LOW_RISK_NOTE_HIGHLIGHT.length)

  return (
    <>
      {before}
      <span className="font-semibold underline decoration-text-secondary underline-offset-2">
        {LOW_RISK_NOTE_HIGHLIGHT}
      </span>
      {after}
    </>
  )
}

interface CountryGuideGridProps {
  countries: CountryEntry[]
  editing: boolean
  onUpdate: (index: number, field: keyof CountryEntry, value: string) => void
  onDelete?: (index: number) => void
  onReorder?: (fromIndex: number, toIndex: number) => void
  riskVariant?: 'high' | 'low'
  note?: string
  onNoteChange?: (value: string) => void
  sectionEdit?: SectionEditControl
}

export function CountryGuideGrid({
  countries,
  editing,
  onUpdate,
  onDelete,
  onReorder,
  riskVariant,
  note,
  onNoteChange,
  sectionEdit,
}: CountryGuideGridProps) {
  const [search, setSearch] = useState('')
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const hasActiveFilter = search.trim().length > 0
  const canReorder = editing && Boolean(onReorder) && !hasActiveFilter

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase()
    return countries
      .map((country, index) => ({ country, index }))
      .filter(({ country }) => {
        if (!query) return true
        const haystack = `${country.region} ${country.countries}`.toLowerCase()
        return haystack.includes(query)
      })
  }, [countries, search])

  return (
    <div
      className={`mb-6 overflow-hidden rounded-lg border-2 bg-bg-secondary/50 ${periodRiskBorderClass(riskVariant)}`}
    >
      <div
        className={`border-b bg-bg-tertiary px-4 py-2.5 ${periodRiskHeaderBorderClass(riskVariant)}`}
      >
        <PeriodSectionInlineHeader sectionEdit={sectionEdit}>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="국가명, 지역명 검색"
              className={`${periodInputClass} h-9 w-full pl-8 text-left`}
            />
          </div>
        </PeriodSectionInlineHeader>
      </div>

      <div className="p-4">
        {editing && (onDelete || onReorder) && (
          <p className="mb-3 text-xs text-text-muted">
            <span className="font-medium text-amber-400/90">+</span> 버튼으로 지역 박스를 추가할 수
            있습니다.
            {onReorder && (
              <>
                {' '}
                <span className="text-amber-400/90">⋮⋮</span> 드래그로 박스 순서를 변경할 수 있습니다.
              </>
            )}
            {hasActiveFilter && onReorder && (
              <span className="mt-1 block text-amber-400/80">
                검색 중에는 순서 변경이 비활성화됩니다.
              </span>
            )}
          </p>
        )}

        {filteredEntries.length === 0 ? (
          <p className="rounded-lg border border-border bg-bg-tertiary/40 px-4 py-6 text-center text-sm text-text-muted">
            {countries.length === 0 && editing
              ? '지역 박스가 없습니다. + 버튼으로 추가해 주세요.'
              : '검색 결과가 없습니다.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filteredEntries.map(({ country, index }) => {
              const isDragging = draggingIndex === index
              const isDragOver = dragOverIndex === index && draggingIndex !== index

              return (
                <div
                  key={`country-box-${index}`}
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
                  className={`group rounded-lg border border-border bg-bg-tertiary/40 px-4 py-3 transition-colors ${periodCardHoverClass(riskVariant)} ${
                    isDragging ? 'opacity-40' : ''
                  } ${isDragOver ? 'ring-2 ring-inset ring-accent/50' : ''}`}
                >
                  <div className="flex gap-2">
                    {editing && (onDelete || onReorder) && (
                      <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
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
                            onMouseDown={(e) => e.stopPropagation()}
                            title="드래그하여 박스 이동"
                            className={`inline-flex h-7 w-7 cursor-grab items-center justify-center rounded text-text-muted transition-colors active:cursor-grabbing ${
                              canReorder
                                ? 'hover:bg-bg-primary hover:text-text-primary'
                                : 'cursor-not-allowed opacity-40'
                            }`}
                          >
                            <GripVertical className="h-4 w-4" />
                          </div>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(index)}
                            onMouseDown={(e) => e.stopPropagation()}
                            aria-label="지역 박스 삭제"
                            title="지역 박스 삭제"
                            className="inline-flex h-7 w-7 items-center justify-center rounded text-text-muted opacity-70 transition-colors hover:bg-red-500/15 hover:text-red-400 group-hover:opacity-100"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      {editing ? (
                        <>
                          <input
                            type="text"
                            value={country.region}
                            onChange={(e) => onUpdate(index, 'region', e.target.value)}
                            onMouseDown={(e) => {
                              if (isTableRowInteractiveTarget(e.target)) e.stopPropagation()
                            }}
                            placeholder="지역명"
                            className={`${periodInputClass} mb-2 text-left font-semibold text-accent`}
                          />
                          <textarea
                            rows={2}
                            value={country.countries}
                            onChange={(e) => onUpdate(index, 'countries', e.target.value)}
                            onMouseDown={(e) => {
                              if (isTableRowInteractiveTarget(e.target)) e.stopPropagation()
                            }}
                            placeholder="국가 목록"
                            className={`${periodInputClass} resize-y text-left`}
                          />
                        </>
                      ) : (
                        <>
                          <p className="mb-1 text-sm font-bold text-accent">{country.region}</p>
                          <p className="text-sm leading-relaxed text-text-secondary">
                            {country.countries}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {note !== undefined && (
          <div className="mt-3 border-t border-border/60 pt-3">
            {editing && onNoteChange ? (
              <textarea
                rows={2}
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                className={`${periodInputClass} resize-y text-left`}
              />
            ) : (
              <p className={periodCautionNoticeClass}>
                <PageHeaderCautionIcon className="h-[1em] w-[1em] shrink-0" />
                <span>{renderLowRiskNote(note)}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
