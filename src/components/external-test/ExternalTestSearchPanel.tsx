import { FilterActions, SearchInput } from '../ui/FilterActions'
import type { ExternalTestSearchFilters } from '../../utils/externalTestFilter'

interface ExternalTestSearchPanelProps {
  filters: ExternalTestSearchFilters
  onChange: (filters: ExternalTestSearchFilters) => void
  onSearch: () => void
  onReset: () => void
}

export function ExternalTestSearchPanel({
  filters,
  onChange,
  onSearch,
  onReset,
}: ExternalTestSearchPanelProps) {
  const patch = (field: keyof ExternalTestSearchFilters, value: string) =>
    onChange({ ...filters, [field]: value })

  return (
    <section className="mb-4 rounded-xl border border-border bg-bg-secondary p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={filters.purpose}
          onChange={(value) => patch('purpose', value)}
          onEnter={onSearch}
          placeholder="용도"
        />
        <SearchInput
          value={filters.sampleName}
          onChange={(value) => patch('sampleName', value)}
          onEnter={onSearch}
          placeholder="규격명"
        />
        <SearchInput
          value={filters.institution}
          onChange={(value) => patch('institution', value)}
          onEnter={onSearch}
          placeholder="의뢰기관"
        />
        <SearchInput
          value={filters.other}
          onChange={(value) => patch('other', value)}
          onEnter={onSearch}
          placeholder="색상명, 작업장, 품목명, 날짜, 진행여부, 비고 등"
          className="min-w-[240px] flex-[2] sm:min-w-[320px]"
        />
        <FilterActions onSearch={onSearch} onReset={onReset} />
      </div>
    </section>
  )
}
