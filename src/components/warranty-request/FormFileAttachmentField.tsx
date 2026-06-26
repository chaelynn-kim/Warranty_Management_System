import { useRef, useState } from 'react'
import { Check, CloudUpload, Loader2, Paperclip, X } from 'lucide-react'
import {
  deleteStorageAttachment,
  REQUEST_MAX_ATTACHMENT_BYTES,
  uploadRequestAttachmentFiles,
  type RequestAttachmentSlot,
} from '../../lib/storageAttachments'
import {
  downloadFileAttachment,
  filesToAttachments,
  formatFileSize,
  MAX_ATTACHMENT_COUNT,
  mergeFileAttachments,
  parseFileAttachments,
  removeFileAttachmentWithStorage,
} from '../../utils/warrantyAttachments'

const REQUEST_ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const REQUEST_ALLOWED_EXT = /\.(pdf|jpe?g|png)$/i
const MAX_ATTACHMENT_LABEL_MB = Math.round(REQUEST_MAX_ATTACHMENT_BYTES / (1024 * 1024))

function validateRequestFile(file: File): string | null {
  if (file.size > REQUEST_MAX_ATTACHMENT_BYTES) {
    return `${file.name}: 파일 크기는 ${MAX_ATTACHMENT_LABEL_MB}MB 이하여야 합니다.`
  }
  const typeOk = REQUEST_ALLOWED_TYPES.has(file.type)
  const extOk = REQUEST_ALLOWED_EXT.test(file.name)
  if (!typeOk && !extOk) {
    return `${file.name}: PDF, JPG, PNG 파일만 업로드할 수 있습니다.`
  }
  return null
}

const readOnlyBox = 'rounded-lg border border-border bg-bg-primary/30 px-3 py-2.5 text-sm'
const uploadHoverClass =
  'border-border bg-bg-primary/30 transition-colors hover:border-accent hover:bg-bg-primary/50'
const uploadDragClass = 'border-accent bg-accent/10'

interface FormFileAttachmentFieldProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  recordId?: string
  slot?: RequestAttachmentSlot
}

export function FormFileAttachmentField({
  value,
  onChange,
  readOnly = false,
  recordId,
  slot,
}: FormFileAttachmentFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const files = parseFileAttachments(value)

  const handlePickFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || readOnly || isUploading) return

    setError('')
    const picked = Array.from(fileList)
    const validationErrors = picked.map(validateRequestFile).filter(Boolean) as string[]
    if (validationErrors.length > 0) {
      setError(validationErrors[0])
      return
    }

    setIsUploading(true)

    try {
      let incoming: Awaited<ReturnType<typeof filesToAttachments>>['attachments'] = []
      let uploadErrors: string[] = []

      if (recordId && slot) {
        const result = await uploadRequestAttachmentFiles(picked, recordId, slot)
        incoming = result.attachments
        uploadErrors = result.errors
      } else {
        const result = await filesToAttachments(picked, REQUEST_MAX_ATTACHMENT_BYTES)
        incoming = result.attachments
        uploadErrors = result.errors
      }

      const { value: nextValue, errors: mergeErrors } = mergeFileAttachments(value, incoming)
      const errors = [...uploadErrors, ...mergeErrors]

      if (nextValue !== value) {
        onChange(nextValue)
      }

      if (errors.length > 0) {
        setError(errors[0])
      }
    } catch {
      setError('파일 업로드에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setIsUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const handleRemove = async (fileId: string) => {
    if (readOnly || isUploading) return
    setError('')
    try {
      const nextValue = await removeFileAttachmentWithStorage(value, fileId, deleteStorageAttachment)
      onChange(nextValue)
    } catch {
      setError('파일 삭제에 실패했습니다.')
    }
  }

  if (readOnly && files.length === 0) {
    return <div className={`${readOnlyBox} text-text-muted`}>-</div>
  }

  return (
    <div className="space-y-3">
      {!readOnly && (
        <>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className="hidden"
            disabled={isUploading}
            onChange={(e) => void handlePickFiles(e.target.files)}
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              if (!isUploading) setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              void handlePickFiles(e.dataTransfer.files)
            }}
            className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              isDragging ? uploadDragClass : uploadHoverClass
            }`}
          >
            {isUploading ? (
              <Loader2 className="h-7 w-7 animate-spin text-accent" />
            ) : (
              <CloudUpload className="h-7 w-7 text-text-muted" />
            )}
            <div>
              <p className="text-sm font-medium text-text-primary">
                {isUploading ? '업로드 중…' : '사진·파일 첨부 (PDF / JPG / PNG)'}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                파일당 최대 {MAX_ATTACHMENT_LABEL_MB}MB · 최대 {MAX_ATTACHMENT_COUNT}개
              </p>
            </div>
          </button>
        </>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-bg-primary/40 px-3 py-2.5"
            >
              <Paperclip className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => void downloadFileAttachment(file)}
                  className="w-full break-all text-left text-sm leading-snug text-accent hover:underline"
                  title={file.name}
                >
                  {file.name}
                </button>
                <p className="text-xs text-text-muted">
                  {formatFileSize(file.size)}
                  {readOnly ? ' · 다운로드' : ' · 업로드 완료'}
                </p>
              </div>
              {readOnly ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
              ) : (
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => void handleRemove(file.id)}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-text-muted transition-colors hover:bg-red-500/15 hover:text-red-400 disabled:opacity-50"
                  aria-label={`${file.name} 삭제`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
