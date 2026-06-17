import { useState } from 'react'
import { GripVertical, X } from 'lucide-react'
import type { CoastalAlSection, CoastalDistanceRow, CoastalSideData } from '../../types'
import { insertAnchorRowClass, isTableRowInteractiveTarget } from '../../utils/tableRowInteraction'
import { GuideCell } from './GuideCell'
import { RiskBadge } from './RiskBadge'
import { periodInputClass, periodTdClass } from './periodTheme'

interface CoastalGuideTablesProps {
  coastal: CoastalAlSection
  editing: boolean
  insertAnchor?: { side: 'highRisk' | 'lowRisk'; index: number } | null
  onSelectInsertAnchor?: (side: 'highRisk' | 'lowRisk', index: number) => void
  onUpdateRow: (
    side: 'highRisk' | 'lowRisk',
    rowIndex: number,
    field: keyof CoastalDistanceRow,
    value: string
  ) => void
  onUpdateWarrantyNote: (side: 'highRisk' | 'lowRisk', value: string) => void
  onDeleteRow?: (side: 'highRisk' | 'lowRisk', rowIndex: number) => void
  onReorderRow?: (side: 'highRisk' | 'lowRisk', fromIndex: number, toIndex: number) => void
}

function CoastalTable({
  riskVariant,
  borderColor,
  side,
  data,
  editing,
  insertAnchorIndex,
  onSelectInsertAnchor,
  onUpdateRow,
  onUpdateWarrantyNote,
  onDeleteRow,
  onReorderRow,
}: {
  riskVariant: 'high' | 'low'
  borderColor: string
  side: 'highRisk' | 'lowRisk'
  data: CoastalSideData
  editing: boolean
  insertAnchorIndex?: number | null
  onSelectInsertAnchor?: (index: number) => void
  onUpdateRow: CoastalGuideTablesProps['onUpdateRow']
  onUpdateWarrantyNote: CoastalGuideTablesProps['onUpdateWarrantyNote']
  onDeleteRow?: CoastalGuideTablesProps['onDeleteRow']
  onReorderRow?: CoastalGuideTablesProps['onReorderRow']
}) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null)
  const [isWarrantyHovered, setIsWarrantyHovered] = useState(false)
  const rowCount = data.rows.length
  const showActions = editing && (onDeleteRow || onReorderRow)
  const canReorder = editing && Boolean(onReorderRow)
  const rowHighlightBg = riskVariant === 'high' ? 'bg-[#9c5c4a]/20' : 'bg-[#4a7ab0]/20'
  const rowBaseBg = (rowIndex: number) =>
    rowIndex % 2 === 0 ? 'bg-bg-tertiary/10' : 'bg-bg-tertiary/25'
  const showWarrantyHighlight = hoveredRowIndex !== null || isWarrantyHovered

  const clearHover = () => {
    setHoveredRowIndex(null)
    setIsWarrantyHovered(false)
  }

  const handleRowHoverStart = (rowIndex: number) => {
    setHoveredRowIndex(rowIndex)
    setIsWarrantyHovered(false)
  }

  const getRowTdBg = (rowIndex: number) =>
    hoveredRowIndex === rowIndex ? rowHighlightBg : rowBaseBg(rowIndex)
  const thClass =
    'border-b border-border bg-bg-tertiary px-3 py-2.5 text-center text-xs font-semibold text-text-secondary'

  return (
    <div className="min-w-[280px] flex-1">
      <div className="mb-2">
        <RiskBadge variant={riskVariant} />
      </div>
      {editing && (onDeleteRow || onReorderRow) && (
        <p className="mb-2 text-xs text-text-muted">
          행을 클릭해 선택한 뒤 <span className="font-medium text-amber-400/90">+</span>를 누르면 해당 행{' '}
          <span className="text-amber-400/90">위</span>에 새 행이 추가됩니다.
        </p>
      )}
      <div className={`overflow-hidden rounded-lg border-2 bg-bg-secondary/50 ${borderColor}`}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {showActions && <th className={`${thClass} w-11 min-w-11`} />}
              <th className={thClass}>해안 기준</th>
              <th className={`${thClass} border-l border-border/60`}>2 COAT</th>
              <th className={`${thClass} border-l border-border/60`}>3 COAT</th>
              <th className={`${thClass} border-l border-border/60`}>WARRANTY</th>
            </tr>
          </thead>
          <tbody onMouseLeave={clearHover}>
            {data.rows.map((row, rowIndex) => {
              const isInsertAnchor = editing && insertAnchorIndex === rowIndex
              const isDragging = draggingIndex === rowIndex
              const isDragOver = dragOverIndex === rowIndex && draggingIndex !== rowIndex

              return (
                <tr
                  key={`${side}-row-${rowIndex}`}
                  onClick={(e) => {
                    if (!editing || !onSelectInsertAnchor || isTableRowInteractiveTarget(e.target)) {
                      return
                    }
                    onSelectInsertAnchor(rowIndex)
                  }}
                  onDragOver={(e) => {
                    if (!canReorder || draggingIndex === null) return
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    setDragOverIndex(rowIndex)
                  }}
                  onDragLeave={() => {
                    setDragOverIndex((prev) => (prev === rowIndex ? null : prev))
                  }}
                  onDrop={(e) => {
                    if (!canReorder || draggingIndex === null) return
                    e.preventDefault()
                    if (draggingIndex !== rowIndex) {
                      onReorderRow?.(side, draggingIndex, rowIndex)
                    }
                    setDraggingIndex(null)
                    setDragOverIndex(null)
                  }}
                  className={`group transition-colors duration-200 ${
                    editing && onSelectInsertAnchor ? 'cursor-pointer' : ''
                  } ${isInsertAnchor ? insertAnchorRowClass : ''} ${isDragging ? 'opacity-40' : ''} ${
                    isDragOver ? 'bg-accent/15 ring-1 ring-inset ring-accent/50' : ''
                  }`}
                >
                  {showActions && (
                    <td
                      className={`${periodTdClass} w-11 px-1 align-middle transition-colors duration-200 ${getRowTdBg(rowIndex)}`}
                      onMouseEnter={() => handleRowHoverStart(rowIndex)}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {onDeleteRow && (
                          <button
                            type="button"
                            onClick={() => onDeleteRow(side, rowIndex)}
                            aria-label="행 삭제"
                            title="행 삭제"
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-text-muted opacity-70 transition-colors hover:bg-red-500/15 hover:text-red-400 group-hover:opacity-100"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        {onReorderRow && (
                          <div
                            draggable={canReorder}
                            onDragStart={(e) => {
                              if (!canReorder) {
                                e.preventDefault()
                                return
                              }
                              setDraggingIndex(rowIndex)
                              e.dataTransfer.effectAllowed = 'move'
                              e.dataTransfer.setData('text/plain', String(rowIndex))
                            }}
                            onDragEnd={() => {
                              setDraggingIndex(null)
                              setDragOverIndex(null)
                            }}
                            title="드래그하여 행 이동"
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
                  <td
                    className={`${periodTdClass} text-center font-medium text-text-primary transition-colors duration-200 ${getRowTdBg(rowIndex)}`}
                    onMouseEnter={() => handleRowHoverStart(rowIndex)}
                  >
                    {editing ? (
                      <input
                        type="text"
                        value={row.distance}
                        onChange={(e) => onUpdateRow(side, rowIndex, 'distance', e.target.value)}
                        className={periodInputClass}
                      />
                    ) : (
                      row.distance
                    )}
                  </td>
                  <td
                    className={`${periodTdClass} border-l border-border/40 text-center transition-colors duration-200 ${getRowTdBg(rowIndex)}`}
                    onMouseEnter={() => handleRowHoverStart(rowIndex)}
                  >
                    <GuideCell
                      value={row.coat2}
                      editing={editing}
                      onChange={(v) => onUpdateRow(side, rowIndex, 'coat2', v)}
                    />
                  </td>
                  <td
                    className={`${periodTdClass} border-l border-border/40 text-center transition-colors duration-200 ${getRowTdBg(rowIndex)}`}
                    onMouseEnter={() => handleRowHoverStart(rowIndex)}
                  >
                    <GuideCell
                      value={row.coat3}
                      editing={editing}
                      onChange={(v) => onUpdateRow(side, rowIndex, 'coat3', v)}
                    />
                  </td>
                  {rowIndex === 0 && (
                    <td
                      rowSpan={rowCount}
                      onMouseEnter={() => {
                        setIsWarrantyHovered(true)
                        setHoveredRowIndex(null)
                      }}
                      className={`${periodTdClass} border-l border-border/40 text-center align-middle transition-colors duration-200 ${
                        showWarrantyHighlight ? rowHighlightBg : 'bg-bg-tertiary/15'
                      }`}
                    >
                      {editing ? (
                        <textarea
                          rows={5}
                          value={data.warrantyNote}
                          onChange={(e) => onUpdateWarrantyNote(side, e.target.value)}
                          className={`${periodInputClass} text-accent`}
                        />
                      ) : (
                        <span className="block whitespace-pre-line text-sm">
                          {data.warrantyNote.split('\n').map((line, i) => (
                            <span
                              key={i}
                              className={
                                line.includes('ΔE') || line.includes('NO.')
                                  ? 'font-medium text-accent'
                                  : 'font-medium text-text-primary'
                              }
                            >
                              {line}
                              {i < data.warrantyNote.split('\n').length - 1 && <br />}
                            </span>
                          ))}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function CoastalGuideTables({
  coastal,
  editing,
  insertAnchor,
  onSelectInsertAnchor,
  onUpdateRow,
  onUpdateWarrantyNote,
  onDeleteRow,
  onReorderRow,
}: CoastalGuideTablesProps) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-4">
      <CoastalTable
        riskVariant="high"
        borderColor="border-[#9c5c4a]/60"
        side="highRisk"
        data={coastal.highRisk}
        editing={editing}
        insertAnchorIndex={insertAnchor?.side === 'highRisk' ? insertAnchor.index : null}
        onSelectInsertAnchor={
          onSelectInsertAnchor ? (index) => onSelectInsertAnchor('highRisk', index) : undefined
        }
        onUpdateRow={onUpdateRow}
        onUpdateWarrantyNote={onUpdateWarrantyNote}
        onDeleteRow={onDeleteRow}
        onReorderRow={onReorderRow}
      />
      <CoastalTable
        riskVariant="low"
        borderColor="border-[#4a7ab0]/60"
        side="lowRisk"
        data={coastal.lowRisk}
        editing={editing}
        insertAnchorIndex={insertAnchor?.side === 'lowRisk' ? insertAnchor.index : null}
        onSelectInsertAnchor={
          onSelectInsertAnchor ? (index) => onSelectInsertAnchor('lowRisk', index) : undefined
        }
        onUpdateRow={onUpdateRow}
        onUpdateWarrantyNote={onUpdateWarrantyNote}
        onDeleteRow={onDeleteRow}
        onReorderRow={onReorderRow}
      />
    </div>
  )
}
