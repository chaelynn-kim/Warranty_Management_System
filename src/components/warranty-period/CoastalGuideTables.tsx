import { useState } from 'react'
import { GripVertical, X } from 'lucide-react'
import type {
  CoastalAlSection,
  CoastalDistanceRow,
  CoastalSideData,
  CoastalSideSpecField,
} from '../../types'
import { insertAnchorRowClass, isTableRowInteractiveTarget } from '../../utils/tableRowInteraction'
import { GuideCell } from './GuideCell'
import { RiskBadge } from './RiskBadge'
import { CardSectionToolbar, PeriodSectionEditButton, type SectionEditControl } from './PeriodSection'
import {
  periodInputClass,
  periodTdClass,
  periodThClass,
  periodThGroupClass,
  periodThSubClass,
} from './periodTheme'

const COASTAL_COL_ACTION = '2.75rem'
const COASTAL_COL_DISTANCE = '9rem'
const COASTAL_COL_COAT = '5rem'
const COASTAL_COL_SPEC = '4rem'
const coastalTableClass = 'w-full table-fixed border-collapse text-sm'

function CoastalTableColGroup({ showActions }: { showActions: boolean }) {
  return (
    <colgroup>
      {showActions && <col style={{ width: COASTAL_COL_ACTION }} />}
      <col style={{ width: COASTAL_COL_DISTANCE }} />
      <col style={{ width: COASTAL_COL_COAT }} />
      <col style={{ width: COASTAL_COL_COAT }} />
      <col style={{ width: COASTAL_COL_SPEC }} />
      <col style={{ width: COASTAL_COL_SPEC }} />
      <col style={{ width: COASTAL_COL_SPEC }} />
      <col style={{ width: COASTAL_COL_SPEC }} />
    </colgroup>
  )
}

interface CoastalGuideTablesProps {
  coastal: CoastalAlSection
  highRiskEdit: SectionEditControl & {
    saveMessage?: string
    canAdd: boolean
    onSave: () => void
    onReset: () => void
    onAdd: () => void
  }
  lowRiskEdit: SectionEditControl & {
    saveMessage?: string
    canAdd: boolean
    onSave: () => void
    onReset: () => void
    onAdd: () => void
  }
  insertAnchor?: { side: 'highRisk' | 'lowRisk'; index: number } | null
  onSelectInsertAnchor?: (side: 'highRisk' | 'lowRisk', index: number) => void
  onUpdateRow: (
    side: 'highRisk' | 'lowRisk',
    rowIndex: number,
    field: keyof CoastalDistanceRow,
    value: string
  ) => void
  onUpdateSideSpec: (
    side: 'highRisk' | 'lowRisk',
    field: CoastalSideSpecField,
    value: string
  ) => void
  onDeleteRow?: (side: 'highRisk' | 'lowRisk', rowIndex: number) => void
  onReorderRow?: (side: 'highRisk' | 'lowRisk', fromIndex: number, toIndex: number) => void
}

