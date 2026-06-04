export interface ExternalTestTableFilters {
  purpose: string
  sampleName: string
  colorName: string
  workshop: string
  productionDate: string
  itemCode: string
  itemName: string
  resin: string
  requestDate: string
  receiptDate: string
  completionDate: string
  status: string
  institution: string
  notes: string
}

export const emptyExternalTestTableFilters: ExternalTestTableFilters = {
  purpose: '',
  sampleName: '',
  colorName: '',
  workshop: '',
  productionDate: '',
  itemCode: '',
  itemName: '',
  resin: '',
  requestDate: '',
  receiptDate: '',
  completionDate: '',
  status: '',
  institution: '',
  notes: '',
}

export function hasActiveExternalTestFilters(filters: ExternalTestTableFilters): boolean {
  return Object.values(filters).some((value) => value.trim() !== '')
}

interface ExternalTestTableFilterRowProps {
  filters: ExternalTestTableFilters
  onChange: (filters: ExternalTestTableFilters) => void
  showActionColumn?: boolean
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

type FilterField = keyof ExternalTestTableFilters

const filterCells: { field: FilterField; placeholder: string; className?: string }[] = [
  { field: 'purpose', placeholder: '용도', className: 'min-w-[220px]' },
  { field: 'sampleName', placeholder: '규격명', className: 'min-w-[100px]' },
  { field: 'colorName', placeholder: '색상명', className: 'min-w-[90px]' },
  { field: 'workshop', placeholder: '작업장', className: 'min-w-[72px]' },
  { field: 'productionDate', placeholder: '생산일자', className: 'min-w-[108px] whitespace-nowrap' },
  { field: 'itemCode', placeholder: '품목코드', className: 'min-w-[88px]' },
  { field: 'itemName', placeholder: '품목명', className: 'min-w-[300px]' },
  { field: 'resin', placeholder: '수지', className: 'min-w-[72px]' },
  { field: 'requestDate', placeholder: '의뢰날짜', className: 'min-w-[108px] whitespace-nowrap' },
  { field: 'receiptDate', placeholder: '접수일자', className: 'min-w-[108px] whitespace-nowrap' },
  { field: 'completionDate', placeholder: '완료일자', className: 'min-w-[108px] whitespace-nowrap' },
  { field: 'status', placeholder: '진행여부', className: 'min-w-[72px]' },
  { field: 'institution', placeholder: '의뢰기관', className: 'min-w-[88px]' },
  { field: 'notes', placeholder: '비고', className: 'min-w-[240px]' },
]

export function ExternalTestTableFilterRow({
  filters,
  onChange,
  showActionColumn = false,
}: ExternalTestTableFilterRowProps) {
  const patch = (field: FilterField, value: string) => onChange({ ...filters, [field]: value })

  return (
    <tr className="border-b-2 border-accent/30">
      {showActionColumn && <td className={`${filterTd} w-11`} />}
      <td className={`${filterTd} whitespace-nowrap`} />
      {filterCells.map(({ field, placeholder, className = '' }) => (
        <td key={field} className={`${filterTd} ${className}`}>
          <FilterInput
            value={filters[field]}
            placeholder={placeholder}
            onChange={(value) => patch(field, value)}
          />
        </td>
      ))}
    </tr>
  )
}
