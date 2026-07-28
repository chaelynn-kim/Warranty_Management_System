import { useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { PageHeader } from '../components/layout/PageHeader'
import { NeonTitleIcon } from '../components/ui/NeonTitleIcon'
import {
  WarrantyIssuanceRequestForm,
  type WarrantyIssuanceRequestFormHandle,
  warrantyRequestToolbarResetButtonClass,
  warrantyRequestToolbarSubmitButtonClass,
} from '../components/warranty-request/WarrantyIssuanceRequestForm'
import { useAuth } from '../contexts/AuthContext'
import { sendWarrantyRequestPendingEmail, formatEmailJsError } from '../utils/emailNotification'
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
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormComplete, setIsFormComplete] = useState(false)

  const handleReset = () => {
    formRef.current?.reset()
  }

  const handleSubmitClick = () => {
    if (!formRef.current) {
      window.alert('폼을 불러올 수 없습니다.')
      return
    }

    const validationError = formRef.current.validate()
    if (validationError) {
      window.alert(validationError)
      return
    }

    setConfirmOpen(true)
  }

  const handleConfirmSubmit = async () => {
    if (!formRef.current || isSubmitting) {
      window.alert('폼을 불러올 수 없습니다.')
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
      window.alert('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      setConfirmOpen(false)
      setIsSubmitting(false)
      return
    }

    try {
      const mailResult = await sendWarrantyRequestPendingEmail(request, {
        requesterEmail: user?.email ?? undefined,
      })
      window.alert(
        `의뢰가 접수되었습니다.\n알림 메일 발송 완료\n수신: ${mailResult.to}` +
          (mailResult.cc ? `\n참조: ${mailResult.cc}` : '')
      )
    } catch (mailError) {
      console.error('[EmailJS] 의뢰 알림 메일 발송 실패', mailError)
      const detail = formatEmailJsError(mailError)
      window.alert(`의뢰는 접수되었으나 알림 메일 발송에 실패했습니다.\n\n${detail}`)
    }

    formRef.current.reset()
    setConfirmOpen(false)
    setIsSubmitting(false)
    onRequestSubmitted?.(newRecord.id)
  }

  return (
    <div>
      <PageHeader
        title="보증서 발행 의뢰"
        iconSrc="/icons/warranty-request-document.png"
        iconMaskScale={120}
        sticky
        description={
          <p>
            보증서 발행을 위해 아래 양식 작성 후{' '}
            <strong className="font-semibold text-accent">[의뢰하기]</strong> 버튼을 클릭해 주세요. 의뢰 시 품질 팀장에게{' '}
            <strong className="font-semibold text-text-primary">승인 요청 메일이 자동 발송</strong>
            됩니다.
          </p>
        }
        
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={handleReset} className={warrantyRequestToolbarResetButtonClass}>
              <RotateCcw className="h-4 w-4 shrink-0" />
              초기화
            </button>
            <button
              type="button"
              onClick={handleSubmitClick}
              className={warrantyRequestToolbarSubmitButtonClass(isFormComplete)}
            >
              <NeonTitleIcon src="/icons/warranty-request-document.png" className="h-5 w-5 shrink-0" />
              의뢰하기
            </button>
          </div>
        }
      />

      <section className="overflow-visible rounded-xl border border-border bg-bg-secondary p-4 sm:p-6">
        <WarrantyIssuanceRequestForm
          ref={formRef}
          showQualitySection={false}
          qualityReadOnly
          onCompleteChange={setIsFormComplete}
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
