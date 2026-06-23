import { useEffect, useMemo, useState } from 'react'
import { Save, RotateCcw, Pencil, FileDown } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { filterResetButtonClass, filterSearchButtonClass } from '../components/ui/FilterActions'
import { PageHeader } from '../components/layout/PageHeader'
import { WarrantyIssuanceRequestModal } from '../components/warranty-request/WarrantyIssuanceRequestModal'
import { WarrantyRequestTable } from '../components/warranty-request/WarrantyRequestTable'
import { WarrantyRequestPeriodSearch } from '../components/warranty-request/WarrantyRequestPeriodSearch'
import { WarrantyRequestStatusSummary } from '../components/warranty-request/WarrantyRequestStatusSummary'
import { useAuth } from '../contexts/AuthContext'
import type { WarrantyIssuanceRequest, WarrantyIssuanceRequestRecord } from '../types'
import { canManageWarrantyIssuanceQuality, canReceiveWarrantyRequest, canTeamLeaderApproveWarrantyRequest, canEditWarrantyIssuanceLog, TEAM_LEADER_APPROVE_ONLY_MESSAGE } from '../utils/authValidation'
import { resolveStatusAfterSave, normalizeRequestStatus } from '../utils/warrantyRequestStatus'
import {
  WARRANTY_REQUEST_STATUS_RECEIVED,
} from '../constants/warrantyRequestStatus'
import {
  getWarrantyRequestRecords,
  persistWarrantyRequestRecords,
  reloadWarrantyRequestRecords,
} from '../utils/warrantyRequestRecordsCache'
import { downloadWarrantyRequestExcel } from '../utils/warrantyExcel'
import {
  filterRecordsByIssueDateRange,
  filterRecordsByKeyword,
  validateRequestDateRange,
} from '../utils/warrantyRequestFilter'
import { normalizeDate } from '../utils/helpers'

interface WarrantyIssuancePageProps {
  isActive?: boolean
  highlightRequestId?: string | null
  onHighlightRequestHandled?: () => void
}

