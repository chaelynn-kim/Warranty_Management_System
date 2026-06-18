import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { CountryEntry } from '../../types'
import { periodCardHoverClass, periodInputClass, periodRiskBorderClass } from './periodTheme'

interface CountryGuideGridProps {
  countries: CountryEntry[]
  editing: boolean
  onUpdate: (index: number, field: keyof CountryEntry, value: string) => void
  riskVariant?: 'high' | 'low'
  note?: string
  onNoteChange?: (value: string) => void
}

export function CountryGuideGrid({
  countries,
  editing,
  onUpdate,
  riskVariant,
  note,
  onNoteChange,
}: CountryGuideGridProps) {
  const [search, setSearch] = useState('')

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase()
    return countries
      .map((country, index) => ({ country, index }))
      .filter(({ country }) => {
        if (!query) return true
        const haystack = `${country.region} ${country.countries}`.toLowerCase()
        return haystack.includes(query)
      })
  }, [countries, search])

  return (
    <div
      className={`mb-6 overflow-hidden rounded-lg border-2 bg-bg-secondary/50 p-4 ${periodRiskBorderClass(riskVariant)}`}
    >
      <div className="relative mb-3 max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="국가명, 지역명 검색"
          className={`${periodInputClass} h-9 pl-8 text-left`}
        />
      </div>

      {filteredEntries.length === 0 ? (
        <p className="rounded-lg border border-border bg-bg-tertiary/40 px-4 py-6 text-center text-sm text-text-muted">
          검색 결과가 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filteredEntries.map(({ country, index }) => (
            <div
              key={`${country.region}-${index}`}
              className={`rounded-lg border border-border bg-bg-tertiary/40 px-4 py-3 ${periodCardHoverClass(riskVariant)}`}
            >
              {editing ? (
                <>
                  <input
                    type="text"
                    value={country.region}
                    onChange={(e) => onUpdate(index, 'region', e.target.value)}
                    className={`${periodInputClass} mb-2 text-left font-semibold text-accent`}
                  />
                  <textarea
                    rows={2}
                    value={country.countries}
                    onChange={(e) => onUpdate(index, 'countries', e.target.value)}
                    className={`${periodInputClass} resize-y text-left`}
                  />
                </>
              ) : (
                <>
                  <p className="mb-1 text-sm font-bold text-accent">{country.region}</p>
                  <p className="text-sm leading-relaxed text-text-secondary">{country.countries}</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {note !== undefined && (
        <div className="mt-3 border-t border-border/60 pt-3">
          {editing && onNoteChange ? (
            <textarea
              rows={2}
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              className={`${periodInputClass} resize-y text-left`}
            />
          ) : (
            <p className="text-sm leading-relaxed text-text-secondary italic underline">{note}</p>
          )}
        </div>
      )}
    </div>
  )
}
