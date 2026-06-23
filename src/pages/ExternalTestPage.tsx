import { useEffect, useMemo, useState } from 'react'
import { Plus, Save, FileDown, RotateCcw, Pencil } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { filterResetButtonClass, filterSearchButtonClass } from '../components/ui/FilterActions'
import { PageHeader } from '../components/layout/PageHeader'
import { EditableExternalTestTable } from '../components/external-test/EditableExternalTestTable'
import { ExternalTestSearchPanel } from '../components/external-test/ExternalTestSearchPanel'
import { ExternalTestStatusSummary } from '../components/external-test/ExternalTestStatusSummary'
import type { ExternalTestRecord } from '../types'
import {
  emptyExternalTestSearch,
  hasActiveExternalTestSearch,
  recordMatchesExternalTestSearch,
} from '../utils/externalTestFilter'
import { downloadExternalTestExcel } from '../utils/externalTestExcel'
import {
  compareExternalTestByNoDesc,
  createEmptyExternalTestRecord,
  loadExternalTestRecords,
  saveExternalTestRecords,
  sortExternalTestRecordsByNoDesc,
} from '../utils/externalTestStorage'

export function ExternalTestPage() {
  const [records, setRecords] = useState<ExternalTestRecord[]>(() => loadExternalTestRecords())
  const [draftSearch, setDraftSearch] = useState(emptyExternalTestSearch)
  const [appliedSearch, setAppliedSearch] = useState(emptyExternalTestSearch)
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [newRowIds, setNewRowIds] = useState<Set<string>>(new Set())
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null)

  useEffect(() => {
    if (!highlightedRowId) return
    const timer = window.setTimeout(() => setHighlightedRowId(null), 5000)
    return () => clearTimeout(timer)
  }, [highlightedRowId])

  const displayRecords = useMemo(() => {
    const newRows = records.filter((record) => newRowIds.has(record.id))
    const existing = records
      .filter(
        (record) =>
          !newRowIds.has(record.id) && recordMatchesExternalTestSearch(record, appliedSearch)
      )
      .sort(compareExternalTestByNoDesc)
    return [...newRows, ...existing]
  }, [records, appliedSearch, newRowIds])

  const handleSearch = () => {
    setAppliedSearch(draftSearch)
    setIsSearchActive(hasActiveExternalTestSearch(draftSearch))
  }

  const handleSearchReset = () => {
    setDraftSearch(emptyExternalTestSearch)
    setAppliedSearch(emptyExternalTestSearch)
    setIsSearchActive(false)
  }

  const handleEditClick = () => {
    setEditing(true)
    setSaveMessage('')
  }

  const handlePlusClick = () => {
    if (!editing) {
      setEditing(true)
      setSaveMessage('')
    }

    const newRow = createEmptyExternalTestRecord(records)
    setRecords((prev) => [newRow, ...prev])
    setNewRowIds((prev) => new Set(prev).add(newRow.id))
    setHighlightedRowId(newRow.id)
    setSaveMessage('')
  }

  const handleSave = () => {
    const sorted = sortExternalTestRecordsByNoDesc(records)
    saveExternalTestRecords(sorted)
    setRecords(sorted)
    setNewRowIds(new Set())
    setEditing(false)
    setHighlightedRowId(null)
    setSaveMessage('저장되었습니다.')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const handleReset = () => {
    setRecords(loadExternalTestRecords())
    setDraftSearch(emptyExternalTestSearch)
    setAppliedSearch(emptyExternalTestSearch)
    setIsSearchActive(false)
    setNewRowIds(new Set())
    setHighlightedRowId(null)
    setEditing(false)
    setSaveMessage('초기화되었습니다.')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const handleExcelDownload = () => {
    downloadExternalTestExcel(sortExternalTestRecordsByNoDesc(records))
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

      <ExternalTestStatusSummary records={records} />

      <ExternalTestSearchPanel
        filters={draftSearch}
        onChange={setDraftSearch}
        onSearch={handleSearch}
        onReset={handleSearchReset}
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
              onClick={handlePlusClick}
              aria-label="행 추가"
              title="행 추가"
              className={`inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border bg-bg-tertiary transition-all ${
                editing
                  ? 'border-accent text-accent shadow-[0_0_14px_rgba(59,130,246,0.55)] ring-2 ring-accent/45'
                  : 'border-border text-text-primary hover:border-accent hover:text-accent hover:shadow-[0_0_12px_rgba(59,130,246,0.45)] hover:ring-2 hover:ring-accent/30'
              }`}
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleEditClick}
              disabled={editing}
              aria-label="수정"
              title="수정"
              className={`inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border bg-bg-tertiary transition-all disabled:cursor-default ${
                editing
                  ? 'border-accent text-accent shadow-[0_0_14px_rgba(59,130,246,0.55)] ring-2 ring-accent/45'
                  : 'border-border text-text-primary hover:border-accent hover:text-accent hover:shadow-[0_0_12px_rgba(59,130,246,0.45)] hover:ring-2 hover:ring-accent/30'
              }`}
            >
              <Pencil className="h-4 w-4" />
            </button>
            {editing && (
              <>
                <button type="button" onClick={handleSave} className={filterSearchButtonClass}>
                  <Save className="h-4 w-4 shrink-0" />
                  저장
                </button>
                <button type="button" onClick={handleReset} className={filterResetButtonClass}>
                  <RotateCcw className="h-4 w-4 shrink-0" />
                  초기화
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleExcelDownload}
              aria-label="Excel 다운로드"
              title="Excel 다운로드"
              className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-emerald-800/50 bg-emerald-950/40 text-emerald-300 transition-all hover:border-emerald-400 hover:text-emerald-200 hover:shadow-[0_0_12px_rgba(52,211,153,0.45)] hover:ring-2 hover:ring-emerald-400/35 active:border-emerald-400 active:text-emerald-100 active:shadow-[0_0_14px_rgba(52,211,153,0.55)] active:ring-2 active:ring-emerald-400/45 focus-visible:border-emerald-400 focus-visible:text-emerald-200 focus-visible:shadow-[0_0_12px_rgba(52,211,153,0.45)] focus-visible:ring-2 focus-visible:ring-emerald-400/35"
            >
              <FileDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        <EditableExternalTestTable
          editing={editing}
          records={displayRecords}
          highlightedRowId={editing ? highlightedRowId : null}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onReorder={editing && !isSearchActive ? handleReorder : undefined}
        />
      </Card>
    </div>
  )
}
