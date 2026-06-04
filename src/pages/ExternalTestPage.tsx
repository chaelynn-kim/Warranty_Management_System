import { useEffect, useMemo, useState } from 'react'
import { Plus, Save, FileDown, RotateCcw, Pencil } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/layout/PageHeader'
import { EditableExternalTestTable } from '../components/external-test/EditableExternalTestTable'
import {
  emptyExternalTestTableFilters,
  type ExternalTestTableFilters,
} from '../components/external-test/ExternalTestTableFilterRow'
import type { ExternalTestRecord } from '../types'
import { matchesTextFilter } from '../utils/filterHelpers'
import { downloadExternalTestExcel } from '../utils/externalTestExcel'
import {
  createEmptyExternalTestRecord,
  loadExternalTestRecords,
  saveExternalTestRecords,
} from '../utils/externalTestStorage'

function recordMatchesFilters(record: ExternalTestRecord, filters: ExternalTestTableFilters) {
  return (
    matchesTextFilter(filters.purpose, record.purpose) &&
    matchesTextFilter(filters.sampleName, record.sampleName) &&
    matchesTextFilter(filters.colorName, record.colorName) &&
    matchesTextFilter(filters.workshop, record.workshop) &&
    matchesTextFilter(filters.productionDate, record.productionDate) &&
    matchesTextFilter(filters.itemCode, record.itemCode) &&
    matchesTextFilter(filters.itemName, record.itemName) &&
    matchesTextFilter(filters.resin, record.resin) &&
    matchesTextFilter(filters.requestDate, record.requestDate) &&
    matchesTextFilter(filters.receiptDate, record.receiptDate) &&
    matchesTextFilter(filters.completionDate, record.completionDate) &&
    matchesTextFilter(filters.status, record.status) &&
    matchesTextFilter(filters.institution, record.institution) &&
    matchesTextFilter(filters.notes, record.notes)
  )
}

export function ExternalTestPage() {
  const [records, setRecords] = useState<ExternalTestRecord[]>(() => loadExternalTestRecords())
  const [filters, setFilters] = useState(emptyExternalTestTableFilters)
  const [editing, setEditing] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [newRowIds, setNewRowIds] = useState<Set<string>>(new Set())
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null)
  const [insertAnchorId, setInsertAnchorId] = useState<string | null>(null)

  useEffect(() => {
    if (!highlightedRowId) return
    const timer = window.setTimeout(() => setHighlightedRowId(null), 5000)
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
    const newRow = createEmptyExternalTestRecord(records)
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
    saveExternalTestRecords(records)
    setNewRowIds(new Set())
    setEditing(false)
    setHighlightedRowId(null)
    setInsertAnchorId(null)
    setSaveMessage('저장되었습니다.')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const handleReset = () => {
    setRecords(loadExternalTestRecords())
    setFilters(emptyExternalTestTableFilters)
    setNewRowIds(new Set())
    setHighlightedRowId(null)
    setInsertAnchorId(null)
    setSaveMessage('초기화되었습니다.')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const handleExcelDownload = () => {
    downloadExternalTestExcel(records)
  }

  const handleUpdate = (id: string, field: keyof ExternalTestRecord, value: string) => {
    setRecords((prev) =>
      prev.map((record) => (record.id === id ? { ...record, [field]: value } : record))
    )
    setSaveMessage('')
  }

  const handleDelete = (id: string) => {
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
        subtitle="External Certification Test"
        title="외부 공인 기관 시험"
        description="외부 공인 기관에 의뢰한 시험 목록을 조회하고 진행 현황을 관리합니다."
      />

      <Card label="TEST LOG" title="외부 공인 기관 시험 내역">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
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
                  onClick={handleReset}
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

        <EditableExternalTestTable
          editing={editing}
          records={displayRecords}
          highlightedRowId={editing ? highlightedRowId : null}
          insertAnchorId={editing ? insertAnchorId : null}
          onSelectInsertAnchor={editing ? setInsertAnchorId : undefined}
          filters={filters}
          onFiltersChange={setFilters}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onReorder={editing ? handleReorder : undefined}
        />
      </Card>
    </div>
  )
}
