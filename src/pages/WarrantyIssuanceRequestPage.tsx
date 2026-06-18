import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown, RotateCcw } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { DatePicker } from '../components/ui/DatePicker'
import { CompanyWarrantyPreview } from '../components/warranty-request/CompanyWarrantyPreview'
import { PageHeader } from '../components/layout/PageHeader'
import { joinMultiValue, parseMultiValue } from '../constants/warrantyOptions'
import {
  WARRANTY_REQUEST_COATING_STRUCTURES,
  WARRANTY_REQUEST_DETAIL_REGION_CUSTOM,
  WARRANTY_REQUEST_LANGUAGES,
  WARRANTY_REQUEST_MATERIALS,
  WARRANTY_REQUEST_PRODUCT_ITEMS,
  WARRANTY_REQUEST_REGIONS,
  WARRANTY_REQUEST_RESIN_ALL,
  WARRANTY_REQUEST_RESINS,
  WARRANTY_REQUEST_TEAM_OTHER,
  WARRANTY_REQUEST_TEAMS,
  WARRANTY_TERM_COMPANY,
  WARRANTY_TERM_OPTIONS,
  WARRANTY_TERM_OTHER,
  detailRegionsForArea,
} from '../constants/warrantyRequestOptions'
import type { WarrantyIssuanceRequest } from '../types'

const fieldLabel = 'mb-1.5 block text-sm font-medium text-text-secondary'
const fieldInput =
  'w-full rounded-lg border border-border bg-bg-primary/50 px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-accent'
const fieldSelect = `${fieldInput} cursor-pointer appearance-none`

function todayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function emptyRequest(): WarrantyIssuanceRequest {
  return {
    requestDate: todayInputValue(),
    requestTeam: '',
    requestTeamCustom: '',
    requesterName: '',
    colorName: '',
    resin: '',
    material: '',
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
  }
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
        {required && <span className="ml-1 text-accent">*</span>}
      </label>
      {children}
    </div>
  )
}

function FormSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="border-b border-border pb-8 last:border-b-0 last:pb-0">
      <div className="mb-5 border-b border-border/60 pb-3">
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function SelectField({
  value,
  onChange,
  placeholder,
  options,
  disabled = false,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  options: readonly string[]
  disabled?: boolean
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`${fieldSelect} pr-8 disabled:cursor-not-allowed disabled:opacity-50 ${
          value ? 'text-text-primary' : 'text-text-muted'
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-text-muted" />
    </div>
  )
}

function ResinMultiSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = parseMultiValue(value)
  const isEmpty = selected.length === 0
  const isAll = selected.includes(WARRANTY_REQUEST_RESIN_ALL)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const buttonLabel = useMemo(() => {
    if (isEmpty) return '수지 선택'
    if (isAll) return WARRANTY_REQUEST_RESIN_ALL
    if (selected.length === 1) return selected[0]
    return `${selected[0]} 외 ${selected.length - 1}건`
  }, [isAll, isEmpty, selected])

  const setSelected = (next: string[]) => {
    onChange(joinMultiValue(next))
  }

  const selectAll = () => setSelected([WARRANTY_REQUEST_RESIN_ALL])

  const toggleResin = (resin: string) => {
    const current = selected.filter((item) => item !== WARRANTY_REQUEST_RESIN_ALL)
    setSelected(
      current.includes(resin)
        ? current.filter((item) => item !== resin)
        : [...current, resin]
    )
  }

  return (
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
        <div className="absolute top-full z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-bg-secondary py-1 shadow-xl">
          <button
            type="button"
            onClick={selectAll}
            className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-bg-tertiary ${
              isAll ? 'font-semibold text-accent' : 'text-text-primary'
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                isAll ? 'border-accent bg-accent text-white' : 'border-border bg-bg-primary/50'
              }`}
            >
              {isAll && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            {WARRANTY_REQUEST_RESIN_ALL}
          </button>
          {WARRANTY_REQUEST_RESINS.map((resin) => {
            const checked = !isAll && selected.includes(resin)
            return (
              <button
                key={resin}
                type="button"
                onClick={() => toggleResin(resin)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-bg-tertiary ${
                  checked ? 'font-medium text-accent' : 'text-text-primary'
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    checked ? 'border-accent bg-accent text-white' : 'border-border bg-bg-primary/50'
                  }`}
                >
                  {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                {resin}
              </button>
            )
          })}
        </div>
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
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const options = useMemo(() => detailRegionsForArea(region), [region])
  const selected = parseMultiValue(value)
  const isEmpty = selected.length === 0
  const showCustomInput = selected.includes(WARRANTY_REQUEST_DETAIL_REGION_CUSTOM)
  const listedSelected = selected.filter((item) => item !== WARRANTY_REQUEST_DETAIL_REGION_CUSTOM)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const buttonLabel = useMemo(() => {
    if (!region) return '국가를 먼저 선택하세요'
    if (isEmpty) return '국가 선택'
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
        setSelected([...selected, option])
      }
      return
    }

    setSelected(
      selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option]
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
          <div className="absolute top-full z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-bg-secondary py-1 shadow-xl">
            {options.map((option) => {
              const checked = selected.includes(option)
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleOption(option)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-bg-tertiary ${
                    checked ? 'font-medium text-accent' : 'text-text-primary'
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      checked ? 'border-accent bg-accent text-white' : 'border-border bg-bg-primary/50'
                    }`}
                  >
                    {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  {option}
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => toggleOption(WARRANTY_REQUEST_DETAIL_REGION_CUSTOM)}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-bg-tertiary ${
                showCustomInput ? 'font-medium text-accent' : 'text-text-primary'
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  showCustomInput ? 'border-accent bg-accent text-white' : 'border-border bg-bg-primary/50'
                }`}
              >
                {showCustomInput && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              {WARRANTY_REQUEST_DETAIL_REGION_CUSTOM}
            </button>
          </div>
        )}
      </div>

      {showCustomInput && (
        <input
          type="text"
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder="세부 국가명 직접 입력"
          className={fieldInput}
          aria-label="세부 국가명 직접 입력"
        />
      )}
    </div>
  )
}

function SelectBoxGroup({
  value,
  options,
  onChange,
}: {
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  return (
    <div className="flex min-h-[42px] flex-wrap gap-2">
      {options.map((option) => {
        const selected = value === option
        return (
          <button
            key={option}
            type="button"
            onClick={() => {
              if (selected) return
              onChange(option)
            }}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
              selected
                ? 'cursor-default border-accent bg-accent/15 font-medium text-accent ring-1 ring-accent/40'
                : 'border-border bg-bg-primary/50 text-text-secondary hover:border-accent/50 hover:text-text-primary'
            }`}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

function MultiSelectBoxGroup({
  value,
  options,
  onChange,
}: {
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  const selected = parseMultiValue(value)

  const toggleOption = (option: string) => {
    onChange(
      joinMultiValue(
        selected.includes(option)
          ? selected.filter((item) => item !== option)
          : [...selected, option]
      )
    )
  }

  return (
    <div className="flex min-h-[42px] flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option)
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggleOption(option)}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
              isSelected
                ? 'border-accent bg-accent/15 font-medium text-accent ring-1 ring-accent/40'
                : 'border-border bg-bg-primary/50 text-text-secondary hover:border-accent/50 hover:text-text-primary'
            }`}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

export function WarrantyIssuanceRequestPage() {
  const [form, setForm] = useState<WarrantyIssuanceRequest>(emptyRequest)

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
      if (field === 'warrantyTermMode' && value !== WARRANTY_TERM_OTHER) {
        next.warrantyTermCustom = ''
      }
      return next
    })
  }

  const handleReset = () => setForm(emptyRequest())

  return (
    <div>
      <PageHeader
        title="보증 발행 의뢰"
        description="보증서 발행에 필요한 제품·국가·수요가 정보를 입력하여 의뢰합니다."
      />

      <Card title="보증 발행 의뢰서">
        <div className="mb-8 flex justify-end">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-[38px] items-center gap-2 rounded-lg border border-border bg-bg-tertiary px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            <RotateCcw className="h-4 w-4" />
            초기화
          </button>
        </div>

        <div className="space-y-8">
          <FormSection title="요청자 정보">
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
                  <SelectField
                    value={form.requestTeam}
                    onChange={(value) => patch('requestTeam', value)}
                    placeholder="팀 선택"
                    options={WARRANTY_REQUEST_TEAMS}
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

          <FormSection title="제품 정보">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <FormField label="품목" required>
                  <SelectBoxGroup
                    value={form.productItem}
                    options={WARRANTY_REQUEST_PRODUCT_ITEMS}
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
                  <ResinMultiSelect value={form.resin} onChange={(value) => patch('resin', value)} />
                </FormField>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <FormField label="소재" required>
                  <MultiSelectBoxGroup
                    value={form.material}
                    options={WARRANTY_REQUEST_MATERIALS}
                    onChange={(value) => patch('material', value)}
                  />
                </FormField>

                <FormField label="도장구조" required>
                  <MultiSelectBoxGroup
                    value={form.coatingStructure}
                    options={WARRANTY_REQUEST_COATING_STRUCTURES}
                    onChange={(value) => patch('coatingStructure', value)}
                  />
                </FormField>
              </div>
            </div>
          </FormSection>

          <FormSection title="보증 국가 정보">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField label="국가" required>
                <SelectBoxGroup
                  value={form.region}
                  options={WARRANTY_REQUEST_REGIONS}
                  onChange={(value) => patch('region', value)}
                />
              </FormField>

              <FormField label="세부 국가명" required>
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

          <FormSection title="보증 발행 상세 정보">
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

                <FormField label="발행 목적" required>
                  <input
                    type="text"
                    value={form.usage}
                    onChange={(e) => patch('usage', e.target.value)}
                    placeholder="예 : 수요가 품질보증서 제출용"
                    className={fieldInput}
                  />
                </FormField>
              </div>

              <FormField label="발행 언어" required>
                <MultiSelectBoxGroup
                  value={form.language}
                  options={WARRANTY_REQUEST_LANGUAGES}
                  onChange={(value) => patch('language', value)}
                />
              </FormField>

              <FormField label="요청 보증 연한" required>
                <div className="space-y-3">
                  <SelectBoxGroup
                    value={form.warrantyTermMode}
                    options={WARRANTY_TERM_OPTIONS}
                    onChange={(value) => patch('warrantyTermMode', value)}
                  />
                  {showCompanyWarrantyTerm && (
                    <CompanyWarrantyPreview
                      productItem={form.productItem}
                      resin={form.resin}
                      region={form.region}
                      coatingStructure={form.coatingStructure}
                    />
                  )}
                  {showCustomWarrantyTerm && (
                    <textarea
                      rows={3}
                      value={form.warrantyTermCustom}
                      onChange={(e) => patch('warrantyTermCustom', e.target.value)}
                      placeholder="기타 요청 연한 직접 입력"
                      className={`${fieldInput} min-h-[80px] resize-y leading-relaxed`}
                      aria-label="기타 요청 연한 직접 입력"
                    />
                  )}
                </div>
              </FormField>

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
      </Card>
    </div>
  )
}
