import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { Check, ChevronDown, FileText, Globe, Package, RotateCcw, User, type LucideIcon } from 'lucide-react'
import { DatePicker } from '../ui/DatePicker'
import { CompanyWarrantyPreview } from './CompanyWarrantyPreview'
import { FormSectionHeader, type FormSectionAccent } from './FormSectionHeader'
import { RequestQualitySection } from './RequestQualitySection'
import { joinMultiValue, parseMultiValue } from '../../constants/warrantyOptions'
import {
  WARRANTY_REQUEST_COATING_STRUCTURES,
  WARRANTY_REQUEST_DETAIL_REGION_CUSTOM,
  WARRANTY_REQUEST_LANGUAGES,
  WARRANTY_REQUEST_MATERIALS,
  WARRANTY_REQUEST_MATERIAL_OTHER,
  WARRANTY_REQUEST_PAINT_COMPANIES,
  WARRANTY_REQUEST_PRODUCT_ITEMS,
  WARRANTY_REQUEST_REGIONS,
  WARRANTY_REQUEST_RESIN_ALL,
  WARRANTY_REQUEST_RESIN_OTHER,
  WARRANTY_REQUEST_RESINS,
  WARRANTY_REQUEST_TEAM_OTHER,
  WARRANTY_REQUEST_TEAMS,
  WARRANTY_TERM_COMPANY,
  WARRANTY_TERM_OPTIONS,
  WARRANTY_TERM_OTHER,
  detailRegionsForArea,
} from '../../constants/warrantyRequestOptions'
import type { WarrantyIssuanceRequest } from '../../types'
import { defaultRequestDate } from '../../utils/helpers'
import { validateQualityCompletion } from '../../utils/warrantyRequestStatus'
import { periodCardHeaderClass } from '../warranty-period/periodTheme'
import {
  filterActionButtonClass,
  filterResetButtonClass,
  filterSearchButtonClass,
} from '../ui/FilterActions'

const fieldLabel = 'mb-1.5 block text-sm font-medium text-text-secondary'
const fieldInput =
  'w-full rounded-lg border border-border bg-bg-primary/50 px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-accent'
const fieldSelect = `${fieldInput} cursor-pointer appearance-none`

export const warrantyRequestToolbarButtonClass = filterActionButtonClass

export const warrantyRequestToolbarResetButtonClass = filterResetButtonClass

export function warrantyRequestToolbarSubmitButtonClass(isComplete: boolean): string {
  return `${filterSearchButtonClass} ${
    isComplete ? 'shadow-[0_0_16px_rgba(59,130,246,0.55)]' : 'shadow-md shadow-accent/25'
  }`
}

const toolbarStickyClass =
  'sticky top-[4.25rem] z-40 -mx-4 mb-8 space-y-2 rounded-xl border border-border bg-bg-secondary/95 px-4 py-4 shadow-sm backdrop-blur-sm sm:-mx-6 sm:px-6'
const dropdownOptionClass = (active: boolean) =>
  `flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-bg-tertiary ${
    active ? 'font-medium text-accent' : 'text-text-primary'
  }`
const dropdownCheckboxClass = (active: boolean, rounded: 'square' | 'circle' = 'square') =>
  `flex h-4 w-4 shrink-0 items-center justify-center border ${
    rounded === 'circle' ? 'rounded-full' : 'rounded'
  } ${active ? 'border-accent bg-accent text-white' : 'border-border bg-bg-primary/50'}`

function useDropdownOpen() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleMouseDown = (event: MouseEvent) => {
      if (ref.current?.contains(event.target as Node)) return
      setOpen(false)
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open])

  return { open, setOpen, ref }
}

function keepDropdownOpenOnPress(event: ReactMouseEvent) {
  event.preventDefault()
}

const dropdownPanelClass =
  'absolute top-full z-50 mt-1 max-h-64 w-full overflow-y-auto overscroll-contain rounded-lg border border-border bg-bg-secondary py-1 shadow-xl [scrollbar-gutter:stable]'

