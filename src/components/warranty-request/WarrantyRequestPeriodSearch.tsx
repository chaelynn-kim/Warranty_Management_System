import { Search } from 'lucide-react'
import { DatePicker } from '../ui/DatePicker'
import { FilterActions } from '../ui/FilterActions'

interface WarrantyRequestPeriodSearchProps {
  from: string
  to: string
  keyword: string
  error?: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  onKeywordChange: (value: string) => void
  onSearch: () => void
  onReset: () => void
}

export function WarrantyRequestPeriodSearch({
  from,
  to,
  keyword,
  error,
  onFromChange,
  onToChange,
  onKeywordChange,
  onSearch,
  onReset,
}: WarrantyRequestPeriodSearchProps) {
  return (
    <section className="mb-4 rounded-xl border border-border bg-bg-secondary p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <span className="shrink-0 text-sm font-medium text-text-secondary">발행일자</span>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="min-w-0 flex-1 sm:w-[148px] sm:flex-none">
            <DatePicker
              variant="input"
              value={from}
              onChange={onFromChange}
              placeholder="YYYY-MM-DD"
            />
          </div>
          <span className="text-sm text-text-muted">~</span>
          <div className="min-w-0 flex-1 sm:w-[148px] sm:flex-none">
            <DatePicker
              variant="input"
              value={to}
              onChange={onToChange}
              placeholder="YYYY-MM-DD"
            />
          </div>
        </div>

        <div className="relative w-full min-w-0 lg:min-w-[240px] lg:flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="요청자, 색상명, 수지, 세부국가명, 수요가명 검색"
            className="w-full rounded-lg border border-border bg-bg-primary/50 py-2.5 pr-3 pl-9 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-accent"
          />
        </div>

        <FilterActions onSearch={onSearch} onReset={onReset} className="w-full sm:w-auto" />
      </div>
      {error && (
        <p className="mt-2 text-sm font-medium text-red-400" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
