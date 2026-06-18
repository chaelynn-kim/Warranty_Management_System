import { useEffect, useMemo, useState } from 'react'
import { Plus, Save, FileDown, RotateCcw, Pencil } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/layout/PageHeader'
import { EditableWarrantyTable } from '../components/warranty/EditableWarrantyTable'
import { emptyWarrantyTableFilters } from '../components/warranty/WarrantyTableFilterRow'
import type { WarrantyRecord } from '../types'
import { matchesTextFilter } from '../utils/filterHelpers'
import { normalizeDate } from '../utils/helpers'
import { downloadWarrantyExcel } from '../utils/warrantyExcel'
import {
  createEmptyWarrantyRecord,
  loadWarrantyRecords,
  saveWarrantyRecords,
} from '../utils/warrantyStorage'

function recordMatchesFilters(record: WarrantyRecord, filters: typeof emptyWarrantyTableFilters) {
  const issueDate = record.issueDate ? normalizeDate(record.issueDate) : ''

  return (
    matchesTextFilter(filters.issueDate, issueDate) &&
    matchesTextFilter(filters.region, record.region) &&
    matchesTextFilter(filters.customer, record.customer) &&
    matchesTextFilter(filters.colorName, record.colorName) &&
    matchesTextFilter(filters.paintCompany, record.paintCompany) &&
    matchesTextFilter(filters.resin, record.resin) &&
    matchesTextFilter(filters.totalThickness, record.totalThickness) &&
    matchesTextFilter(filters.primerThickness, record.primerThickness) &&
    matchesTextFilter(filters.coat, record.coat) &&
    matchesTextFilter(filters.bake, record.bake) &&
    matchesTextFilter(filters.supplierPeel, record.supplierPeel) &&
    matchesTextFilter(filters.supplierFadeRoof, record.supplierFadeRoof) &&
    matchesTextFilter(filters.supplierFadeWall, record.supplierFadeWall) &&
    matchesTextFilter(filters.supplierChalkRoof, record.supplierChalkRoof) &&
    matchesTextFilter(filters.supplierChalkWall, record.supplierChalkWall) &&
    matchesTextFilter(filters.notes, record.notes)
  )
}

export function WarrantyIssuancePage() {
  const [records, setRecords] = useState<WarrantyRecord[]>(() => loadWarrantyRecords())
  const [filters, setFilters] = useState(emptyWarrantyTableFilters)
  const [editing, setEditing] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [newRowIds, setNewRowIds] = useState<Set<string>>(new Set())
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null)
  const [insertAnchorId, setInsertAnchorId] = useState<string | null>(null)

  useEffect(() => {
    if (!highlightedRowId) return
    const timer = window.setTimeout(() => setHighlightedRowId(null), 4000)
    return () => clearTimeout(timer)
  }, [highlightedRowId])

  const filteredRecords = useMemo(
    () => records.filter((record) => recordMatchesFilters(record, filters)),
    [records, filters]
  )

  const displayRecords = useMemo(() => {
    const filteredIds = new Set(filteredRecords.map((r) => r.id))
    const extraNewRows = records.filter((r) => newRowIds.has(r.id) && !filteredIds.has(r.id))
    return [...filteredRecords, ...extraNewRows]
  }, [filteredRecords, records, newRowIds])

  const handleEdit = () => {
    setEditing(true)
    setInsertAnchorId(null)
    setSaveMessage('')
  }

  const handleAddRow = () => {
    const newRow = createEmptyWarrantyRecord()
    setRecords((prev) => {
      const anchorIndex = insertAnchorId ? prev.findIndex((record) => record.id === insertAnchorId) : -1
      const insertAt = anchorIndex >= 0 ? anchorIndex : prev.length
      const next = [...prev]
      next.splice(insertAt, 0, newRow)
      return next
    })
    setNewRowIds((prev) => new Set(prev).add(newRow.id))
    setHighlightedRowId(newRow.id)
    setSaveMessage('')
  }

  const handleSave = () => {
    saveWarrantyRecords(records)
    setNewRowIds(new Set())
    setEditing(false)
    setHighlightedRowId(null)
    setInsertAnchorId(null)
    setSaveMessage('저장되었습니다.')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const handleDataReset = () => {
    setRecords(loadWarrantyRecords())
    setNewRowIds(new Set())
    setHighlightedRowId(null)
    setInsertAnchorId(null)
    setSaveMessage('초기화되었습니다.')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const handleExcelDownload = () => {
    downloadWarrantyExcel(records)
  }

  const handleUpdate = (id: string, field: keyof WarrantyRecord, value: string) => {
    setRecords((prev) =>
      prev.map((record) => (record.id === id ? { ...record, [field]: value } : record))
    )
    setSaveMessage('')
  }

  const handleDeleteRow = (id: string) => {
    setRecords((prev) => prev.filter((record) => record.id !== id))
    setNewRowIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    if (highlightedRowId === id) setHighlightedRowId(null)
    if (insertAnchorId === id) setInsertAnchorId(null)
    setSaveMessage('')
  }

  const handleReorder = (fromId: string, toId: string) => {
    setRecords((prev) => {
      const fromIndex = prev.findIndex((record) => record.id === fromId)
      const toIndex = prev.findIndex((record) => record.id === toId)
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return prev
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
    setSaveMessage('')
  }

  return (
    <div>
      <PageHeader
        subtitle="Warranty Management System"
        title="보증서 발행 관리"
        description="보증서 발행 내역을 조회하고 관리합니다. 발행일자, 지역, 수요가, 색상 정보 및 보증 연한을 확인할 수 있습니다."
      />

      <Card label="WARRANTY LOG" title="보증서 발행 내역">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="text-sm text-text-secondary">
              조회 결과 <span className="font-semibold text-accent">{displayRecords.length}</span>건
            </p>
            {editing && (
              <span className="inline-flex items-center rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold tracking-wide text-accent ring-1 ring-accent/40">
                수정 중
              </span>
            )}
            {saveMessage && (
              <span className="text-sm font-medium text-emerald-400">{saveMessage}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleEdit}
              disabled={editing}
              className="inline-flex h-[38px] items-center gap-2 rounded-lg border border-border bg-bg-tertiary px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Pencil className="h-4 w-4" />
              수정
            </button>
            {editing && (
              <>
                <button
                  type="button"
                  onClick={handleAddRow}
                  aria-label="행 추가"
                  title="행 추가"
                  className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-border bg-bg-tertiary text-text-primary transition-colors hover:border-accent hover:text-accent"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex h-[38px] items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                >
                  <Save className="h-4 w-4" />
                  저장
                </button>
                <button
                  type="button"
                  onClick={handleDataReset}
                  className="inline-flex h-[38px] items-center gap-2 rounded-lg border border-border bg-bg-tertiary px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
                >
                  <RotateCcw className="h-4 w-4" />
                  초기화
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleExcelDownload}
              className="inline-flex h-[38px] items-center gap-2 rounded-lg border border-emerald-800/50 bg-emerald-950/40 px-4 py-2 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-950/60"
            >
              <FileDown className="h-4 w-4" />
              EXCEL DOWNLOAD
            </button>
          </div>
        </div>

        <EditableWarrantyTable
          editing={editing}
          records={displayRecords}
          highlightedRowId={editing ? highlightedRowId : null}
          insertAnchorId={editing ? insertAnchorId : null}
          onSelectInsertAnchor={editing ? setInsertAnchorId : undefined}
          onUpdate={handleUpdate}
          onDelete={handleDeleteRow}
          onReorder={editing ? handleReorder : undefined}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </Card>
    </div>
  )
}