function DropdownPanel({ children }: { children: ReactNode }) {
  return (
    <div className={dropdownPanelClass} onMouseDown={keepDropdownOpenOnPress}>
      {children}
    </div>
  )
}

function OptionDropdownSingleSelect({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  placeholder: string
  ariaLabel: string
}) {
  const { open, setOpen, ref } = useDropdownOpen()
  const isEmpty = !value

  const selectOption = (option: string) => {
    if (value !== option) {
      onChange(option)
    }
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`${fieldSelect} flex items-center justify-between pr-3 text-left ${
          isEmpty ? 'text-text-muted' : 'text-text-primary'
        }`}
        aria-label={ariaLabel}
        aria-expanded={open}
      >
        <span className="truncate">{isEmpty ? placeholder : value}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <DropdownPanel>
          {options.map((option) => {
            const checked = value === option
            return (
              <button
                key={option}
                type="button"
                onClick={() => selectOption(option)}
                className={dropdownOptionClass(checked)}
              >
                <span className={dropdownCheckboxClass(checked, 'circle')}>
                  {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span className="flex-1">{option}</span>
              </button>
            )
          })}
        </DropdownPanel>
      )}
    </div>
  )
}

function OptionDropdownMultiSelect({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  disabled = false,
  disabledLabel,
  otherOption,
  otherCustomValue = '',
  onOtherCustomChange,
  otherPlaceholder,
}: {
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  placeholder: string
  ariaLabel: string
  disabled?: boolean
  disabledLabel?: string
  otherOption?: string
  otherCustomValue?: string
  onOtherCustomChange?: (value: string) => void
  otherPlaceholder?: string
}) {
  const { open, setOpen, ref } = useDropdownOpen()
  const selected = parseMultiValue(value)
  const isEmpty = selected.length === 0
  const showOtherInput = Boolean(otherOption && selected.includes(otherOption))

  const buttonLabel = useMemo(() => {
    if (disabled && disabledLabel) return disabledLabel
    if (isEmpty) return placeholder
    const labels = otherOption
      ? selected.filter((item) => item !== otherOption)
      : [...selected]
    if (showOtherInput && otherOption) labels.push(otherOption)
    if (labels.length === 0) return placeholder
    if (labels.length === 1) return labels[0]
    return `${labels[0]} 외 ${labels.length - 1}건`
  }, [disabled, disabledLabel, isEmpty, otherOption, placeholder, selected, showOtherInput])

  const toggleOption = (option: string) => {
    if (otherOption && option === otherOption) {
      if (selected.includes(option)) {
        onChange(joinMultiValue(selected.filter((item) => item !== option)))
        onOtherCustomChange?.('')
      } else {
        onChange(joinMultiValue([otherOption]))
      }
      setOpen(false)
      return
    }

    const withoutOther = otherOption
      ? selected.filter((item) => item !== otherOption)
      : selected
    if (otherOption && selected.includes(otherOption)) {
      onOtherCustomChange?.('')
    }

    onChange(
      joinMultiValue(
        withoutOther.includes(option)
          ? withoutOther.filter((item) => item !== option)
          : [...withoutOther, option]
      )
    )
  }

  return (
    <div className="space-y-3">
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen((prev) => !prev)}
          disabled={disabled}
          className={`${fieldSelect} flex items-center justify-between pr-3 text-left disabled:cursor-not-allowed disabled:opacity-50 ${
            isEmpty ? 'text-text-muted' : 'text-text-primary'
          }`}
          aria-label={ariaLabel}
          aria-expanded={open}
        >
          <span className="truncate">{buttonLabel}</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && !disabled && (
          <DropdownPanel>
            {options.map((option) => {
              const checked = selected.includes(option)
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleOption(option)}
                  className={dropdownOptionClass(checked)}
                >
                  <span className={dropdownCheckboxClass(checked)}>
                    {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className="flex-1">{option}</span>
                </button>
              )
            })}
            {otherOption && (
              <button
                type="button"
                onClick={() => toggleOption(otherOption)}
                className={dropdownOptionClass(showOtherInput)}
              >
                <span className={dropdownCheckboxClass(showOtherInput)}>
                  {showOtherInput && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span className="flex-1">{otherOption}</span>
              </button>
            )}
          </DropdownPanel>
        )}
      </div>

      {showOtherInput && onOtherCustomChange && (
        <input
          type="text"
          value={otherCustomValue}
          onChange={(e) => onOtherCustomChange(e.target.value)}
          placeholder={otherPlaceholder ?? '직접 입력'}
          className={fieldInput}
          aria-label={otherPlaceholder ?? '직접 입력'}
        />
      )}
    </div>
  )
}

