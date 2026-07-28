import { useEffect, useRef } from 'react'
import type { TabId } from '../../types'
import { NeonTitleIcon } from '../ui/NeonTitleIcon'
import { SeahLogo } from './SeahLogo'
import { UserAccountBar } from './UserAccountBar'

interface HeaderProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  showCertificateTemplateTab?: boolean
  showEmailMailTab?: boolean
  showPermissionTab?: boolean
}

type TabItem = {
  id: TabId
  label: string
  shortLabel: string
  iconSrc: string
  iconMaskScale: number
}

const baseTabs: TabItem[] = [
  {
    id: 'issuanceRequest',
    label: '보증서 발행 의뢰',
    shortLabel: '발행 의뢰',
    iconSrc: '/icons/warranty-request-document.png',
    iconMaskScale: 100,
  },
  {
    id: 'issuance',
    label: '보증서 발행 관리',
    shortLabel: '발행 관리',
    iconSrc: '/icons/warranty-issuance-docs.png',
    iconMaskScale: 78,
  },
  {
    id: 'period',
    label: '보증연한',
    shortLabel: '보증연한',
    iconSrc: '/icons/warranty-period-calendar.png',
    iconMaskScale: 78,
  },
]

const certificateTemplateTab: TabItem = {
  id: 'certificateTemplate',
  label: '보증서 양식 관리',
  shortLabel: '양식 관리',
  iconSrc: '/icons/warranty-certificate-template.png',
  iconMaskScale: 75,
}

const emailMailTab: TabItem = {
  id: 'emailMail',
  label: '메일 수신인 관리',
  shortLabel: '메일 관리',
  iconSrc: '/icons/warranty-email-mail.png',
  iconMaskScale: 85,
}

const permissionTab: TabItem = {
  id: 'permission',
  label: '권한 관리',
  shortLabel: '권한 관리',
  iconSrc: '/icons/warranty-permission.png',
  iconMaskScale: 85,
}

export function Header({
  activeTab,
  onTabChange,
  showCertificateTemplateTab = false,
  showEmailMailTab = false,
  showPermissionTab = false,
}: HeaderProps) {
  const navRef = useRef<HTMLElement>(null)
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement>>>({})
  const visibleTabs = [
    ...baseTabs,
    ...(showCertificateTemplateTab ? [certificateTemplateTab] : []),
    ...(showEmailMailTab ? [emailMailTab] : []),
    ...(showPermissionTab ? [permissionTab] : []),
  ]

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

  const renderTab = (tab: TabItem) => (
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
      className={`relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-[10pt] font-medium whitespace-nowrap transition-colors sm:gap-2 sm:px-3 sm:text-[11.5pt] md:rounded-none md:px-3 md:py-2 ${
        activeTab === tab.id
          ? 'bg-accent/10 text-accent md:bg-transparent'
          : 'text-text-secondary hover:bg-bg-tertiary/60 hover:text-text-primary md:hover:bg-transparent'
      }`}
    >
      <NeonTitleIcon
        src={tab.iconSrc}
        maskScale={tab.iconMaskScale}
        className="h-[13pt] w-[13pt] shrink-0 sm:h-[16pt] sm:w-[16pt]"
      />
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

        <div className="flex items-center gap-3 px-3 pb-2 sm:px-6 md:gap-3 md:px-6 md:py-3 md:pb-3">
          <div className="hidden shrink-0 items-center gap-2.5 md:flex">
            <SeahLogo />
            <span aria-hidden className="h-5 w-px bg-border" />
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
