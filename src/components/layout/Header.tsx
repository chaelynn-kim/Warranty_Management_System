import type { TabId } from '../../types'
import { SeahLogo } from './SeahLogo'

interface HeaderProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const tabs: { id: TabId; label: string }[] = [
  { id: 'issuanceRequest', label: '보증 발행 의뢰' },
  { id: 'issuance', label: '보증서 발행 관리' },
  { id: 'period', label: '보증연한' },
  { id: 'externalTest', label: '외부 공인 기관 시험' },
]

export function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg-primary/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-8">
          <div className="flex shrink-0 items-center">
            <SeahLogo className="h-7 w-auto" />
          </div>

          <nav className="flex min-w-0 items-center justify-start gap-1 overflow-x-auto sm:gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`relative shrink-0 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors sm:px-5 sm:text-sm ${
                  activeTab === tab.id
                    ? 'text-accent'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute right-0 bottom-0 left-0 h-0.5 bg-accent" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="hidden shrink-0 sm:block">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-tertiary text-sm font-medium text-text-secondary">
            U
          </div>
        </div>
      </div>
    </header>
  )
}
