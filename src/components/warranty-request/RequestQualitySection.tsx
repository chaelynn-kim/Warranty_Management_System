import { useRef, useState, useEffect, type ReactNode } from 'react'
import { Check, ChevronDown, CloudUpload, Loader2, Paperclip, ShieldCheck, X } from 'lucide-react'
import {
  WARRANTY_REQUEST_STATUS_COMPLETED,
  WARRANTY_REQUEST_STATUS_DENIED,
  WARRANTY_REQUEST_STATUS_RECEIVED,
} from '../../constants/warrantyRequestStatus'
import { getQualityStatusOptions, normalizeRequestStatus } from '../../utils/warrantyRequestStatus'
import { RequestStatusBadge } from './RequestStatusBadge'
import { LanguageAttachmentLabel } from './LanguageFlagIcon'
import { CompanyWarrantyPreview } from './CompanyWarrantyPreview'
import { WarrantyCertificateSection } from './WarrantyCertificateSection'
import {
  buildCompanyWarrantyLookupKey,
  lookupCompanyWarrantyTerms,
  parseCompanyWarrantyTerms,
  serializeCompanyWarrantyTerms,
  updateCompanyWarrantyProductField,
  type CompanyWarrantyEditableField,
} from '../../utils/companyWarrantyTerms'
import { DatePicker } from '../ui/DatePicker'
import { FormSectionHeader } from './FormSectionHeader'
import {
  deleteStorageAttachment,
  REQUEST_MAX_ATTACHMENT_BYTES,
  uploadRequestAttachmentFiles,
  type RequestAttachmentSlot,
} from '../../lib/storageAttachments'
import {
  downloadFileAttachment,
  formatFileSize,
  MAX_ATTACHMENT_COUNT,
  mergeFileAttachments,
  parseFileAttachments,
  removeFileAttachmentWithStorage,
  serializeFileAttachments,
} from '../../utils/warrantyAttachments'
import { formatDisplayDate } from '../../utils/helpers'

const REQUEST_ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const REQUEST_ALLOWED_EXT = /\.(pdf|jpe?g|png)$/i
const MAX_ATTACHMENT_LABEL_MB = Math.round(REQUEST_MAX_ATTACHMENT_BYTES / (1024 * 1024))

const fieldLabel = 'mb-1.5 block text-sm font-medium text-text-secondary'
const qualityFieldBorderBase = 'border border-border'
const qualityFieldBorderInteractive =
  'transition-colors hover:border-fuchsia-400 focus:border-fuchsia-400'
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
  'hover:border-fuchsia-400',
  'focus:border-fuchsia-400',
].join(' ')

function FormField({
  label,
  required,
  optional,
  optionalLabel = '선택',
  children,
}: {
  label: ReactNode
  required?: boolean
  optional?: boolean
  optionalLabel?: string
  children: ReactNode
}) {
  return (
    <div>
      <label className={fieldLabel}>
        {label}
        {required && <span className="ml-0.5 text-required">*</span>}
        {optional && <span className="ml-1 text-xs text-text-muted">({optionalLabel})</span>}
      </label>
      {children}
    </div>
  )
}

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

interface RequestFileAttachmentFieldProps {
  value: string
  recordId: string
  slot: RequestAttachmentSlot
  /** false이면 업로드·삭제 불가 (다운로드는 가능) */
  readOnly?: boolean
  singleFile?: boolean
  onChange: (value: string) => void
}