function CoastalTable({
  riskVariant,
  borderColor,
  side,
  data,
  sectionEdit,
  insertAnchorIndex,
  onSelectInsertAnchor,
  onUpdateRow,
  onUpdateSideSpec,
  onDeleteRow,
  onReorderRow,
}: {
  riskVariant: 'high' | 'low'
  borderColor: string
  side: 'highRisk' | 'lowRisk'
  data: CoastalSideData
  sectionEdit: CoastalGuideTablesProps['highRiskEdit']
  insertAnchorIndex?: number | null
  onSelectInsertAnchor?: (index: number) => void
  onUpdateRow: CoastalGuideTablesProps['onUpdateRow']
  onUpdateSideSpec: CoastalGuideTablesProps['onUpdateSideSpec']
  onDeleteRow?: CoastalGuideTablesProps['onDeleteRow']
  onReorderRow?: CoastalGuideTablesProps['onReorderRow']
}) {
  const editing = sectionEdit.editing
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null)
  const [isSpecColumnHovered, setIsSpecColumnHovered] = useState(false)
  const rowCount = data.rows.length
  const showActions = editing && (onDeleteRow || onReorderRow)
  const canReorder = editing && Boolean(onReorderRow)
  const rowHighlightBg = riskVariant === 'high' ? 'bg-[#9c5c4a]/20' : 'bg-[#4a7ab0]/20'
  const rowBaseBg = (rowIndex: number) =>
    rowIndex % 2 === 0 ? 'bg-bg-tertiary/10' : 'bg-bg-tertiary/25'
  const showSpecHighlight = hoveredRowIndex !== null || isSpecColumnHovered

  const clearHover = () => {
    setHoveredRowIndex(null)
    setIsSpecColumnHovered(false)
  }

  const handleRowHoverStart = (rowIndex: number) => {
    setHoveredRowIndex(rowIndex)
    setIsSpecColumnHovered(false)
  }

  const handleSpecHover = () => {
    setIsSpecColumnHovered(true)
    setHoveredRowIndex(null)
  }

  const getRowTdBg = (rowIndex: number) =>
    hoveredRowIndex === rowIndex ? rowHighlightBg : rowBaseBg(rowIndex)

  const thClass = `${periodThClass} border-t-0`
  const specTdClass = `${periodTdClass} border-l border-border/40 text-center align-middle transition-colors duration-200 ${
    showSpecHighlight ? rowHighlightBg : 'bg-bg-tertiary/15'
  }`

  const isColorFadingMerged =
    data.colorFadingRoof.trim() === data.colorFadingWall.trim()
  const isChalkMerged = data.chalkRoof.trim() === data.chalkWall.trim()

  const handleMergedSpecChange = (roofField: CoastalSideSpecField, wallField: CoastalSideSpecField, value: string) => {
    onUpdateSideSpec(side, roofField, value)
    onUpdateSideSpec(side, wallField, value)
  }

  const renderMergedSpecCell = (
    roofField: CoastalSideSpecField,
    wallField: CoastalSideSpecField,
    value: string
  ) => (
    <td
      key={`${roofField}-merged`}
      colSpan={2}
      rowSpan={rowCount}
      onMouseEnter={handleSpecHover}
      className={specTdClass}
    >
      {editing ? (
        <input
          type="text"
          value={value}
          onChange={(e) => handleMergedSpecChange(roofField, wallField, e.target.value)}
          className={`${periodInputClass} font-medium text-text-primary`}
        />
      ) : (
        <span className="font-medium text-text-primary">{value}</span>
      )}
    </td>
  )

  const renderSplitSpecCells = (
    specs: { field: CoastalSideSpecField; value: string }[]
  ) =>
    specs.map(({ field, value }) => (
      <td
        key={field}
        rowSpan={rowCount}
        onMouseEnter={handleSpecHover}
        className={specTdClass}
      >
        {editing ? (
          <input
            type="text"
            value={value}
            onChange={(e) => onUpdateSideSpec(side, field, e.target.value)}
            className={`${periodInputClass} font-medium text-text-primary`}
          />
        ) : (
          <span className="font-medium text-text-primary">{value}</span>
        )}
      </td>
    ))

  return (
    <div className="min-w-0 flex-1 basis-0">
      <div className="mb-2 flex items-center gap-2">
        <RiskBadge variant={riskVariant} />
        <PeriodSectionEditButton
          canEdit={sectionEdit.canEdit}
          editing={sectionEdit.editing}
          onEdit={sectionEdit.onEdit}
          size="compact"
        />
      </div>
      <CardSectionToolbar
        editing={sectionEdit.editing}
        saveMessage={sectionEdit.saveMessage ?? ''}
        canAdd={sectionEdit.canAdd}
        onSave={sectionEdit.onSave}
        onAdd={sectionEdit.onAdd}
        onReset={sectionEdit.onReset}
      />
      {editing && (onDeleteRow || onReorderRow) && (
        <p className="mb-2 text-xs text-text-muted">
          행을 클릭해 선택한 뒤 <span className="font-medium text-amber-400/90">+</span>를 누르면 해당 행{' '}
          <span className="text-amber-400/90">위</span>에 새 행이 추가됩니다.
        </p>
      )}
      <div className={`overflow-x-auto rounded-lg border-2 bg-bg-secondary/50 ${borderColor}`}>
        <table className={coastalTableClass}>
          <CoastalTableColGroup showActions={Boolean(showActions)} />
          <thead>
            <tr>
              {showActions && (
                <th rowSpan={2} className={`${thClass} w-11 min-w-11 align-middle`} />
              )}
              <th rowSpan={2} className={`${thClass} align-middle`}>
                해안 기준
              </th>
              <th colSpan={2} className={`${periodThGroupClass} border-t-0 border-l border-border/60`}>
                WARRANTY
              </th>
              <th colSpan={2} className={`${periodThGroupClass} border-t-0 border-l border-border/60`}>
                COLOR FADING
              </th>
              <th colSpan={2} className={`${periodThGroupClass} border-t-0 border-l border-border/60`}>
                CHALK
              </th>
            </tr>
            <tr>
              <th className={`${periodThSubClass} border-l border-border/60`}>2 COAT</th>
              <th className={periodThSubClass}>3 COAT</th>
              {isColorFadingMerged ? (
                <th colSpan={2} className={`${periodThSubClass} border-l border-border/60`} />
              ) : (
                <>
                  <th className={`${periodThSubClass} border-l border-border/60`}>ROOF</th>
                  <th className={periodThSubClass}>WALL</th>
                </>
              )}
              {isChalkMerged ? (
                <th colSpan={2} className={`${periodThSubClass} border-l border-border/60`} />
              ) : (
                <>
                  <th className={`${periodThSubClass} border-l border-border/60`}>ROOF</th>
                  <th className={periodThSubClass}>WALL</th>
                </>
              )}
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
                    <>
                      {isColorFadingMerged
                        ? renderMergedSpecCell(
                            'colorFadingRoof',
                            'colorFadingWall',
                            data.colorFadingRoof
                          )
                        : renderSplitSpecCells([
                            { field: 'colorFadingRoof', value: data.colorFadingRoof },
                            { field: 'colorFadingWall', value: data.colorFadingWall },
                          ])}
                      {isChalkMerged
                        ? renderMergedSpecCell('chalkRoof', 'chalkWall', data.chalkRoof)
                        : renderSplitSpecCells([
                            { field: 'chalkRoof', value: data.chalkRoof },
                            { field: 'chalkWall', value: data.chalkWall },
                          ])}
                    </>
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
  highRiskEdit,
  lowRiskEdit,
  insertAnchor,
  onSelectInsertAnchor,
  onUpdateRow,
  onUpdateSideSpec,
  onDeleteRow,
  onReorderRow,
}: CoastalGuideTablesProps) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-4">
      <CoastalTable
        riskVariant="high"
        borderColor="border-[#9c5c4a]/60"
        side="highRisk"
        data={coastal.highRisk}
        sectionEdit={highRiskEdit}
        insertAnchorIndex={insertAnchor?.side === 'highRisk' ? insertAnchor.index : null}
        onSelectInsertAnchor={
          highRiskEdit.editing && onSelectInsertAnchor
            ? (index) => onSelectInsertAnchor('highRisk', index)
            : undefined
        }
        onUpdateRow={onUpdateRow}
        onUpdateSideSpec={onUpdateSideSpec}
        onDeleteRow={highRiskEdit.editing ? onDeleteRow : undefined}
        onReorderRow={highRiskEdit.editing ? onReorderRow : undefined}
      />
      <CoastalTable
        riskVariant="low"
        borderColor="border-[#4a7ab0]/60"
        side="lowRisk"
        data={coastal.lowRisk}
        sectionEdit={lowRiskEdit}
        insertAnchorIndex={insertAnchor?.side === 'lowRisk' ? insertAnchor.index : null}
        onSelectInsertAnchor={
          lowRiskEdit.editing && onSelectInsertAnchor
            ? (index) => onSelectInsertAnchor('lowRisk', index)
            : undefined
        }
        onUpdateRow={onUpdateRow}
        onUpdateSideSpec={onUpdateSideSpec}
        onDeleteRow={lowRiskEdit.editing ? onDeleteRow : undefined}
        onReorderRow={lowRiskEdit.editing ? onReorderRow : undefined}
      />
    </div>
  )
}
