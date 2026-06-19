import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { WarrantyIssuanceRequest, WarrantyIssuanceRequestRecord } from '../../types'
import { toWarrantyIssuanceRequest } from '../../utils/warrantyRequestStorage'
import {
  canEditRequestFields,
  canPromoteToInProgress,
  canStartQualityEdit,
  isRequestCompleted,
  normalizeRequestStatus,
} from '../../utils/warrantyRequestStatus'
import {
  WARRANTY_REQUEST_STATUS_IN_PROGRESS,
  WARRANTY_REQUEST_STATUS_PENDING,
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
  onSubmit?: (request: WarrantyIssuanceRequest) => void
  onUpdate?: (
    id: string,
    request: WarrantyIssuanceRequest,
    options: { editScope: EditScope }
  ) => void
  onStatusChange?: (id: string, nextStatus: string) => void
  viewRequest?: WarrantyIssuanceRequestRecord | null
}

export function WarrantyIssuanceRequestModal({
  open,
  onClose,
  canManageQuality = false,
  onSubmit,
  onUpdate,
  onStatusChange,
  viewRequest = null,
}: WarrantyIssuanceRequestModalProps) {
  const formRef = useRef<WarrantyIssuanceRequestFormHandle>(null)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editScope, setEditScope] = useState<EditScope | null>(null)
  const isViewMode = viewRequest != null
  const status = viewRequest ? normalizeRequestStatus(viewRequest.status) : ''

  useEffect(() => {
    if (!open) {
      setIsEditing(false)
      setEditScope(null)
      return
    }
    setError('')
    setIsEditing(false)
    setEditScope(null)
    if (viewRequest) {
      formRef.current?.setValue(toWarrantyIssuanceRequest(viewRequest))
    } else {
      formRef.current?.reset()
    }
  }, [open, viewRequest])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

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

  const handleSaveUpdate = () => {
    if (!formRef.current || !viewRequest || !editScope) {
      setError('폼을 불러올 수 없습니다.')
      return
    }

    if (editScope === 'quality' && !canManageQuality) {
      setError('품질경영팀 검토 결과를 수정할 권한이 없습니다.')
      return
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

    const request = formRef.current.getValue()
    onUpdate?.(viewRequest.id, request, { editScope })
    onClose()
  }

  const handleStartRequestEdit = () => {
    setError('')
    setEditScope('request')
    setIsEditing(true)
  }

  const handleStartQualityEdit = () => {
    if (!canManageQuality) return
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

  const handlePromoteToInProgress = () => {
    if (!viewRequest || !canManageQuality) return
    onStatusChange?.(viewRequest.id, WARRANTY_REQUEST_STATUS_IN_PROGRESS)
    setError('')
  }

  const statusHint =
    status === '접수 대기'
      ? '품질팀장 검토 후 작성 중으로 변경할 수 있습니다.'
      : status === '작성 중'
        ? '작성 담당자가 품질팀 영역을 작성·저장하면 발행 완료됩니다.'
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
            readOnly={readOnly && !isEditing}
            requestReadOnly={requestReadOnly}
            qualityReadOnly={qualityReadOnly || !canManageQuality}
            showQualitySection={isViewMode}
            qualityLocked={isViewMode && !isEditing && status === WARRANTY_REQUEST_STATUS_PENDING}
          />
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-border bg-bg-tertiary/80 px-5 py-4 sm:px-6">
          {isViewMode && !isEditing ? (
            <>
              <p className="text-sm text-text-muted">{statusHint || '의뢰 내역 조회'}</p>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                {canManageQuality && canPromoteToInProgress(status) && (
                  <button
                    type="button"
                    onClick={handlePromoteToInProgress}
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
                  >
                    작성 중으로 변경
                  </button>
                )}
                {canManageQuality && canStartQualityEdit(status) && (
                  <button
                    type="button"
                    onClick={handleStartQualityEdit}
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#1c1c1c] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2a2a2a]"
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
                    수정하기
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
                  {editScope === 'quality' && !isRequestCompleted(status)
                    ? '저장 (발행 완료)'
                    : '저장'}
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
