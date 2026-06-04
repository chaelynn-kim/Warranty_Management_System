import type { CoastalAlSection, CoastalDistanceRow, CoastalSideData } from '../../types'
import { GuideCell } from './GuideCell'
import { RiskBadge } from './RiskBadge'
import { periodInputClass, periodTdClass } from './periodTheme'

interface CoastalGuideTablesProps {
  coastal: CoastalAlSection
  editing: boolean
  onUpdateRow: (
    side: 'highRisk' | 'lowRisk',
    rowIndex: number,
    field: keyof CoastalDistanceRow,
    value: string
  ) => void
  onUpdateWarrantyNote: (side: 'highRisk' | 'lowRisk', value: string) => void
}

function CoastalTable({
  riskVariant,
  borderColor,
  side,
  data,
  editing,
  onUpdateRow,
  onUpdateWarrantyNote,
  highlightLastRow,
}: {
  riskVariant: 'high' | 'low'
  borderColor: string
  side: 'highRisk' | 'lowRisk'
  data: CoastalSideData
  editing: boolean
  onUpdateRow: CoastalGuideTablesProps['onUpdateRow']
  onUpdateWarrantyNote: CoastalGuideTablesProps['onUpdateWarrantyNote']
  highlightLastRow?: boolean
}) {
  const rowCount = data.rows.length
  const thClass =
    'border-b border-border bg-bg-tertiary px-3 py-2.5 text-center text-xs font-semibold text-text-secondary'

  return (
    <div className="min-w-[280px] flex-1">
      <div className="mb-2">
        <RiskBadge variant={riskVariant} />
      </div>
      <div className={`overflow-hidden rounded-lg border-2 bg-bg-secondary/50 ${borderColor}`}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className={thClass}>해안 기준</th>
              <th className={`${thClass} border-l border-border/60`}>2 COAT</th>
              <th className={`${thClass} border-l border-border/60`}>3 COAT</th>
              <th className={`${thClass} border-l border-border/60`}>WARRANTY</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr
                key={`${side}-${row.distance}`}
                className={
                  highlightLastRow && rowIndex === rowCount - 1
                    ? 'bg-accent/10'
                    : rowIndex % 2 === 0
                      ? 'bg-bg-tertiary/10'
                      : 'bg-bg-tertiary/25'
                }
              >
                <td className={`${periodTdClass} text-center font-medium text-text-primary`}>
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
                <td className={`${periodTdClass} border-l border-border/40 text-center`}>
                  <GuideCell
                    value={row.coat2}
                    editing={editing}
                    onChange={(v) => onUpdateRow(side, rowIndex, 'coat2', v)}
                  />
                </td>
                <td className={`${periodTdClass} border-l border-border/40 text-center`}>
                  <GuideCell
                    value={row.coat3}
                    editing={editing}
                    onChange={(v) => onUpdateRow(side, rowIndex, 'coat3', v)}
                  />
                </td>
                {rowIndex === 0 && (
                  <td
                    rowSpan={rowCount}
                    className={`${periodTdClass} border-l border-border/40 text-center align-middle`}
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function CoastalGuideTables({
  coastal,
  editing,
  onUpdateRow,
  onUpdateWarrantyNote,
}: CoastalGuideTablesProps) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-4">
      <CoastalTable
        riskVariant="high"
        borderColor="border-[#9c5c4a]/60"
        side="highRisk"
        data={coastal.highRisk}
        editing={editing}
        onUpdateRow={onUpdateRow}
        onUpdateWarrantyNote={onUpdateWarrantyNote}
      />
      <CoastalTable
        riskVariant="low"
        borderColor="border-[#4a7ab0]/60"
        side="lowRisk"
        data={coastal.lowRisk}
        editing={editing}
        onUpdateRow={onUpdateRow}
        onUpdateWarrantyNote={onUpdateWarrantyNote}
        highlightLastRow
      />
    </div>
  )
}