export function createEmptyWarrantyIssuanceRequest(): WarrantyIssuanceRequest {
  return {
    requestDate: defaultRequestDate(0),
    requestTeam: '',
    requestTeamCustom: '',
    requesterName: '',
    colorName: '',
    resin: '',
    resinCustom: '',
    paintCompany: '',
    material: '',
    materialCustom: '',
    coatingStructure: '',
    productItem: '',
    region: '',
    detailRegion: '',
    detailRegionCustom: '',
    customer: '',
    usage: '',
    language: '',
    warrantyTermMode: '',
    warrantyTermCustom: '',
    additionalRequest: '',
    companyWarrantyAttachmentKo: '',
    companyWarrantyAttachmentEn: '',
    supplierWarrantyAttachmentKo: '',
    supplierWarrantyAttachmentEn: '',
    issueDate: '',
    qualityAuthor: '',
    reviewResult: '',
  }
}

export function validateWarrantyIssuanceRequest(form: WarrantyIssuanceRequest): string | null {
  if (!form.requestDate.trim()) return '요청일자를 입력해 주세요.'
  if (!form.requestTeam.trim()) return '요청팀을 선택해 주세요.'
  if (form.requestTeam === WARRANTY_REQUEST_TEAM_OTHER && !form.requestTeamCustom.trim()) {
    return '요청팀을 입력해 주세요.'
  }
  if (!form.requesterName.trim()) return '요청자명을 입력해 주세요.'
  if (!form.productItem.trim()) return '품목을 선택해 주세요.'
  if (!form.colorName.trim()) return '제품명(색상명)을 입력해 주세요.'
  if (!form.resin.trim()) return '수지를 선택해 주세요.'
  if (
    parseMultiValue(form.resin).includes(WARRANTY_REQUEST_RESIN_OTHER) &&
    !form.resinCustom.trim()
  ) {
    return '수지를 입력해 주세요.'
  }
  if (!form.paintCompany.trim()) return '도료사를 선택해 주세요.'
  if (!form.material.trim()) return '소재를 선택해 주세요.'
  if (
    parseMultiValue(form.material).includes(WARRANTY_REQUEST_MATERIAL_OTHER) &&
    !form.materialCustom.trim()
  ) {
    return '소재를 입력해 주세요.'
  }
  if (!form.coatingStructure.trim()) return '도장구조를 선택해 주세요.'
  if (!form.region.trim()) return '국가를 선택해 주세요.'
  if (!form.customer.trim()) return '수요가명을 입력해 주세요.'
  if (!form.language.trim()) return '발행 언어를 선택해 주세요.'
  if (!form.warrantyTermMode.trim()) return '요청 보증 연한을 선택해 주세요.'
  if (form.warrantyTermMode === WARRANTY_TERM_OTHER && !form.warrantyTermCustom.trim()) {
    return '요청 연한을 입력해 주세요.'
  }
  return null
}

export function isWarrantyIssuanceRequestComplete(form: WarrantyIssuanceRequest): boolean {
  return validateWarrantyIssuanceRequest(form) === null
}

export interface WarrantyIssuanceRequestFormHandle {
  reset: () => void
  setValue: (value: WarrantyIssuanceRequest) => void
  getValue: () => WarrantyIssuanceRequest
  validate: () => string | null
  validateQuality: () => string | null
  isComplete: () => boolean
}

