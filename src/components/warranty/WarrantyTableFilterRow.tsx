export interface WarrantyTableFilters {
  issueDate: string
  region: string
  customer: string
  colorName: string
  paintCompany: string
  resin: string
  totalThickness: string
  primerThickness: string
  coat: string
  bake: string
  companyPeel: string
  companyFadeRoof: string
  companyFadeWall: string
  companyChalkRoof: string
  companyChalkWall: string
  supplierPeel: string
  supplierFadeRoof: string
  supplierFadeWall: string
  supplierChalkRoof: string
  supplierChalkWall: string
  notes: string
}

export const emptyWarrantyTableFilters: WarrantyTableFilters = {
  issueDate: '',
  region: '',
  customer: '',
  colorName: '',
  paintCompany: '',
  resin: '',
  totalThickness: '',
  primerThickness: '',
  coat: '',
  bake: '',
  companyPeel: '',
  companyFadeRoof: '',
  companyFadeWall: '',
  companyChalkRoof: '',
  companyChalkWall: '',
  supplierPeel: '',
  supplierFadeRoof: '',
  supplierFadeWall: '',
  supplierChalkRoof: '',
  supplierChalkWall: '',
  notes: '',
}

export function hasActiveWarrantyFilters(filters: WarrantyTableFilters): boolean {
  return Object.values(filters).some((value) => value.trim() !== '')
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

type FilterField = keyof WarrantyTableFilters

const filterCells: { field: FilterField; placeholder: string; className?: string }[] = [
  { field: 'issueDate', placeholder: '발행일자', className: 'min-w-[168px] border-r border-border/40' },
  { field: 'region', placeholder: '지역', className: 'min-w-[100px]' },
  { field: 'customer', placeholder: '수요가', className: 'min-w-[90px]' },
  { field: 'colorName', placeholder: '색상명', className: 'min-w-[100px]' },
  { field: 'paintCompany', placeholder: '도료사', className: 'w-[112px] min-w-[112px]' },
  { field: 'resin', placeholder: '수지', className: 'w-[112px] min-w-[112px]' },
  { field: 'totalThickness', placeholder: '총 도막두께', className: 'min-w-[80px]' },
  { field: 'primerThickness', placeholder: '프라이머', className: 'min-w-[64px]' },
  { field: 'coat', placeholder: 'COAT', className: 'w-[48px] min-w-[48px]' },
  { field: 'bake', placeholder: 'BAKE', className: 'w-[48px] min-w-[48px] border-r border-border/40' },
  { field: 'companyPeel', placeholder: '박리', className: 'min-w-[48px]' },
  { field: 'companyFadeRoof', placeholder: '변색(지붕)', className: 'min-w-[88px]' },
  { field: 'companyFadeWall', placeholder: '변색(벽체)', className: 'min-w-[88px]' },
  { field: 'companyChalkRoof', placeholder: '백화(지붕)', className: 'min-w-[88px]' },
  { field: 'companyChalkWall', placeholder: '백화(벽체)', className: 'min-w-[88px] border-r border-border/40' },
  { field: 'supplierPeel', placeholder: '박리', className: 'min-w-[48px]' },
  { field: 'supplierFadeRoof', placeholder: '변색(지붕)', className: 'min-w-[88px]' },
  { field: 'supplierFadeWall', placeholder: '변색(벽체)', className: 'min-w-[88px]' },
  { field: 'supplierChalkRoof', placeholder: '백화(지붕)', className: 'min-w-[88px]' },
  { field: 'supplierChalkWall', placeholder: '백화(벽체)', className: 'min-w-[88px] border-r border-border/40' },
  { field: 'notes', placeholder: '비고', className: 'min-w-[320px]' },
]

export function WarrantyTableFilterRow({ filters, onChange }: WarrantyTableFilterRowProps) {
  const patch = (field: FilterField, value: string) =>
    onChange({ ...filters, [field]: value })

  return (
    <tr className="border-b-2 border-accent/30">
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
