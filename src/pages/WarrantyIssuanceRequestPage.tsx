import { useRef, useState } from 'react'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { PageHeader } from '../components/layout/PageHeader'
import { NeonTitleIcon } from '../components/ui/NeonTitleIcon'
import {
  WarrantyIssuanceRequestForm,
  type WarrantyIssuanceRequestFormHandle,
  warrantyRequestToolbarSubmitButtonClass,
} from '../components/warranty-request/WarrantyIssuanceRequestForm'
import { periodCardLabelClass, periodCardTitleHeadingClass } from '../components/warranty-period/periodTheme'
import { useAuth } from '../contexts/AuthContext'
import { sendWarrantyRequestPendingEmail } from '../utils/emailNotification'
import { createRequestRecord } from '../utils/warrantyRequestStorage'
import {
  getWarrantyRequestRecords,
  persistWarrantyRequestRecords,
} from '../utils/warrantyRequestRecordsCache'

interface WarrantyIssuanceRequestPageProps {
  onRequestSubmitted?: (recordId: string) => void
}

export function WarrantyIssuanceRequestPage({ onRequestSubmitted }: WarrantyIssuanceRequestPageProps) {
  const { user } = useAuth()
  const formRef = useRef<WarrantyIssuanceRequestFormHandle>(null)
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitClick = () => {
    if (!formRef.current) {
      setError('폼을 불러올 수 없습니다.')
      return
    }

    const validationError = formRef.current.validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setConfirmOpen(true)
  }

  const handleConfirmSubmit = async () => {
    if (!formRef.current || isSubmitting) {
      setError('폼을 불러올 수 없습니다.')
      setConfirmOpen(false)
      return
    }

    const request = formRef.current.getValue()
    const existingRecords = getWarrantyRequestRecords()
    const newRecord = createRequestRecord(request, existingRecords, {
      requesterEmail: user?.email ?? undefined,
    })
    const nextRecords = [newRecord, ...existingRecords]

    setIsSubmitting(true)

    try {
      persistWarrantyRequestRecords(nextRecords)
    } catch {
      setError('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      setConfirmOpen(false)
      setIsSubmitting(false)
      return
    }

    try {
      await sendWarrantyRequestPendingEmail(request, {
        requesterEmail: user?.email ?? undefined,
      })
    } catch (mailError) {
      console.error('[EmailJS] 의뢰 알림 메일 발송 실패', mailError)
      setError('의뢰는 접수되었으나 알림 메일 발송에 실패했습니다. 관리자에게 문의해 주세요.')
    }

    formRef.current.reset()
    setConfirmOpen(false)
    setIsSubmitting(false)
    onRequestSubmitted?.(newRecord.id)
  }

  return (
    <div>
      <PageHeader
        subtitle="WARRANTY REQUEST"
        title="보증서 발행 의뢰"
        description="보증서 발행을 위해 아래 양식 작성 후 [의뢰하기] 버튼을 클릭해 주세요."
      />

      <section className="rounded-xl border border-border bg-bg-secondary p-4 sm:p-6">
        <WarrantyIssuanceRequestForm
          ref={formRef}
          showReset
          showQualitySection={false}
          qualityReadOnly
          toolbarLabel={<p className={periodCardLabelClass}>WARRANTY REQUEST FORM</p>}
          toolbarTitle={<h2 className={periodCardTitleHeadingClass}>보증서 발행 의뢰서</h2>}
          toolbarNotice={
            error ? (
              <p className="text-sm font-medium text-red-400" role="alert" aria-live="polite">
                {error}
              </p>
            ) : null
          }
          actionSlot={({ isComplete }) => (
            <button
              type="button"
              onClick={handleSubmitClick}
              className={warrantyRequestToolbarSubmitButtonClass(isComplete)}
            >
              <NeonTitleIcon
                src="/icons/warranty-request-document.png"
                className="h-4 w-4 shrink-0"
              />
              의뢰하기
            </button>
          )}
        />
      </section>

      <ConfirmDialog
        open={confirmOpen}
        message="의뢰 하시겠습니까?"
        confirming={isSubmitting}
        onCancel={() => {
          if (isSubmitting) return
          setConfirmOpen(false)
        }}
        onConfirm={() => void handleConfirmSubmit()}
      />
    </div>
  )
}