interface WarrantyIssuanceRequestFormProps {
  showReset?: boolean
  toolbarLabel?: ReactNode
  toolbarTitle?: ReactNode
  toolbarNotice?: ReactNode
  actionSlot?: ReactNode | ((context: { isComplete: boolean }) => ReactNode)
  readOnly?: boolean
  requestReadOnly?: boolean
  qualityReadOnly?: boolean
  showQualitySection?: boolean
  qualityLocked?: boolean
  recordId?: string
  onAttachmentPersist?: (request: WarrantyIssuanceRequest) => void
}

function FormField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div>
      <label className={fieldLabel}>
        {label}
        {required && <span className="ml-0.5 text-required">*</span>}
      </label>
      {children}
    </div>
  )
}

function FormSection({
  title,
  icon,
  accent,
  children,
}: {
  title: string
  icon: LucideIcon
  accent: FormSectionAccent
  children: ReactNode
}) {
  return (
    <section className="border-b border-border pb-8 last:border-b-0 last:pb-0">
      <FormSectionHeader title={title} icon={icon} accent={accent} />
      {children}
    </section>
  )
}

function ResinMultiSelect({
  value,
  customValue,
  onChange,
  onCustomChange,
}: {
  value: string
  customValue: string
  onChange: (value: string) => void
  onCustomChange: (value: string) => void
}) {
  const { open, setOpen, ref } = useDropdownOpen()
  const selected = parseMultiValue(value)
  const isEmpty = selected.length === 0
  const isAll = selected.includes(WARRANTY_REQUEST_RESIN_ALL)
  const showOtherInput = selected.includes(WARRANTY_REQUEST_RESIN_OTHER)
  const listedSelected = selected.filter(
    (item) => item !== WARRANTY_REQUEST_RESIN_ALL && item !== WARRANTY_REQUEST_RESIN_OTHER
  )

  const buttonLabel = useMemo(() => {
    if (isEmpty) return '수지 선택'
    if (isAll) return WARRANTY_REQUEST_RESIN_ALL
    const labels = [...listedSelected]
    if (showOtherInput) labels.push(WARRANTY_REQUEST_RESIN_OTHER)
    if (labels.length === 1) return labels[0]
    return `${labels[0]} 외 ${labels.length - 1}건`
  }, [isAll, isEmpty, listedSelected, showOtherInput])

  const setSelected = (next: string[]) => {
    onChange(joinMultiValue(next))
  }

  const selectAll = () => {
    onCustomChange('')
    setSelected([WARRANTY_REQUEST_RESIN_ALL])
  }

  const toggleResin = (resin: string) => {
    const current = selected.filter(
      (item) => item !== WARRANTY_REQUEST_RESIN_ALL && item !== WARRANTY_REQUEST_RESIN_OTHER
    )
    if (showOtherInput) {
      onCustomChange('')
    }
    setSelected(
      current.includes(resin)
        ? current.filter((item) => item !== resin)
        : [...current, resin]
    )
  }

  const toggleOther = () => {
    if (showOtherInput) {
      setSelected(selected.filter((item) => item !== WARRANTY_REQUEST_RESIN_OTHER))
      onCustomChange('')
      setOpen(false)
      return
    }

    setSelected([WARRANTY_REQUEST_RESIN_OTHER])
    setOpen(false)
  }

  return (
    <div className="space-y-3">
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`${fieldSelect} flex items-center justify-between pr-3 text-left ${
            isEmpty ? 'text-text-muted' : 'text-text-primary'
          }`}
          aria-label="수지 선택"
          aria-expanded={open}
        >
          <span className="truncate">{buttonLabel}</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <DropdownPanel>
            <button
              type="button"
              onClick={selectAll}
              className={dropdownOptionClass(isAll)}
            >
              <span className={dropdownCheckboxClass(isAll)}>
                {isAll && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <span className="flex-1">{WARRANTY_REQUEST_RESIN_ALL}</span>
            </button>
            {WARRANTY_REQUEST_RESINS.map((resin) => {
              const checked = !isAll && selected.includes(resin)
              return (
                <button
                  key={resin}
                  type="button"
                  onClick={() => toggleResin(resin)}
                  className={dropdownOptionClass(checked)}
                >
                  <span className={dropdownCheckboxClass(checked)}>
                    {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className="flex-1">{resin}</span>
                </button>
              )
            })}
            <button
              type="button"
              onClick={toggleOther}
              className={dropdownOptionClass(showOtherInput)}
            >
              <span className={dropdownCheckboxClass(showOtherInput)}>
                {showOtherInput && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <span className="flex-1">{WARRANTY_REQUEST_RESIN_OTHER}</span>
            </button>
          </DropdownPanel>
        )}
      </div>

      {showOtherInput && (
        <input
          type="text"
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder="수지 직접 입력"
          className={fieldInput}
          aria-label="수지 직접 입력"
        />
      )}
    </div>
  )
}

