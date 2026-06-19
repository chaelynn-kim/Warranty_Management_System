import type { TabId } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import { NeonTitleIcon } from '../ui/NeonTitleIcon'
import { canAccessExternalTestTab } from '../../utils/authValidation'
import { SeahLogo } from './SeahLogo'
import { UserAccountBar } from './UserAccountBar'

interface HeaderProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const tabs: { id: TabId; label: string; iconSrc: string }[] = [
  { id: 'issuanceRequest', label: '보증서 발행 의뢰', iconSrc: '/icons/warranty-request-document.png' },
  { id: 'issuance', label: '보증서 발행 관리', iconSrc: '/icons/external-test-document.png' },
  { id: 'period', label: '보증연한', iconSrc: '/icons/warranty-period-calendar.png' },
  { id: 'externalTest', label: '외부 공인 기관 시험', iconSrc: '/icons/warranty-issuance-management.png' },
]

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const { user } = useAuth()
  const visibleTabs = tabs.filter(
    (tab) => tab.id !== 'externalTest' || canAccessExternalTestTab(user?.email)
  )

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg-primary/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-8">
          <div className="flex shrink-0 items-center">
            <SeahLogo />
          </div>

          <nav className="flex min-w-0 items-center justify-start gap-1 overflow-x-auto sm:gap-2">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`relative inline-flex shrink-0 items-center gap-2 px-2 py-2 text-xs font-medium whitespace-nowrap transition-colors sm:px-3 sm:text-sm ${
                  activeTab === tab.id
                    ? 'text-accent'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <NeonTitleIcon src={tab.iconSrc} className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute right-0 bottom-0 left-0 h-0.5 bg-accent" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="shrink-0">
          <UserAccountBar />
        </div>
      </div>
    </header>
  )
}
