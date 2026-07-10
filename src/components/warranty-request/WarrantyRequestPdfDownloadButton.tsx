import { useState } from 'react'
import type { WarrantyIssuanceRequest } from '../../types'

interface WarrantyRequestPdfDownloadButtonProps {
  getRequest: () => WarrantyIssuanceRequest
  sequenceNo?: number
}

export function WarrantyRequestPdfDownloadButton({
  getRequest,
  sequenceNo,
}: WarrantyRequestPdfDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  const handleDownload = async () => {
    if (downloading) return
    setDownloading(true)
    setError('')
    try {
      const { downloadWarrantyRequestPdf } = await import(
        '../../utils/warrantyRequestPdf/downloadWarrantyRequestPdf'
      )
      await downloadWarrantyRequestPdf(getRequest(), { sequenceNo })
    } catch (downloadError) {
      const message =
        downloadError instanceof Error ? downloadError.message : 'PDF 저장에 실패했습니다.'
      setError(message)
      window.setTimeout(() => setError(''), 4000)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        title="의뢰 내용 PDF로 저장"
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-bg-primary px-3 text-xs font-medium text-text-primary transition-colors hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-60 sm:text-sm"
      >
        <span aria-hidden>📥</span>
        <span>{downloading ? 'PDF 생성 중…' : '보증 발행 의뢰서'}</span>
      </button>
      {error && (
        <p className="max-w-[12rem] text-right text-[11px] text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