function DetailRegionMultiSelect({
  region,
  value,
  customValue,
  onChange,
  onCustomChange,
}: {
  region: string
  value: string
  customValue: string
  onChange: (value: string) => void
  onCustomChange: (value: string) => void
}) {
  const { open, setOpen, ref } = useDropdownOpen()
  const options = useMemo(() => detailRegionsForArea(region), [region])
  const selected = parseMultiValue(value)
  const isEmpty = selected.length === 0
  const showCustomInput = selected.includes(WARRANTY_REQUEST_DETAIL_REGION_CUSTOM)
  const listedSelected = selected.filter((item) => item !== WARRANTY_REQUEST_DETAIL_REGION_CUSTOM)

  const buttonLabel = useMemo(() => {
    if (!region) return '국가를 먼저 선택하세요'
    if (isEmpty) return '세부 국가명 선택'
    const labels = [...listedSelected]
    if (showCustomInput) labels.push(WARRANTY_REQUEST_DETAIL_REGION_CUSTOM)
    if (labels.length === 1) return labels[0]
    return `${labels[0]} 외 ${labels.length - 1}건`
  }, [isEmpty, listedSelected, region, showCustomInput])

  const setSelected = (next: string[]) => {
    onChange(joinMultiValue(next))
  }

  const toggleOption = (option: string) => {
    if (option === WARRANTY_REQUEST_DETAIL_REGION_CUSTOM) {
      if (selected.includes(option)) {
        setSelected(selected.filter((item) => item !== option))
        onCustomChange('')
      } else {
        setSelected([WARRANTY_REQUEST_DETAIL_REGION_CUSTOM])
      }
      setOpen(false)
      return
    }

    const withoutCustom = selected.filter((item) => item !== WARRANTY_REQUEST_DETAIL_REGION_CUSTOM)
    if (selected.includes(WARRANTY_REQUEST_DETAIL_REGION_CUSTOM)) {
      onCustomChange('')
    }

    setSelected(
      withoutCustom.includes(option)
        ? withoutCustom.filter((item) => item !== option)
        : [...withoutCustom, option]
    )
  }

  return (
    <div className="space-y-3">
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => region && setOpen((prev) => !prev)}
          disabled={!region}
          className={`${fieldSelect} flex items-center justify-between pr-3 text-left disabled:cursor-not-allowed disabled:opacity-50 ${
            isEmpty ? 'text-text-muted' : 'text-text-primary'
          }`}
          aria-label="세부 국가명 선택"
          aria-expanded={open}
        >
          <span className="truncate">{buttonLabel}</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && region && (
          <DropdownPanel>
            {options.map((option) => {
              const checked = selected.includes(option)
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleOption(option)}
                  className={dropdownOptionClass(checked)}
                >
                  <span className={dropdownCheckboxClass(checked)}>
                    {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className="flex-1">{option}</span>
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => toggleOption(WARRANTY_REQUEST_DETAIL_REGION_CUSTOM)}
              className={dropdownOptionClass(showCustomInput)}
            >
              <span className={dropdownCheckboxClass(showCustomInput)}>
                {showCustomInput && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <span className="flex-1">{WARRANTY_REQUEST_DETAIL_REGION_CUSTOM}</span>
            </button>
          </DropdownPanel>
        )}
      </div>

      {showCustomInput && (
        <input
          type="text"
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder="세부 국가명 입력"
          className={fieldInput}
          aria-label="세부 국가명 입력"
        />
      )}
    </div>
  )
}

export const WarrantyIssuanceRequestForm = forwardRef<
  WarrantyIssuanceRequestFormHandle,
  WarrantyIssuanceRequestFormProps
>(function WarrantyIssuanceRequestForm(
  {
    showReset = false,
    toolbarLabel,
    toolbarTitle,
    toolbarNotice,
    actionSlot,
    readOnly = false,
    requestReadOnly = false,
    qualityReadOnly = true,
    showQualitySection = true,
    qualityLocked = false,
    recordId,
    onAttachmentPersist,
  },
  ref
) {
  const [form, setForm] = useState<WarrantyIssuanceRequest>(createEmptyWarrantyIssuanceRequest)
  const isRequestReadOnly = readOnly || requestReadOnly
  const isQualityReadOnly = readOnly || qualityReadOnly

  const patchAttachment = (
    field:
      | 'companyWarrantyAttachmentKo'
      | 'companyWarrantyAttachmentEn'
      | 'supplierWarrantyAttachmentKo'
      | 'supplierWarrantyAttachmentEn',
    value: string
  ) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (recordId && onAttachmentPersist && !isQualityReadOnly) {
        onAttachmentPersist(next)
      }
      return next
    })
  }

  useImperativeHandle(
    ref,
    () => ({
      reset: () => setForm(createEmptyWarrantyIssuanceRequest()),
      setValue: (value: WarrantyIssuanceRequest) => setForm(value),
      getValue: () => form,
      validate: () => validateWarrantyIssuanceRequest(form),
      validateQuality: () => validateQualityCompletion(form),
      isComplete: () => isWarrantyIssuanceRequestComplete(form),
    }),
    [form]
  )

  const isRequestComplete = isWarrantyIssuanceRequestComplete(form)

  const showCustomWarrantyTerm = form.warrantyTermMode === WARRANTY_TERM_OTHER
  const showCompanyWarrantyTerm = form.warrantyTermMode === WARRANTY_TERM_COMPANY
  const showCustomRequestTeam = form.requestTeam === WARRANTY_REQUEST_TEAM_OTHER

  const patch = <K extends keyof WarrantyIssuanceRequest>(field: K, value: WarrantyIssuanceRequest[K]) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'requestTeam' && value !== WARRANTY_REQUEST_TEAM_OTHER) {
        next.requestTeamCustom = ''
      }
      if (field === 'region') {
        next.detailRegion = ''
        next.detailRegionCustom = ''
      }
      if (
        field === 'detailRegion' &&
        !parseMultiValue(String(value)).includes(WARRANTY_REQUEST_DETAIL_REGION_CUSTOM)
      ) {
        next.detailRegionCustom = ''
      }
      if (field === 'warrantyTermMode' && value !== WARRANTY_TERM_OTHER) {
        next.warrantyTermCustom = ''
      }
      if (
        field === 'resin' &&
        !parseMultiValue(String(value)).includes(WARRANTY_REQUEST_RESIN_OTHER)
      ) {
        next.resinCustom = ''
      }
      if (
        field === 'material' &&
        !parseMultiValue(String(value)).includes(WARRANTY_REQUEST_MATERIAL_OTHER)
      ) {
        next.materialCustom = ''
      }
      return next
    })
  }

  const handleReset = () => setForm(createEmptyWarrantyIssuanceRequest())

  return (
    <>
      {showReset && !isRequestReadOnly && (
        <div className={toolbarStickyClass}>
          <div className={`${periodCardHeaderClass} mb-0`}>
            {toolbarLabel}
            <div className="flex items-start justify-between gap-3">
              {toolbarTitle}
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className={warrantyRequestToolbarResetButtonClass}
                >
                  <RotateCcw className="h-4 w-4 shrink-0" />
                  초기화
                </button>
                {typeof actionSlot === 'function' ? actionSlot({ isComplete: isRequestComplete }) : actionSlot}
              </div>
            </div>
          </div>
          {toolbarNotice}
        </div>
      )}

      <div className={`space-y-8 ${isRequestReadOnly ? 'pointer-events-none select-none' : ''}`}>
          <FormSection title="요청자 정보" icon={User} accent="blue">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField label="요청일자" required>
                <DatePicker
                  value={form.requestDate}
                  onChange={(value) => patch('requestDate', value)}
                  className="cursor-pointer"
                />
              </FormField>

              <FormField label="요청팀" required>
                <div className="space-y-3">
                  <OptionDropdownSingleSelect
                    value={form.requestTeam}
                    onChange={(value) => patch('requestTeam', value)}
                    options={WARRANTY_REQUEST_TEAMS}
                    placeholder="팀 선택"
                    ariaLabel="요청팀 선택"
                  />
                  {showCustomRequestTeam && (
                    <input
                      type="text"
                      value={form.requestTeamCustom}
                      onChange={(e) => patch('requestTeamCustom', e.target.value)}
                      placeholder="요청팀 직접 입력"
                      className={fieldInput}
                      aria-label="요청팀 직접 입력"
                    />
                  )}
                </div>
              </FormField>

              <FormField label="요청자명" required>
                <input
                  type="text"
                  value={form.requesterName}
                  onChange={(e) => patch('requesterName', e.target.value)}
                  placeholder="요청자 성함"
                  className={fieldInput}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="제품 정보" icon={Package} accent="purple">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <FormField label="품목" required>
                  <OptionDropdownSingleSelect
                    value={form.productItem}
                    options={WARRANTY_REQUEST_PRODUCT_ITEMS}
                    placeholder="품목 선택"
                    ariaLabel="품목 선택"
                    onChange={(value) => patch('productItem', value)}
                  />
                </FormField>

                <FormField label="제품명(색상명)" required>
                  <input
                    type="text"
                    value={form.colorName}
                    onChange={(e) => patch('colorName', e.target.value)}
                    placeholder="색상명 입력"
                    className={fieldInput}
                  />
                </FormField>

                <FormField label="수지" required>
                  <ResinMultiSelect
                    value={form.resin}
                    customValue={form.resinCustom}
                    onChange={(value) => patch('resin', value)}
                    onCustomChange={(value) => patch('resinCustom', value)}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <FormField label="도료사" required>
                  <OptionDropdownMultiSelect
                    value={form.paintCompany}
                    options={WARRANTY_REQUEST_PAINT_COMPANIES}
                    placeholder="도료사 선택"
                    ariaLabel="도료사 선택"
                    onChange={(value) => patch('paintCompany', value)}
                  />
                </FormField>

                <FormField label="소재" required>
                  <OptionDropdownMultiSelect
                    value={form.material}
                    options={WARRANTY_REQUEST_MATERIALS}
                    placeholder="소재 선택"
                    ariaLabel="소재 선택"
                    otherOption={WARRANTY_REQUEST_MATERIAL_OTHER}
                    otherCustomValue={form.materialCustom}
                    otherPlaceholder="소재 직접 입력"
                    onOtherCustomChange={(value) => patch('materialCustom', value)}
                    onChange={(value) => patch('material', value)}
                  />
                </FormField>

                <FormField label="도장구조" required>
                  <OptionDropdownMultiSelect
                    value={form.coatingStructure}
                    options={WARRANTY_REQUEST_COATING_STRUCTURES}
                    placeholder="도장구조 선택"
                    ariaLabel="도장구조 선택"
                    onChange={(value) => patch('coatingStructure', value)}
                  />
                </FormField>
              </div>
            </div>
          </FormSection>

          <FormSection title="보증 국가 정보" icon={Globe} accent="green">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField label="국가" required>
                <OptionDropdownSingleSelect
                  value={form.region}
                  options={WARRANTY_REQUEST_REGIONS}
                  placeholder="국가 선택"
                  ariaLabel="국가 선택"
                  onChange={(value) => patch('region', value)}
                />
              </FormField>

              <FormField label="세부 국가명">
                <DetailRegionMultiSelect
                  region={form.region}
                  value={form.detailRegion}
                  customValue={form.detailRegionCustom}
                  onChange={(value) => patch('detailRegion', value)}
                  onCustomChange={(value) => patch('detailRegionCustom', value)}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="보증 발행 상세 정보" icon={FileText} accent="orange">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <FormField label="수요가명" required>
                  <input
                    type="text"
                    value={form.customer}
                    onChange={(e) => patch('customer', e.target.value)}
                    placeholder="수요가명 입력"
                    className={fieldInput}
                  />
                </FormField>

                <FormField label="발행 목적">
                  <input
                    type="text"
                    value={form.usage}
                    onChange={(e) => patch('usage', e.target.value)}
                    placeholder="예 : 수요가 품질보증서 제출용"
                    className={fieldInput}
                  />
                </FormField>

                <FormField label="발행 언어" required>
                  <OptionDropdownMultiSelect
                    value={form.language}
                    options={WARRANTY_REQUEST_LANGUAGES}
                    placeholder="발행 언어 선택"
                    ariaLabel="발행 언어 선택"
                    onChange={(value) => patch('language', value)}
                  />
                </FormField>

                <FormField label="요청 보증 연한" required>
                  <div className="space-y-3">
                    <OptionDropdownSingleSelect
                      value={form.warrantyTermMode}
                      options={WARRANTY_TERM_OPTIONS}
                      placeholder="요청 보증 연한 선택"
                      ariaLabel="요청 보증 연한 선택"
                      onChange={(value) => patch('warrantyTermMode', value)}
                    />
                    {showCustomWarrantyTerm && (
                      <textarea
                        rows={3}
                        value={form.warrantyTermCustom}
                        onChange={(e) => patch('warrantyTermCustom', e.target.value)}
                        placeholder="요청 연한 직접 입력 (예 : 천공 및 박리 10년 보증 요청)"
                        className={`${fieldInput} min-h-[80px] resize-y leading-relaxed`}
                        aria-label="요청 연한 직접 입력"
                      />
                    )}
                  </div>
                </FormField>
              </div>

              {showCompanyWarrantyTerm && (
                <CompanyWarrantyPreview
                  productItem={form.productItem}
                  resin={form.resin}
                  region={form.region}
                  coatingStructure={form.coatingStructure}
                />
              )}

              <FormField label="추가 요청 사항">
                <textarea
                  rows={3}
                  value={form.additionalRequest}
                  onChange={(e) => patch('additionalRequest', e.target.value)}
                  placeholder="추가 요청 사항 직접 입력"
                  className={`${fieldInput} min-h-[80px] resize-y leading-relaxed`}
                  aria-label="추가 요청 사항 직접 입력"
                />
              </FormField>
            </div>
          </FormSection>
      </div>

      {showQualitySection && recordId && (
        <RequestQualitySection
          recordId={recordId}
          companyWarrantyAttachmentKo={form.companyWarrantyAttachmentKo}
          companyWarrantyAttachmentEn={form.companyWarrantyAttachmentEn}
          supplierWarrantyAttachmentKo={form.supplierWarrantyAttachmentKo}
          supplierWarrantyAttachmentEn={form.supplierWarrantyAttachmentEn}
          issueDate={form.issueDate}
          qualityAuthor={form.qualityAuthor}
          reviewResult={form.reviewResult}
          readOnly={isQualityReadOnly}
          locked={qualityLocked}
          onCompanyWarrantyAttachmentKoChange={(value) =>
            patchAttachment('companyWarrantyAttachmentKo', value)
          }
          onCompanyWarrantyAttachmentEnChange={(value) =>
            patchAttachment('companyWarrantyAttachmentEn', value)
          }
          onSupplierWarrantyAttachmentKoChange={(value) =>
            patchAttachment('supplierWarrantyAttachmentKo', value)
          }
          onSupplierWarrantyAttachmentEnChange={(value) =>
            patchAttachment('supplierWarrantyAttachmentEn', value)
          }
          onIssueDateChange={(value) => patch('issueDate', value)}
          onQualityAuthorChange={(value) => patch('qualityAuthor', value)}
          onReviewResultChange={(value) => patch('reviewResult', value)}
        />
      )}
    </>
  )
})
