import { DateRangePicker, type DateRangeValue } from '../ui/DateRangePicker'

export interface WarrantyTableFilters {
  requestDateRange: DateRangeValue
  requester: string
  region: string
  detailRegion: string
  customer: string
  colorName: string
  paintCompany: string
  resin: string
  additionalRequest: string
  fileAttachment: string
  issueDateRange: DateRangeValue
  reviewResult: string
}

export const emptyWarrantyTableFilters: WarrantyTableFilters = {
  requestDateRange: { from: '', to: '' },
  requester: '',
  region: '',
  detailRegion: '',
  customer: '',
  colorName: '',
  paintCompany: '',
  resin: '',
  additionalRequest: '',
  fileAttachment: '',
  issueDateRange: { from: '', to: '' },
  reviewResult: '',
}

function isDateRangeActive(range: DateRangeValue): boolean {
  return range.from.trim() !== '' || range.to.trim() !== ''
}

export function hasActiveWarrantyFilters(filters: WarrantyTableFilters): boolean {
  if (isDateRangeActive(filters.requestDateRange)) return true
  if (isDateRangeActive(filters.issueDateRange)) return true

  const { requestDateRange, issueDateRange, ...rest } = filters
  void requestDateRange
  void issueDateRange
  return Object.values(rest).some((value) => value.trim() !== '')
}

interface WarrantyTableFilterRowProps {
  filters: WarrantyTableFilters
  onChange: (filters: WarrantyTableFilters) => void
}

const filterTd = 'border-b border-border bg-bg-tertiary/90 px-1 py-1 align-top'
const filterInput =
  'h-8 w-full min-w-0 rounded border border-border bg-bg-primary px-2 text-xs text-text-primary outline-none placeholder:text-text-muted focus:border-accent'

function FilterInput({
  value,
  placeholder,
  onChange,
}: {
  value: string
  placeholder: string
  onChange: (value: string) => void
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={filterInput}
    />
  )
}

type TextFilterField = Exclude<
  keyof WarrantyTableFilters,
  'requestDateRange' | 'issueDateRange'
>

export function WarrantyTableFilterRow({ filters, onChange }: WarrantyTableFilterRowProps) {
  const patch = (field: TextFilterField, value: string) =>
    onChange({ ...filters, [field]: value })

  const textCell = (field: TextFilterField, placeholder: string, className = '') => (
    <td key={field} className={`${filterTd} ${className}`}>
      <FilterInput
        value={filters[field]}
        placeholder={placeholder}
        onChange={(value) => patch(field, value)}
      />
    </td>
  )

  return (
    <tr className="border-b-2 border-accent/30">
      <td className={`${filterTd} min-w-[220px] border-r border-border/40`}>
        <DateRangePicker
          compact
          value={filters.requestDateRange}
          onChange={(requestDateRange) => onChange({ ...filters, requestDateRange })}
        />
      </td>
      {textCell('requester', '요청자', 'min-w-[80px]')}
      {textCell('region', '국가', 'min-w-[100px]')}
      {textCell('detailRegion', '세부국가명', 'min-w-[100px]')}
      {textCell('customer', '수요가명', 'min-w-[90px]')}
      {textCell('colorName', '색상명', 'min-w-[100px]')}
      {textCell('paintCompany', '도료사', 'w-[112px] min-w-[112px]')}
      {textCell('resin', '수지', 'w-[112px] min-w-[112px] border-r border-border/40')}
      {textCell('additionalRequest', '추가 요청 사항', 'min-w-[200px]')}
      {textCell('fileAttachment', '파일첨부', 'min-w-[140px]')}
      <td className={`${filterTd} min-w-[220px]`}>
        <DateRangePicker
          compact
          value={filters.issueDateRange}
          onChange={(issueDateRange) => onChange({ ...filters, issueDateRange })}
        />
      </td>
      {textCell('reviewResult', '검토결과', 'min-w-[100px]')}
    </tr>
  )
}
