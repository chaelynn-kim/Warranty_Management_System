import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { WarrantyIssuanceRequest, WarrantyIssuanceRequestRecord } from '../../types'
import { toWarrantyIssuanceRequest } from '../../utils/warrantyRequestStorage'
import {
  QUALITY_MANAGEMENT_ONLY_MESSAGE,
  RECEIPT_ASSIGNEE_ONLY_MESSAGE,
  TEAM_LEADER_APPROVE_ONLY_MESSAGE,
} from '../../utils/authValidation'
import {
  canEditRequestFields,
  canPromoteToReceived,
  canStartQualityEdit,
  isRequestCompleted,
  normalizeRequestStatus,
} from '../../utils/warrantyRequestStatus'
import {
  WARRANTY_REQUEST_STATUS_PENDING,
  WARRANTY_REQUEST_STATUS_RECEIVED,
} from '../../constants/warrantyRequestStatus'
import {
  WarrantyIssuanceRequestForm,
  type WarrantyIssuanceRequestFormHandle,
} from './WarrantyIssuanceRequestForm'
import { RequestStatusBadge } from './RequestStatusBadge'

type EditScope = 'request' | 'quality'

interface WarrantyIssuanceRequestModalProps {
  open: boolean
  onClose: () => void
  canManageQuality?: boolean
  canTeamLeaderApprove?: boolean
  canReceiveRequest?: boolean
  onSubmit?: (request: WarrantyIssuanceRequest) => void
  onUpdate?: (
    id: string,
    request: WarrantyIssuanceRequest,
    options: { editScope: EditScope }
  ) => void
  onPersist?: (id: string, request: WarrantyIssuanceRequest) => void
  onStatusChange?: (id: string, nextStatus: string) => void
  viewRequest?: WarrantyIssuanceRequestRecord | null
}