function RequestFileAttachmentField({
  value,
  recordId,
  slot,
  readOnly = false,
  singleFile = false,
  onChange,
}: RequestFileAttachmentFieldProps) {
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
      if (singleFile) {
        const existing = files[0]
        if (existing?.storagePath) {
          await deleteStorageAttachment(existing.storagePath)
        }
      }

      const { attachments, errors: uploadErrors } = await uploadRequestAttachmentFiles(
        picked,
        recordId,
        slot
      )
      const errors = [...uploadErrors]

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
            className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              isDragging
                ? 'border-fuchsia-400 bg-fuchsia-400/10'
                : 'border-border bg-bg-primary/30 hover:border-fuchsia-400 hover:bg-bg-primary/50'
            }`}
          >
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-fuchsia-400" />
            ) : (
              <CloudUpload className="h-8 w-8 text-text-muted" />
            )}
            <div>
              <p className="text-sm font-medium text-text-primary">
                {isUploading ? '업로드 중…' : 'PDF / JPG / PNG 업로드'}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                파일당 최대 {MAX_ATTACHMENT_LABEL_MB}MB · 슬롯당 최대 {MAX_ATTACHMENT_COUNT}개
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
              className={`flex items-start gap-3 rounded-lg border border-border bg-bg-primary/40 px-3 py-2.5`}
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

function QualityStatusSelect({
  value,
  options,
  onChange,
}: {
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selectOption = (option: string) => {
    if (value !== option) {
      onChange(option)
    }
    setOpen(false)
  }

  return (
    <div
      ref={ref}
      className="relative"
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node)) {
          setOpen(false)
        }
      }}
    >
      <button
        type="button"
        onClick={() => options.length > 1 && setOpen((prev) => !prev)}
        disabled={options.length <= 1}
        className={`${fieldInput} flex items-center justify-between pr-3 text-left disabled:cursor-default`}
        aria-label="상태 변경"
        aria-expanded={open}
      >
        <RequestStatusBadge status={value} className="border-0 bg-transparent px-0 py-0" />
        {options.length > 1 && (
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {open && options.length > 1 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-bg-secondary shadow-lg">
          {options.map((option) => {
            const checked = value === option
            return (
              <button
                key={option}
                type="button"
                onClick={() => selectOption(option)}
                className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-bg-tertiary ${
                  checked ? 'bg-bg-tertiary' : ''
                }`}
              >
                <span
                  className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    checked ? 'border-fuchsia-400 bg-fuchsia-400/20' : 'border-border'
                  }`}
                >
                  {checked && <Check className="h-3 w-3 text-fuchsia-400" strokeWidth={3} />}
                </span>
                <RequestStatusBadge status={option} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface RequestQualitySectionProps {
  recordId: string
  companyWarrantyAttachmentKo: string
  companyWarrantyAttachmentEn: string
  supplierWarrantyAttachmentKo: string
  supplierWarrantyAttachmentEn: string
  issueDate: string
  qualityAuthor: string
  totalCoatingThickness: string
  primerThickness: string
  productItem: string
  resin: string
  resinCustom: string
  colorName: string
  region: string
  coatingStructure: string
  detailRegionLabel: string
  companyWarrantyTerms: string
  companyWarrantyTermsLookupKey: string
  reviewResult: string
  recordStatus?: string
  qualityTargetStatus?: string
  canChangeQualityStatus?: boolean
  readOnly?: boolean
  canEditAttachments?: boolean
  locked?: boolean
  onCompanyWarrantyAttachmentKoChange: (value: string) => void
  onCompanyWarrantyAttachmentEnChange: (value: string) => void
  onSupplierWarrantyAttachmentKoChange: (value: string) => void
  onSupplierWarrantyAttachmentEnChange: (value: string) => void
  onIssueDateChange: (value: string) => void
  onQualityAuthorChange: (value: string) => void
  onTotalCoatingThicknessChange: (value: string) => void
  onPrimerThicknessChange: (value: string) => void
  onCompanyWarrantyTermsChange: (terms: string, lookupKey: string) => void
  onReviewResultChange: (value: string) => void
  onQualityTargetStatusChange?: (value: string) => void
}

function WarrantyLanguageUploadGroup({
  title,
  recordId,
  koSlot,
  enSlot,
  koValue,
  enValue,
  canEditAttachments = false,
  onKoChange,
  onEnChange,
}: {
  title: string
  recordId: string
  koSlot: RequestAttachmentSlot
  enSlot: RequestAttachmentSlot
  koValue: string
  enValue: string
  canEditAttachments?: boolean
  onKoChange: (value: string) => void
  onEnChange: (value: string) => void
}) {
  const attachmentReadOnly = !canEditAttachments

  return (
    <div className="space-y-3">
      <p className={fieldLabel}>{title}</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label={<LanguageAttachmentLabel language="ko" />}>
          <RequestFileAttachmentField
            value={koValue}
            recordId={recordId}
            slot={koSlot}
            readOnly={attachmentReadOnly}
            onChange={onKoChange}
          />
        </FormField>
        <FormField label={<LanguageAttachmentLabel language="en" />}>
          <RequestFileAttachmentField
            value={enValue}
            recordId={recordId}
            slot={enSlot}
            readOnly={attachmentReadOnly}
            onChange={onEnChange}
          />
        </FormField>
      </div>
    </div>
  )
}

export function RequestQualitySection({
  recordId,
  companyWarrantyAttachmentKo,
  companyWarrantyAttachmentEn,
  supplierWarrantyAttachmentKo,
  supplierWarrantyAttachmentEn,
  issueDate,
  qualityAuthor,
  totalCoatingThickness,
  primerThickness,
  productItem,
  resin,
  resinCustom,
  colorName,
  region,
  coatingStructure,
  detailRegionLabel,
  companyWarrantyTerms,
  companyWarrantyTermsLookupKey,
  reviewResult,
  recordStatus = '',
  qualityTargetStatus = '',
  canChangeQualityStatus = false,
  readOnly = false,
  canEditAttachments = false,
  locked = false,
  onCompanyWarrantyAttachmentKoChange,
  onCompanyWarrantyAttachmentEnChange,
  onSupplierWarrantyAttachmentKoChange,
  onSupplierWarrantyAttachmentEnChange,
  onIssueDateChange,
  onQualityAuthorChange,
  onTotalCoatingThicknessChange,
  onPrimerThicknessChange,
  onCompanyWarrantyTermsChange,
  onReviewResultChange,
  onQualityTargetStatusChange,
}: RequestQualitySectionProps) {
  const normalizedRecordStatus = normalizeRequestStatus(recordStatus)
  const statusOptions = getQualityStatusOptions(recordStatus)
  const showStatusChange =
    normalizedRecordStatus === WARRANTY_REQUEST_STATUS_RECEIVED ||
    normalizedRecordStatus === WARRANTY_REQUEST_STATUS_COMPLETED ||
    normalizedRecordStatus === WARRANTY_REQUEST_STATUS_DENIED
  const displayStatus = qualityTargetStatus || recordStatus
  const lookupKey = buildCompanyWarrantyLookupKey(productItem, resin, region, coatingStructure)
  const warrantyProducts = parseCompanyWarrantyTerms(companyWarrantyTerms)

  useEffect(() => {
    if (readOnly) return
    const current = parseCompanyWarrantyTerms(companyWarrantyTerms)
    if (companyWarrantyTermsLookupKey === lookupKey && current.length > 0) return

    const lookedUp = lookupCompanyWarrantyTerms({
      productItem,
      resin,
      region,
      coatingStructure,
    })
    onCompanyWarrantyTermsChange(serializeCompanyWarrantyTerms(lookedUp), lookupKey)
  }, [
    lookupKey,
    companyWarrantyTermsLookupKey,
    companyWarrantyTerms,
    productItem,
    resin,
    region,
    coatingStructure,
    onCompanyWarrantyTermsChange,
    readOnly,
  ])

  const handleWarrantyFieldChange = (
    productGroup: string,
    field: CompanyWarrantyEditableField,
    value: string
  ) => {
    const next = updateCompanyWarrantyProductField(warrantyProducts, productGroup, field, value)
    onCompanyWarrantyTermsChange(serializeCompanyWarrantyTerms(next), lookupKey)
  }

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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField label="총도막두께" optional optionalLabel="μm">
            {readOnly ? (
              <div className={`${qualityReadOnlyBox} text-text-primary`}>
                {totalCoatingThickness.trim() || '-'}
              </div>
            ) : (
              <input
                type="text"
                value={totalCoatingThickness}
                onChange={(e) => onTotalCoatingThicknessChange(e.target.value)}
                placeholder="총도막두께 입력"
                className={fieldInput}
                aria-label="총도막두께"
              />
            )}
          </FormField>

          <FormField label="프라이머두께" optional optionalLabel="μm">
            {readOnly ? (
              <div className={`${qualityReadOnlyBox} text-text-primary`}>
                {primerThickness.trim() || '-'}
              </div>
            ) : (
              <input
                type="text"
                value={primerThickness}
                onChange={(e) => onPrimerThicknessChange(e.target.value)}
                placeholder="프라이머두께 입력"
                className={fieldInput}
                aria-label="프라이머두께"
              />
            )}
          </FormField>
        </div>

        <FormField label="검토 결과">
          <div className="space-y-4">
            <CompanyWarrantyPreview
              productItem={productItem}
              resin={resin}
              region={region}
              coatingStructure={coatingStructure}
              products={warrantyProducts.length > 0 ? warrantyProducts : undefined}
              editing={!readOnly}
              onProductFieldChange={handleWarrantyFieldChange}
            />
            {readOnly ? (
              <div
                className={`min-h-[80px] whitespace-pre-wrap ${qualityReadOnlyBox} leading-relaxed text-text-primary`}
              >
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
            <WarrantyCertificateSection
              productItem={productItem}
              resin={resin}
              resinCustom={resinCustom}
              colorName={colorName}
              region={region}
              coatingStructure={coatingStructure}
              detailRegionLabel={detailRegionLabel}
              issueDate={issueDate}
              totalCoatingThickness={totalCoatingThickness}
              primerThickness={primerThickness}
              companyWarrantyTerms={companyWarrantyTerms}
            />
          </div>
        </FormField>

        <WarrantyLanguageUploadGroup
          title="당사 Warranty"
          recordId={recordId}
          koSlot="company-ko"
          enSlot="company-en"
          koValue={companyWarrantyAttachmentKo}
          enValue={companyWarrantyAttachmentEn}
          canEditAttachments={canEditAttachments}
          onKoChange={onCompanyWarrantyAttachmentKoChange}
          onEnChange={onCompanyWarrantyAttachmentEnChange}
        />

        <WarrantyLanguageUploadGroup
          title="도료사 Warranty"
          recordId={recordId}
          koSlot="supplier-ko"
          enSlot="supplier-en"
          koValue={supplierWarrantyAttachmentKo}
          enValue={supplierWarrantyAttachmentEn}
          canEditAttachments={canEditAttachments}
          onKoChange={onSupplierWarrantyAttachmentKoChange}
          onEnChange={onSupplierWarrantyAttachmentEnChange}
        />

        {showStatusChange && (
          <FormField label="상태 변경">
            {readOnly || !canChangeQualityStatus ? (
              <div className="flex items-center">
                <RequestStatusBadge status={readOnly ? recordStatus : displayStatus} />
              </div>
            ) : (
              <div className="space-y-2">
                <QualityStatusSelect
                  value={displayStatus}
                  options={statusOptions}
                  onChange={(value) => onQualityTargetStatusChange?.(value)}
                />
                {normalizedRecordStatus === WARRANTY_REQUEST_STATUS_RECEIVED && (
                  <p className="text-xs text-text-muted">
                    <span className="text-text-secondary">접수</span> 상태에서{' '}
                    <span className="text-text-secondary">발행 완료</span> 또는{' '}
                    <span className="text-red-300">보증 불가</span>로 변경 후 저장할 수 있습니다.
                    발행 완료로 변경 시 요청자에게 알림이 발송됩니다.
                  </p>
                )}
                {(normalizedRecordStatus === WARRANTY_REQUEST_STATUS_COMPLETED ||
                  normalizedRecordStatus === WARRANTY_REQUEST_STATUS_DENIED) && (
                  <p className="text-xs text-text-muted">
                    품질경영팀 담당자만 상태를 변경할 수 있습니다.{' '}
                    <span className="text-text-secondary">접수</span>·
                    <span className="text-text-secondary">승인 대기</span>로 되돌릴 수 있습니다.
                  </p>
                )}
              </div>
            )}
          </FormField>
        )}
      </div>
    </section>
  )
}
