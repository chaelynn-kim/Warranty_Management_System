import { useRef, useState, type ReactNode } from 'react'
import { Check, CloudUpload, Paperclip, ShieldCheck, X } from 'lucide-react'
import { DatePicker } from '../ui/DatePicker'
import { FormSectionHeader } from './FormSectionHeader'
import {
  downloadFileAttachment,
  filesToAttachments,
  formatFileSize,
  mergeFileAttachments,
  parseFileAttachments,
  removeFileAttachment,
  serializeFileAttachments,
} from '../../utils/warrantyAttachments'
import { formatDisplayDate } from '../../utils/helpers'

const REQUEST_MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024
const REQUEST_ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const REQUEST_ALLOWED_EXT = /\.(pdf|jpe?g|png)$/i

const fieldLabel = 'mb-1.5 block text-sm font-medium text-text-secondary'
const qualityFieldBorderBase = 'border border-border'
const qualityFieldBorderInteractive =
  'transition-colors hover:border-fuchsia-400 hover:shadow-[0_0_14px_rgba(232,121,249,0.55)] focus:border-fuchsia-400 focus:shadow-[0_0_14px_rgba(232,121,249,0.55)]'
const fieldInput = [
  'w-full rounded-lg bg-bg-primary/50 px-3 py-2.5 text-sm text-text-primary outline-none',
  'placeholder:text-text-muted disabled:cursor-not-allowed disabled:opacity-60',
  qualityFieldBorderBase,
  qualityFieldBorderInteractive,
].join(' ')
const qualityReadOnlyBox =
  'rounded-lg border border-border bg-bg-primary/30 px-3 py-2.5 text-sm'
const qualityDatePickerTrigger = [
  'border border-border',
  'hover:border-fuchsia-400 hover:shadow-[0_0_14px_rgba(232,121,249,0.55)]',
  'focus:border-fuchsia-400 focus:shadow-[0_0_14px_rgba(232,121,249,0.55)]',
].join(' ')

function FormField({
  label,
  required,
  optional,
  children,
}: {
  label: string
  required?: boolean
  optional?: boolean
  children: ReactNode
}) {
  return (
    <div>
      <label className={fieldLabel}>
        {label}
        {required && <span className="ml-0.5 text-required">*</span>}
        {optional && <span className="ml-1 text-xs text-text-muted">(선택)</span>}
      </label>
      {children}
    </div>
  )
}

function validateRequestFile(file: File): string | null {
  if (file.size > REQUEST_MAX_ATTACHMENT_BYTES) {
    return `${file.name}: 파일 크기는 20MB 이하여야 합니다.`
  }
  const typeOk = REQUEST_ALLOWED_TYPES.has(file.type)
  const extOk = REQUEST_ALLOWED_EXT.test(file.name)
  if (!typeOk && !extOk) {
    return `${file.name}: PDF, JPG, PNG 파일만 업로드할 수 있습니다.`
  }
  return null
}

interface RequestFileAttachmentFieldProps {
  value: string
  readOnly?: boolean
  singleFile?: boolean
  onChange: (value: string) => void
}

