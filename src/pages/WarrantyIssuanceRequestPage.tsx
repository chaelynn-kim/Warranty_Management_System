import { useMemo, useState, type ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/layout/PageHeader'
import {
  WARRANTY_REQUEST_LANGUAGES,
  WARRANTY_REQUEST_MATERIALS,
  WARRANTY_REQUEST_REGIONS,
  WARRANTY_REQUEST_RESINS,
  WARRANTY_TERM_OPTIONS,
  WARRANTY_TERM_OTHER,
  detailRegionsForArea,
} from '../constants/warrantyRequestOptions'
import type { WarrantyIssuanceRequest } from '../types'

const fieldLabel = 'mb-1.5 block text-sm font-medium text-text-secondary'
const fieldInput =
  'w-full rounded-lg border border-border bg-bg-primary/50 px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-accent'
const fieldSelect = `${fieldInput} cursor-pointer appearance-none`

function emptyRequest(): WarrantyIssuanceRequest {
  return {
    colorName: '',
    resin: '',
    material: '',
    region: '',
    detailRegion: '',
    language: '',
    customer: '',
    warrantyTermMode: '',
    warrantyTermCustom: '',
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

function RadioGroup({
  name,
  value,
  options,
  onChange,
}: {
  name: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-4">
      {options.map((option) => (
        <label
          key={option}
          className="inline-flex cursor-pointer items-center gap-2 text-sm text-text-primary"
        >
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
            className="h-4 w-4 border-border bg-bg-primary text-accent focus:ring-accent"
          />
          {option}
        </label>
      ))}
    </div>
  )
}

export function WarrantyIssuanceRequestPage() {
  const [form, setForm] = useState<WarrantyIssuanceRequest>(emptyRequest)

  const detailRegionOptions = useMemo(
    () => detailRegionsForArea(form.region),
    [form.region]
  )

  const showCustomWarrantyTerm = form.warrantyTermMode === WARRANTY_TERM_OTHER

  const patch = <K extends keyof WarrantyIssuanceRequest>(field: K, value: WarrantyIssuanceRequest[K]) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'region') {
        next.detailRegion = ''
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
        subtitle="Warranty Issuance Request"
        title="보증 발행 의뢰"
        description="보증서 발행에 필요한 제품·지역·수요가 정보를 입력하여 의뢰합니다."
      />

      <Card label="REQUEST FORM" title="보증 발행 의뢰서">
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-[38px] items-center gap-2 rounded-lg border border-border bg-bg-tertiary px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            <RotateCcw className="h-4 w-4" />
            초기화
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField label="제품명 (색상명)" required>
            <input
              type="text"
              value={form.colorName}
              onChange={(e) => patch('colorName', e.target.value)}
              placeholder="색상명 입력"
              className={fieldInput}
            />
          </FormField>

          <FormField label="수지" required>
            <select
              value={form.resin}
              onChange={(e) => patch('resin', e.target.value)}
              className={fieldSelect}
            >
              <option value="">선택</option>
              {WARRANTY_REQUEST_RESINS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="소재" required>
            <RadioGroup
              name="material"
              value={form.material}
              options={WARRANTY_REQUEST_MATERIALS}
              onChange={(value) => patch('material', value)}
            />
          </FormField>

          <FormField label="지역" required>
            <RadioGroup
              name="region"
              value={form.region}
              options={WARRANTY_REQUEST_REGIONS}
              onChange={(value) => patch('region', value)}
            />
          </FormField>

          <FormField label="세부 지역명" required>
            <select
              value={form.detailRegion}
              onChange={(e) => patch('detailRegion', e.target.value)}
              disabled={!form.region}
              className={`${fieldSelect} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <option value="">{form.region ? '국가 선택' : '지역을 먼저 선택하세요'}</option>
              {detailRegionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="영문 / 국문" required>
            <RadioGroup
              name="language"
              value={form.language}
              options={WARRANTY_REQUEST_LANGUAGES}
              onChange={(value) => patch('language', value)}
            />
          </FormField>

          <FormField label="수요가명" required>
            <input
              type="text"
              value={form.customer}
              onChange={(e) => patch('customer', e.target.value)}
              placeholder="수요가명 입력"
              className={fieldInput}
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField label="요청 보증 연한" required>
              <div className="space-y-3">
                <RadioGroup
                  name="warrantyTermMode"
                  value={form.warrantyTermMode}
                  options={WARRANTY_TERM_OPTIONS}
                  onChange={(value) => patch('warrantyTermMode', value)}
                />
                {showCustomWarrantyTerm && (
                  <input
                    type="text"
                    value={form.warrantyTermCustom}
                    onChange={(e) => patch('warrantyTermCustom', e.target.value)}
                    placeholder="보증 연한 직접 입력"
                    className={fieldInput}
                    aria-label="보증 연한 직접 입력"
                  />
                )}
              </div>
            </FormField>
          </div>
        </div>
      </Card>
    </div>
  )
}