export function WarrantyIssuanceRequestModal({
  open,
  onClose,
  canManageQuality = false,
  canTeamLeaderApprove = false,
  canReceiveRequest = false,
  onSubmit,
  onUpdate,
  onPersist,
  onStatusChange,
  viewRequest = null,
}: WarrantyIssuanceRequestModalProps) {
  const formRef = useRef<WarrantyIssuanceRequestFormHandle>(null)
  const openedRequestIdRef = useRef<string | null>(null)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editScope, setEditScope] = useState<EditScope | null>(null)
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false)
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false)
  const isViewMode = viewRequest != null
  const status = viewRequest ? normalizeRequestStatus(viewRequest.status) : ''

  useEffect(() => {
    if (!open) {
      setIsEditing(false)
      setEditScope(null)
      setApproveConfirmOpen(false)
      setPublishConfirmOpen(false)
      openedRequestIdRef.current = null
      return
    }

    const requestId = viewRequest?.id ?? null
    const isNewRequestContext = openedRequestIdRef.current !== requestId

    if (!isNewRequestContext) {
      return
    }

    openedRequestIdRef.current = requestId
    setError('')
    setIsEditing(false)
    setEditScope(null)
    setApproveConfirmOpen(false)
    setPublishConfirmOpen(false)
    if (viewRequest) {
      formRef.current?.setValue(toWarrantyIssuanceRequest(viewRequest))
    } else {
      formRef.current?.reset()
    }
  }, [open, viewRequest])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (publishConfirmOpen) {
        setPublishConfirmOpen(false)
        return
      }
      if (approveConfirmOpen) {
        setApproveConfirmOpen(false)
        return
      }
      onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose, approveConfirmOpen, publishConfirmOpen])

  if (!open) return null

  const readOnly = isViewMode && !isEditing
  const requestReadOnly = readOnly || editScope === 'quality'
  const qualityReadOnly = readOnly || editScope !== 'quality'

  const handleSubmit = () => {
    if (!formRef.current) {
      setError('폼을 불러올 수 없습니다.')
      return
    }

    const validationError = formRef.current.validate()
    if (validationError) {
      setError(validationError)
      return
    }

    const request = formRef.current.getValue()
    onSubmit?.(request)
    onClose()
  }

  const handleAttachmentPersist = (request: WarrantyIssuanceRequest) => {
    if (!viewRequest || !isEditing || editScope !== 'quality') return
    onPersist?.(viewRequest.id, request)
  }

  const executeSaveUpdate = () => {
    if (!formRef.current || !viewRequest || !editScope) {
      setError('폼을 불러올 수 없습니다.')
      return
    }

    const request = formRef.current.getValue()
    onUpdate?.(viewRequest.id, request, { editScope })
    onClose()
  }

  const handleSaveUpdate = () => {
    if (!formRef.current || !viewRequest || !editScope) {
      setError('폼을 불러올 수 없습니다.')
      return
    }

    if (editScope === 'quality') {
      if (status === WARRANTY_REQUEST_STATUS_RECEIVED) {
        if (!canReceiveRequest) {
          window.alert(RECEIPT_ASSIGNEE_ONLY_MESSAGE)
          return
        }
      } else if (!canManageQuality) {
        setError(QUALITY_MANAGEMENT_ONLY_MESSAGE)
        return
      }
    }

    if (editScope === 'request') {
      const validationError = formRef.current.validate()
      if (validationError) {
        setError(validationError)
        return
      }
    } else {
      const qualityError = formRef.current.validateQuality()
      if (qualityError) {
        setError(qualityError)
        return
      }
    }

    if (editScope === 'quality' && !isRequestCompleted(status)) {
      setError('')
      setPublishConfirmOpen(true)
      return
    }

    executeSaveUpdate()
  }

  const handleConfirmPublish = () => {
    setPublishConfirmOpen(false)
    executeSaveUpdate()
  }

  const handleStartRequestEdit = () => {
    setError('')
    setEditScope('request')
    setIsEditing(true)
  }

  const handleStartQualityEdit = () => {
    if (status === WARRANTY_REQUEST_STATUS_RECEIVED) {
      if (!canReceiveRequest) {
        window.alert(RECEIPT_ASSIGNEE_ONLY_MESSAGE)
        return
      }
    } else if (!canManageQuality) {
      setError(QUALITY_MANAGEMENT_ONLY_MESSAGE)
      return
    }
    setError('')
    setEditScope('quality')
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setError('')
    setIsEditing(false)
    setEditScope(null)
    if (viewRequest) {
      formRef.current?.setValue(toWarrantyIssuanceRequest(viewRequest))
    }
  }

  const handleTeamLeaderApprove = () => {
    if (!viewRequest) return
    if (!canTeamLeaderApprove) {
      window.alert(TEAM_LEADER_APPROVE_ONLY_MESSAGE)
      return
    }
    setError('')
    setApproveConfirmOpen(true)
  }

  const handleConfirmTeamLeaderApprove = () => {
    if (!viewRequest) return
    onStatusChange?.(viewRequest.id, WARRANTY_REQUEST_STATUS_RECEIVED)
    setApproveConfirmOpen(false)
    setError('')
  }

  const statusHint =
    status === WARRANTY_REQUEST_STATUS_PENDING
      ? '품질경영팀 팀장 승인 시 접수 처리됩니다.'
      : status === WARRANTY_REQUEST_STATUS_RECEIVED
        ? '작성 담당자가 검토 결과 영역을 작성·저장하면 발행 완료됩니다.'
        : status === '발행 완료'
          ? '발행 완료된 의뢰도 수정할 수 있습니다.'
          : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="닫기"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="warranty-request-modal-title"
        className="relative flex max-h-[min(92vh,900px)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border bg-bg-secondary shadow-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border bg-bg-tertiary px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <h2 id="warranty-request-modal-title" className="text-base font-semibold text-text-primary sm:text-lg">
              보증 발행 의뢰서
            </h2>
            {isViewMode && viewRequest.status && (
              <RequestStatusBadge status={viewRequest.status} />
            )}
            {isViewMode && isEditing && (
              <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                {editScope === 'quality' ? '품질 작성 중' : '수정 중'}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-primary hover:text-text-primary"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          <WarrantyIssuanceRequestForm
            ref={formRef}
            recordId={viewRequest?.id}
            onAttachmentPersist={
              isEditing && editScope === 'quality' ? handleAttachmentPersist : undefined
            }
            readOnly={readOnly && !isEditing}
            requestReadOnly={requestReadOnly}
            qualityReadOnly={
              qualityReadOnly ||
              (status === WARRANTY_REQUEST_STATUS_RECEIVED ? !canReceiveRequest : !canManageQuality)
            }
            showQualitySection={isViewMode}
            qualityLocked={
              isViewMode &&
              !isEditing &&
              (status === WARRANTY_REQUEST_STATUS_PENDING ||
                (status === WARRANTY_REQUEST_STATUS_RECEIVED && !canReceiveRequest))
            }
          />
        </div>

        {publishConfirmOpen && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/55 p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="publish-confirm-title"
              className="w-full max-w-sm rounded-xl border border-border bg-bg-secondary p-6 shadow-2xl"
            >
              <p
                id="publish-confirm-title"
                className="text-center text-sm font-medium text-text-primary sm:text-base"
              >
                발행 하시겠습니까?
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleConfirmPublish}
                  className="inline-flex h-11 min-w-[5.5rem] items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
                >
                  예
                </button>
                <button
                  type="button"
                  onClick={() => setPublishConfirmOpen(false)}
                  className="inline-flex h-11 min-w-[5.5rem] items-center justify-center rounded-lg border border-border bg-bg-tertiary px-6 text-sm font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent"
                >
                  아니오
                </button>
              </div>
            </div>
          </div>
        )}

        {approveConfirmOpen && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/55 p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="team-leader-approve-confirm-title"
              className="w-full max-w-sm rounded-xl border border-border bg-bg-secondary p-6 shadow-2xl"
            >
              <p
                id="team-leader-approve-confirm-title"
                className="text-center text-sm font-medium text-text-primary sm:text-base"
              >
                승인 하시겠습니까?
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleConfirmTeamLeaderApprove}
                  className="inline-flex h-11 min-w-[5.5rem] items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
                >
                  예
                </button>
                <button
                  type="button"
                  onClick={() => setApproveConfirmOpen(false)}
                  className="inline-flex h-11 min-w-[5.5rem] items-center justify-center rounded-lg border border-border bg-bg-tertiary px-6 text-sm font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent"
                >
                  아니오
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-border bg-bg-tertiary/80 px-5 py-4 sm:px-6">
          {isViewMode && !isEditing ? (
            <>
              <p
                className={`min-h-[20px] text-sm ${error ? 'font-medium text-red-400' : 'text-text-muted'}`}
                role={error ? 'alert' : undefined}
                aria-live={error ? 'polite' : undefined}
              >
                {error || statusHint || '의뢰 내역 조회'}
              </p>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                {canPromoteToReceived(status) && (
                  <button
                    type="button"
                    onClick={handleTeamLeaderApprove}
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
                  >
                    팀장 승인
                  </button>
                )}
                {canStartQualityEdit(status) && (
                  <button
                    type="button"
                    onClick={handleStartQualityEdit}
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-fuchsia-400/70 bg-bg-tertiary px-5 text-sm font-semibold text-text-primary shadow-[0_0_10px_rgba(232,121,249,0.4)] transition-colors hover:border-fuchsia-400 hover:text-fuchsia-300 hover:shadow-[0_0_14px_rgba(232,121,249,0.55)]"
                  >
                    {isRequestCompleted(status) ? '품질 영역 수정' : '작성하기'}
                  </button>
                )}
                {canEditRequestFields(status) && (
                  <button
                    type="button"
                    onClick={handleStartRequestEdit}
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-bg-tertiary px-5 text-sm font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent"
                  >
                    의뢰 내용 수정
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-bg-tertiary px-5 text-sm font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent"
                >
                  닫기
                </button>
              </div>
            </>
          ) : isViewMode && isEditing ? (
            <>
              <p className="min-h-[20px] flex-1 text-sm font-medium text-red-400" role="alert" aria-live="polite">
                {error}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-bg-tertiary px-6 text-sm font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveUpdate}
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
                >
                  {editScope === 'quality' && !isRequestCompleted(status) ? '발행 완료' : '저장'}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="min-h-[20px] flex-1 text-sm font-medium text-red-400" role="alert" aria-live="polite">
                {error}
              </p>
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-[#1c1c1c] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#2a2a2a]"
              >
                의뢰하기
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  )
}