function RequestFileAttachmentField({
  value,
  readOnly = false,
  singleFile = false,
  onChange,
}: RequestFileAttachmentFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const files = parseFileAttachments(value)

  const handlePickFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || readOnly) return

    setError('')
    const picked = Array.from(fileList)
    const validationErrors = picked.map(validateRequestFile).filter(Boolean) as string[]
    if (validationErrors.length > 0) {
      setError(validationErrors[0])
      return
    }

    const { attachments, errors: readErrors } = await filesToAttachments(picked, REQUEST_MAX_ATTACHMENT_BYTES)
    const errors = [...readErrors]

    if (singleFile) {
      if (attachments.length > 0) {
        onChange(serializeFileAttachments(attachments.slice(0, 1)))
      }
    } else {
      const { value: nextValue, errors: mergeErrors } = mergeFileAttachments(value, attachments)
      errors.push(...mergeErrors)
      if (nextValue !== value) {
        onChange(nextValue)
      }
    }

    if (errors.length > 0) {
      setError(errors[0])
    }

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleRemove = (fileId: string) => {
    if (readOnly) return
    setError('')
    onChange(removeFileAttachment(value, fileId))
  }

  if (readOnly && files.length === 0) {
    return (
      <div className={`${qualityReadOnlyBox} text-text-muted`}>-</div>
    )
  }

  return (
    <div className="space-y-3">
      {!readOnly && (
        <>
          <input
            ref={inputRef}
            type="file"
            multiple={!singleFile}
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className="hidden"
            onChange={(e) => void handlePickFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              void handlePickFiles(e.dataTransfer.files)
            }}
            className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center transition-colors ${
              isDragging
                ? 'border-fuchsia-400 bg-fuchsia-400/10 shadow-[0_0_14px_rgba(232,121,249,0.55)]'
                : `border-border bg-bg-primary/30 hover:border-fuchsia-400 hover:bg-bg-primary/50 hover:shadow-[0_0_14px_rgba(232,121,249,0.55)]`
            }`}
          >
            <CloudUpload className="h-8 w-8 text-text-muted" />
            <div>
              <p className="text-sm font-medium text-text-primary">PDF / JPG / PNG 업로드</p>
              <p className="mt-1 text-xs text-text-muted">최대 20MB</p>
            </div>
          </button>
        </>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className={`flex items-start gap-3 rounded-lg border border-border bg-bg-primary/40 px-3 py-2.5`}
            >
              <Paperclip className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
              <div className="min-w-0 flex-1">
                {readOnly ? (
                  <button
                    type="button"
                    onClick={() => downloadFileAttachment(file)}
                    className="w-full break-all text-left text-sm leading-snug text-accent hover:underline"
                    title={file.name}
                  >
                    {file.name}
                  </button>
                ) : (
                  <p className="break-all text-sm leading-snug text-text-primary" title={file.name}>
                    {file.name}
                  </p>
                )}
                <p className="text-xs text-text-muted">
                  {formatFileSize(file.size)}
                  {readOnly ? '' : ' · 업로드 완료'}
                </p>
              </div>
              {readOnly ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
              ) : (
                <button
                  type="button"
                  onClick={() => handleRemove(file.id)}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-text-muted transition-colors hover:bg-red-500/15 hover:text-red-400"
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

interface RequestQualitySectionProps {
  companyWarrantyAttachmentKo: string
  companyWarrantyAttachmentEn: string
  supplierWarrantyAttachmentKo: string
  supplierWarrantyAttachmentEn: string
  issueDate: string
  qualityAuthor: string
  reviewResult: string
  readOnly?: boolean
  locked?: boolean
  onCompanyWarrantyAttachmentKoChange: (value: string) => void
  onCompanyWarrantyAttachmentEnChange: (value: string) => void
  onSupplierWarrantyAttachmentKoChange: (value: string) => void
  onSupplierWarrantyAttachmentEnChange: (value: string) => void
  onIssueDateChange: (value: string) => void
  onQualityAuthorChange: (value: string) => void
  onReviewResultChange: (value: string) => void
}

function WarrantyLanguageUploadGroup({
  title,
  koValue,
  enValue,
  readOnly,
  onKoChange,
  onEnChange,
}: {
  title: string
  koValue: string
  enValue: string
  readOnly?: boolean
  onKoChange: (value: string) => void
  onEnChange: (value: string) => void
}) {
  return (
    <div className="space-y-3">
      <p className={fieldLabel}>{title}</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="국문">
          <RequestFileAttachmentField
            value={koValue}
            readOnly={readOnly}
            singleFile
            onChange={onKoChange}
          />
        </FormField>
        <FormField label="영문">
          <RequestFileAttachmentField
            value={enValue}
            readOnly={readOnly}
            singleFile
            onChange={onEnChange}
          />
        </FormField>
      </div>
    </div>
  )
}

export function RequestQualitySection({
  companyWarrantyAttachmentKo,
  companyWarrantyAttachmentEn,
  supplierWarrantyAttachmentKo,
  supplierWarrantyAttachmentEn,
  issueDate,
  qualityAuthor,
  reviewResult,
  readOnly = false,
  locked = false,
  onCompanyWarrantyAttachmentKoChange,
  onCompanyWarrantyAttachmentEnChange,
  onSupplierWarrantyAttachmentKoChange,
  onSupplierWarrantyAttachmentEnChange,
  onIssueDateChange,
  onQualityAuthorChange,
  onReviewResultChange,
}: RequestQualitySectionProps) {
  return (
    <section className="border-t border-border pt-8">
      <FormSectionHeader title="품질경영팀 검토 결과" icon={ShieldCheck} accent="pink" />

      {locked && (
        <p className="mb-4 text-xs text-text-muted">
          품질팀장 승인 후 <span className="text-text-secondary">접수</span> 상태가 되면 담당자가 입력할 수
          있습니다.
        </p>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField label="작성자">
            {readOnly ? (
              <div className={`${qualityReadOnlyBox} text-text-primary`}>
                {qualityAuthor.trim() || '-'}
              </div>
            ) : (
              <input
                type="text"
                value={qualityAuthor}
                onChange={(e) => onQualityAuthorChange(e.target.value)}
                placeholder="작성자명 입력"
                className={fieldInput}
                aria-label="작성자"
              />
            )}
          </FormField>

          <FormField label="발행일자">
            {readOnly ? (
              <div className={`${qualityReadOnlyBox} text-text-primary`}>
                {issueDate ? formatDisplayDate(issueDate) : '-'}
              </div>
            ) : (
              <DatePicker
                value={issueDate}
                onChange={onIssueDateChange}
                className="cursor-pointer"
                triggerClassName={qualityDatePickerTrigger}
              />
            )}
          </FormField>
        </div>

        <FormField label="검토 결과">
          {readOnly ? (
            <div className={`min-h-[80px] whitespace-pre-wrap ${qualityReadOnlyBox} leading-relaxed text-text-primary`}>
              {reviewResult.trim() || '-'}
            </div>
          ) : (
            <textarea
              rows={4}
              value={reviewResult}
              onChange={(e) => onReviewResultChange(e.target.value)}
              placeholder="검토 결과 입력"
              className={`${fieldInput} min-h-[100px] resize-y leading-relaxed`}
              aria-label="검토 결과"
            />
          )}
        </FormField>

        <WarrantyLanguageUploadGroup
          title="당사 Warranty"
          koValue={companyWarrantyAttachmentKo}
          enValue={companyWarrantyAttachmentEn}
          readOnly={readOnly}
          onKoChange={onCompanyWarrantyAttachmentKoChange}
          onEnChange={onCompanyWarrantyAttachmentEnChange}
        />

        <WarrantyLanguageUploadGroup
          title="도료사 Warranty"
          koValue={supplierWarrantyAttachmentKo}
          enValue={supplierWarrantyAttachmentEn}
          readOnly={readOnly}
          onKoChange={onSupplierWarrantyAttachmentKoChange}
          onEnChange={onSupplierWarrantyAttachmentEnChange}
        />
      </div>
    </section>
  )
}
