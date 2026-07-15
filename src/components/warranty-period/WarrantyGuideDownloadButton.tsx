import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Download, Loader2, Upload } from 'lucide-react'
import type { WarrantyFileAttachment } from '../../types'
import { filterActionButtonClass } from '../ui/FilterActions'
import { canUploadWarrantyGuide } from '../../utils/authValidation'
import { downloadFileAttachment, formatFileSize } from '../../utils/warrantyAttachments'
import { loadWarrantyGuideFile, replaceWarrantyGuideFile } from '../../utils/warrantyGuideFile'

interface WarrantyGuideDownloadButtonProps {
  userEmail?: string | null
}

export function WarrantyGuideDownloadButton({ userEmail }: WarrantyGuideDownloadButtonProps) {
  const canUpload = canUploadWarrantyGuide(userEmail)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<WarrantyFileAttachment | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    void loadWarrantyGuideFile()
      .then((record) => {
        if (!cancelled) setFile(record.file)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleDownload = async () => {
    if (!file) {
      window.alert('업로드된 Warranty Guide 파일이 없습니다.')
      return
    }

    setBusy(true)
    try {
      await downloadFileAttachment(file)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.'
      window.alert(message)
    } finally {
      setBusy(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0]
    event.target.value = ''
    if (!selected || !canUpload) return

    setBusy(true)
    try {
      const record = await replaceWarrantyGuideFile(selected, file, userEmail ?? undefined)
      setFile(record.file)
      window.alert(`파일이 업로드되었습니다.\n${record.file?.name ?? ''}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : '파일 업로드에 실패했습니다.'
      window.alert(message)
    } finally {
      setBusy(false)
    }
  }

  const downloadButtonClass = `${filterActionButtonClass} border-emerald-800/50 bg-emerald-950/40 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-950/60 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50`

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={loading || busy || !file}
          title={file ? `${file.name} (${formatFileSize(file.size)})` : '업로드된 파일 없음'}
          className={downloadButtonClass}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <Download className="h-4 w-4 shrink-0" />
          )}
          Warranty Guide 다운로드
        </button>

        {canUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(event) => void handleFileChange(event)}
            />
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={loading || busy}
              aria-label="Warranty Guide 파일 업로드"
              title="Warranty Guide 파일 업로드"
              className={`${filterActionButtonClass} border-border bg-bg-tertiary text-text-primary hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 shrink-0" />
              )}
              파일 첨부
            </button>
          </>
        )}
    </div>
  )
}
