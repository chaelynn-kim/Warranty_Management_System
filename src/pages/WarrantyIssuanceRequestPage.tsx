import { useRef, useState } from 'react'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { PageHeader } from '../components/layout/PageHeader'
import { NeonTitleIcon } from '../components/ui/NeonTitleIcon'
import {
  WarrantyIssuanceRequestForm,
  type WarrantyIssuanceRequestFormHandle,
} from '../components/warranty-request/WarrantyIssuanceRequestForm'
import { createRequestRecord } from '../utils/warrantyRequestStorage'
import {
  getWarrantyRequestRecords,
  persistWarrantyRequestRecords,
} from '../utils/warrantyRequestRecordsCache'

interface WarrantyIssuanceRequestPageProps {
  onRequestSubmitted?: (recordId: string) => void
}

export function WarrantyIssuanceRequestPage({ onRequestSubmitted }: WarrantyIssuanceRequestPageProps) {
  const formRef = useRef<WarrantyIssuanceRequestFormHandle>(null)
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

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

  const handleConfirmSubmit = () => {
    if (!formRef.current) {
      setError('폼을 불러올 수 없습니다.')
      setConfirmOpen(false)
      return
    }

    const request = formRef.current.getValue()
    const existingRecords = getWarrantyRequestRecords()
    const newRecord = createRequestRecord(request, existingRecords)
    const nextRecords = [newRecord, ...existingRecords]

    try {
      persistWarrantyRequestRecords(nextRecords)
    } catch {
      setError('저장 용량을 초과했습니다. 첨부 파일 크기를 줄여 주세요.')
      setConfirmOpen(false)
      return
    }

    formRef.current.reset()
    setConfirmOpen(false)
    onRequestSubmitted?.(newRecord.id)
  }

  return (
    <div>
      <PageHeader
        subtitle="WARRANTY REQUEST"
        title="보증서 발행 의뢰"
        description="보증서 발행을 위해 아래 양식을 작성하신 후 [의뢰하기] 버튼을 클릭해 주세요."
      />

      <section className="rounded-xl border border-border bg-bg-secondary p-4 sm:p-6">
        <WarrantyIssuanceRequestForm
          ref={formRef}
          showReset
          showQualitySection={false}
          qualityReadOnly
          toolbarLabel={
            <p className="mb-1 text-[calc(10px+1pt)] font-semibold tracking-wide text-text-muted">
              WARRANTY REQUEST FORM
            </p>
          }
          toolbarTitle={
            <h2 className="min-w-0 text-base font-semibold text-text-primary sm:text-lg">
              보증서 발행 의뢰서
            </h2>
          }
          toolbarNotice={
            error ? (
              <p className="text-sm font-medium text-red-400" role="alert" aria-live="polite">
                {error}
              </p>
            ) : null
          }
          actionSlot={
            <button
              type="button"
              onClick={handleSubmitClick}
              className="inline-flex h-[38px] items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition-colors hover:bg-accent-hover"
            >
              <NeonTitleIcon
                src="/icons/warranty-request-document.png"
                className="h-4 w-4"
              />
              의뢰하기
            </button>
          }
        />
      </section>

      <ConfirmDialog
        open={confirmOpen}
        message="의뢰 하시겠습니까?"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
      />
    </div>
  )
}
