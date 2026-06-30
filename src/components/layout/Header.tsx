import { useEffect, useRef } from 'react'
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

const tabs: {
  id: TabId
  label: string
  shortLabel: string
  iconSrc: string
}[] = [
  {
    id: 'issuanceRequest',
    label: '보증서 발행 의뢰',
    shortLabel: '발행 의뢰',
    iconSrc: '/icons/warranty-request-document.png',
  },
  {
    id: 'issuance',
    label: '보증서 발행 관리',
    shortLabel: '발행 관리',
    iconSrc: '/icons/external-test-document.png',
  },
  {
    id: 'period',
    label: '보증연한',
    shortLabel: '보증연한',
    iconSrc: '/icons/warranty-period-calendar.png',
  },
  {
    id: 'externalTest',
    label: '외부 공인 기관 시험',
    shortLabel: '외부 시험',
    iconSrc: '/icons/warranty-issuance-management.png',
  },
]

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const { user } = useAuth()
  const navRef = useRef<HTMLElement>(null)
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement>>>({})
  const visibleTabs = tabs.filter(
    (tab) => tab.id !== 'externalTest' || canAccessExternalTestTab(user?.email)
  )

  useEffect(() => {
    const activeButton = tabRefs.current[activeTab]
    const nav = navRef.current
    if (!activeButton || !nav) return

    const navRect = nav.getBoundingClientRect()
    const buttonRect = activeButton.getBoundingClientRect()
    const offset =
      buttonRect.left -
      navRect.left -
      (navRect.width - buttonRect.width) / 2

    nav.scrollTo({
      left: nav.scrollLeft + offset,
      behavior: 'smooth',
    })
  }, [activeTab, visibleTabs.length])

  const renderTab = (tab: (typeof tabs)[number]) => (
    <button
      key={tab.id}
      ref={(element) => {
        if (element) tabRefs.current[tab.id] = element
        else delete tabRefs.current[tab.id]
      }}
      type="button"
      onClick={() => onTabChange(tab.id)}
      aria-label={tab.label}
      aria-current={activeTab === tab.id ? 'page' : undefined}
      className={`relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium whitespace-nowrap transition-colors sm:gap-2 sm:px-3 sm:text-sm md:rounded-none md:px-3 md:py-2 ${
        activeTab === tab.id
          ? 'bg-accent/10 text-accent md:bg-transparent'
          : 'text-text-secondary hover:bg-bg-tertiary/60 hover:text-text-primary md:hover:bg-transparent'
      }`}
    >
      <NeonTitleIcon src={tab.iconSrc} className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]" />
      <span className="md:hidden">{tab.shortLabel}</span>
      <span className="hidden md:inline">{tab.label}</span>
      {activeTab === tab.id && (
        <span className="absolute right-2 bottom-0 left-2 hidden h-0.5 bg-accent md:right-0 md:left-0 md:block" />
      )}
    </button>
  )

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg-primary/95 backdrop-blur-sm">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-6 sm:py-3 md:hidden">
          <SeahLogo className="h-6 w-auto max-w-[9.5rem]" />
          <UserAccountBar />
        </div>

        <div className="flex items-center gap-4 px-3 pb-2 sm:px-6 md:px-6 md:py-3 md:pb-3">
          <div className="hidden shrink-0 md:block">
            <SeahLogo />
          </div>

          <nav
            ref={navRef}
            aria-label="주요 메뉴"
            className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-2"
          >
            {visibleTabs.map((tab) => renderTab(tab))}
          </nav>

          <div className="hidden shrink-0 md:block">
            <UserAccountBar />
          </div>
        </div>
      </div>
    </header>
  )
}