export function WarrantyIssuancePage({
  isActive = true,
  highlightRequestId = null,
  onHighlightRequestHandled,
}: WarrantyIssuancePageProps) {
  const { user } = useAuth()
  const canManageQuality = canManageWarrantyIssuanceQuality(user?.email)
  const canTeamLeaderApprove = canTeamLeaderApproveWarrantyRequest(user?.email)
  const canReceiveRequest = canReceiveWarrantyRequest(user?.email)
  const canEditLog = canEditWarrantyIssuanceLog(user?.email)
  const [requestRecords, setRequestRecords] = useState(() => getWarrantyRequestRecords())
  const [requestEditing, setRequestEditing] = useState(false)
  const [requestSaveMessage, setRequestSaveMessage] = useState('')
  const [highlightedRequestId, setHighlightedRequestId] = useState<string | null>(null)
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [viewingRequest, setViewingRequest] = useState<WarrantyIssuanceRequestRecord | null>(null)
  const [draftFromDate, setDraftFromDate] = useState('')
  const [draftToDate, setDraftToDate] = useState('')
  const [draftKeyword, setDraftKeyword] = useState('')
  const [appliedFromDate, setAppliedFromDate] = useState('')
  const [appliedToDate, setAppliedToDate] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [isDateFilterActive, setIsDateFilterActive] = useState(false)
  const [isKeywordFilterActive, setIsKeywordFilterActive] = useState(false)
  const [searchError, setSearchError] = useState('')

  const filteredRequestRecords = useMemo(() => {
    let result = requestRecords
    if (isDateFilterActive) {
      result = filterRecordsByIssueDateRange(result, appliedFromDate, appliedToDate)
    }
    if (isKeywordFilterActive) {
      result = filterRecordsByKeyword(result, appliedKeyword)
    }
    return result
  }, [
    requestRecords,
    isDateFilterActive,
    isKeywordFilterActive,
    appliedFromDate,
    appliedToDate,
    appliedKeyword,
  ])

  useEffect(() => {
    if (!canEditLog && requestEditing) {
      setRequestEditing(false)
    }
  }, [canEditLog, requestEditing])

  useEffect(() => {
    if (!isActive) return
    setRequestRecords(getWarrantyRequestRecords())
  }, [isActive])

  useEffect(() => {
    if (!isActive || !highlightRequestId) return

    setRequestRecords(getWarrantyRequestRecords())
    setDraftFromDate('')
    setDraftToDate('')
    setDraftKeyword('')
    setAppliedFromDate('')
    setAppliedToDate('')
    setAppliedKeyword('')
    setIsDateFilterActive(false)
    setIsKeywordFilterActive(false)
    setSearchError('')
    setRequestEditing(false)
    setRequestSaveMessage('')
    setHighlightedRequestId(highlightRequestId)
    onHighlightRequestHandled?.()
  }, [isActive, highlightRequestId, onHighlightRequestHandled])

  useEffect(() => {
    if (!highlightedRequestId) return
    const timer = window.setTimeout(() => setHighlightedRequestId(null), 4000)
    return () => clearTimeout(timer)
  }, [highlightedRequestId])

  const handleRequestEdit = () => {
    setRequestEditing(true)
    setRequestSaveMessage('')
  }

  const handleRequestSave = () => {
    persistWarrantyRequestRecords(requestRecords)
    setRequestEditing(false)
    setHighlightedRequestId(null)
    setRequestSaveMessage('저장되었습니다.')
    setTimeout(() => setRequestSaveMessage(''), 3000)
  }

  const handleRequestDataReset = () => {
    const records = reloadWarrantyRequestRecords()
    setRequestRecords(records)
    setHighlightedRequestId(null)
    setRequestSaveMessage('변경 내용을 되돌렸습니다.')
    setTimeout(() => setRequestSaveMessage(''), 3000)
  }

  const handleDeleteRequest = (id: string) => {
    setRequestRecords((prev) => prev.filter((record) => record.id !== id))
    if (highlightedRequestId === id) setHighlightedRequestId(null)
    setRequestSaveMessage('')
  }

  const handleRequestUpdate = (
    id: string,
    request: WarrantyIssuanceRequest,
    options: { editScope: 'request' | 'quality' }
  ) => {
    const current = requestRecords.find((record) => record.id === id)
    if (!current) return

    if (options.editScope === 'quality') {
      const normalizedStatus = normalizeRequestStatus(current.status)
      if (normalizedStatus === WARRANTY_REQUEST_STATUS_RECEIVED) {
        if (!canReceiveRequest) return
      } else if (!canManageQuality) {
        return
      }
    }

    const nextStatus = resolveStatusAfterSave(current.status, options.editScope)
    const nextRecords = requestRecords.map((record) =>
      record.id === id ? { ...record, ...request, status: nextStatus } : record
    )

    try {
      persistWarrantyRequestRecords(nextRecords)
    } catch {
      setRequestSaveMessage('저장 용량을 초과했습니다. 첨부 파일 크기를 줄여 주세요.')
      setTimeout(() => setRequestSaveMessage(''), 5000)
      return
    }

    setRequestRecords(nextRecords)
    setHighlightedRequestId(id)
    setRequestSaveMessage(
      nextStatus === '발행 완료' ? '발행 완료 처리되었습니다.' : '의뢰 내용이 수정되었습니다.'
    )
    setTimeout(() => setRequestSaveMessage(''), 3000)
  }

  const handleRequestReorder = (fromId: string, toId: string) => {
    setRequestRecords((prev) => {
      const fromIndex = prev.findIndex((record) => record.id === fromId)
      const toIndex = prev.findIndex((record) => record.id === toId)
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return prev
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
    setRequestSaveMessage('')
  }

  const handleRequestStatusChange = (id: string, nextStatus: string) => {
    if (nextStatus === WARRANTY_REQUEST_STATUS_RECEIVED && !canTeamLeaderApprove) {
      window.alert(TEAM_LEADER_APPROVE_ONLY_MESSAGE)
      return
    }

    const nextRecords = requestRecords.map((record) =>
      record.id === id ? { ...record, status: nextStatus } : record
    )

    try {
      persistWarrantyRequestRecords(nextRecords)
    } catch {
      setRequestSaveMessage('저장 용량을 초과했습니다. 첨부 파일 크기를 줄여 주세요.')
      setTimeout(() => setRequestSaveMessage(''), 5000)
      return
    }

    setRequestRecords(nextRecords)
    setViewingRequest((prev) => (prev?.id === id ? { ...prev, status: nextStatus } : prev))
    setHighlightedRequestId(id)
    setRequestSaveMessage(
      nextStatus === WARRANTY_REQUEST_STATUS_RECEIVED
        ? '팀장 승인되어 접수 처리되었습니다.'
        : '상태가 변경되었습니다.'
    )
    setTimeout(() => setRequestSaveMessage(''), 3000)
  }

  const handleRequestExcelDownload = () => {
    downloadWarrantyRequestExcel(filteredRequestRecords)
  }

  const handlePeriodSearch = () => {
    const from = draftFromDate.trim() ? normalizeDate(draftFromDate.trim()) : ''
    const to = draftToDate.trim() ? normalizeDate(draftToDate.trim()) : ''
    const keyword = draftKeyword.trim()

    if (!from && !to && !keyword) {
      setSearchError('발행일자 또는 검색어를 입력해 주세요.')
      return
    }

    if (from || to) {
      const validationError = validateRequestDateRange(draftFromDate, draftToDate)
      if (validationError) {
        setSearchError(validationError)
        return
      }
    }

    setSearchError('')
    setAppliedFromDate(from)
    setAppliedToDate(to)
    setAppliedKeyword(keyword)
    setIsDateFilterActive(Boolean(from || to))
    setIsKeywordFilterActive(Boolean(keyword))
    setRequestSaveMessage('')
  }

  const handlePeriodReset = () => {
    setDraftFromDate('')
    setDraftToDate('')
    setDraftKeyword('')
    setAppliedFromDate('')
    setAppliedToDate('')
    setAppliedKeyword('')
    setIsDateFilterActive(false)
    setIsKeywordFilterActive(false)
    setSearchError('')
  }

  return (
    <div>
      <PageHeader
        subtitle="Warranty Management System"
        title="보증서 발행 관리"
        description="등록된 보증서 발행 의뢰를 조회·관리합니다."
      />

      <WarrantyRequestStatusSummary records={requestRecords} />

      <WarrantyRequestPeriodSearch
        from={draftFromDate}
        to={draftToDate}
        keyword={draftKeyword}
        error={searchError}
        onFromChange={setDraftFromDate}
        onToChange={setDraftToDate}
        onKeywordChange={setDraftKeyword}
        onSearch={handlePeriodSearch}
        onReset={handlePeriodReset}
      />

      <Card
        label="WARRANTY LOG"
        title="보증서 발행 내역"
        titleActions={
          <>
            {canEditLog && (
              <button
                type="button"
                onClick={handleRequestEdit}
                disabled={requestEditing}
                aria-label="수정"
                title="수정"
                className={`inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border bg-bg-tertiary transition-all disabled:cursor-not-allowed ${
                  requestEditing
                    ? 'border-accent text-accent shadow-[0_0_14px_rgba(59,130,246,0.55)] ring-2 ring-accent/45 disabled:opacity-100'
                    : 'border-border text-text-primary hover:border-accent hover:text-accent hover:shadow-[0_0_12px_rgba(59,130,246,0.45)] hover:ring-2 hover:ring-accent/30 active:border-accent active:text-accent active:shadow-[0_0_14px_rgba(59,130,246,0.55)] active:ring-2 active:ring-accent/45 focus-visible:border-accent focus-visible:text-accent focus-visible:shadow-[0_0_12px_rgba(59,130,246,0.45)] focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-50'
                }`}
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleRequestExcelDownload}
              aria-label="Excel 다운로드"
              title="Excel 다운로드"
              className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-emerald-800/50 bg-emerald-950/40 text-emerald-300 transition-all hover:border-emerald-400 hover:text-emerald-200 hover:shadow-[0_0_12px_rgba(52,211,153,0.45)] hover:ring-2 hover:ring-emerald-400/35 active:border-emerald-400 active:text-emerald-100 active:shadow-[0_0_14px_rgba(52,211,153,0.55)] active:ring-2 active:ring-emerald-400/45 focus-visible:border-emerald-400 focus-visible:text-emerald-200 focus-visible:shadow-[0_0_12px_rgba(52,211,153,0.45)] focus-visible:ring-2 focus-visible:ring-emerald-400/35"
            >
              <FileDown className="h-4 w-4" />
            </button>
          </>
        }
      >
        {(requestEditing || requestSaveMessage) && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {requestEditing && (
                <span className="inline-flex items-center rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold tracking-wide text-accent ring-1 ring-accent/40">
                  수정 중
                </span>
              )}
              {requestSaveMessage && (
                <span className="text-sm font-medium text-emerald-400">{requestSaveMessage}</span>
              )}
            </div>
            {requestEditing && (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={handleRequestSave} className={filterSearchButtonClass}>
                  <Save className="h-4 w-4 shrink-0" />
                  저장
                </button>
                <button type="button" onClick={handleRequestDataReset} className={filterResetButtonClass}>
                  <RotateCcw className="h-4 w-4 shrink-0" />
                  되돌리기
                </button>
              </div>
            )}
          </div>
        )}

        <WarrantyRequestTable
          records={filteredRequestRecords}
          editing={requestEditing}
          highlightedRowId={highlightedRequestId}
          onDelete={requestEditing ? handleDeleteRequest : undefined}
          onReorder={requestEditing ? handleRequestReorder : undefined}
          onRowClick={(record) => {
            setViewingRequest(record)
            setRequestModalOpen(true)
          }}
        />
      </Card>

      <WarrantyIssuanceRequestModal
        open={requestModalOpen}
        canManageQuality={canManageQuality}
        canTeamLeaderApprove={canTeamLeaderApprove}
        canReceiveRequest={canReceiveRequest}
        onClose={() => {
          setRequestModalOpen(false)
          setViewingRequest(null)
        }}
        onUpdate={handleRequestUpdate}
        onStatusChange={handleRequestStatusChange}
        viewRequest={viewingRequest}
      />
    </div>
  )
}
