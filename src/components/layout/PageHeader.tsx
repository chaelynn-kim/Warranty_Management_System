import { forwardRef, type CSSProperties, type ReactNode } from 'react'
import { NeonTitleIcon } from '../ui/NeonTitleIcon'

interface PageHeaderProps {
  subtitle?: string
  title: ReactNode
  description: ReactNode
  /** 설명 하단 주의 문구 — actions와 같은 줄에 배치 */
  descriptionNote?: ReactNode
  actions?: ReactNode
  /** 탭과 동일한 헤더 아이콘 */
  iconSrc?: string
  iconMaskScale?: number
  /** 앱 헤더 아래에 고정 (스크롤 시 유지) */
  sticky?: boolean
}

const cautionIconMaskStyle: CSSProperties = {
  maskImage: 'url(/icons/caution.png)',
  WebkitMaskImage: 'url(/icons/caution.png)',
  maskSize: 'contain',
  WebkitMaskSize: 'contain',
  maskRepeat: 'no-repeat',
  WebkitMaskRepeat: 'no-repeat',
  maskPosition: 'center',
  WebkitMaskPosition: 'center',
}

export function PageHeaderCautionIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-current ${className}`}
      style={cautionIconMaskStyle}
    />
  )
}

export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(function PageHeader(
  {
    subtitle,
    title,
    description,
    descriptionNote,
    actions,
    iconSrc,
    iconMaskScale = 100,
    sticky = false,
  },
  ref,
) {
  const subtitleEl = subtitle ? (
    <p className="mb-1 text-[10px] font-semibold tracking-widest text-text-muted uppercase sm:text-xs">
      {subtitle}
    </p>
  ) : null

  const descriptionStack = (
    <div className="mt-2 max-w-3xl space-y-1 text-sm leading-relaxed text-text-secondary">
      {typeof description === 'string' ? <p>{description}</p> : description}
      {descriptionNote != null ? (
        <div className="text-sm leading-relaxed text-text-secondary">{descriptionNote}</div>
      ) : null}
    </div>
  )

  return (
    <div
      ref={ref}
      className={`mb-6 rounded-xl border border-[#1e2229] bg-[#15181e] p-4 sm:mb-8 sm:p-5 ${
        sticky
          ? 'sticky top-[var(--app-header-offset)] z-40 bg-[#15181e]/95 shadow-sm backdrop-blur-sm'
          : ''
      }`}
    >
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        {iconSrc ? (
          <span
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent sm:h-11 sm:w-11"
            aria-hidden
          >
            <NeonTitleIcon
              src={iconSrc}
              maskScale={iconMaskScale}
              className="h-4 w-4 sm:h-5 sm:w-5"
            />
          </span>
        ) : null}

        <div className="min-w-0 flex-1">
          {subtitleEl}
          <h1 className="text-xl font-bold text-text-primary sm:text-2xl">{title}</h1>

          {/* 설명은 왼쪽, 버튼은 우측 하단(보증연한 탭과 동일) */}
          {actions ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
              <div className="min-w-0 flex-1">{descriptionStack}</div>
              <div className="flex shrink-0 items-center justify-end gap-2">{actions}</div>
            </div>
          ) : (
            descriptionStack
          )}
        </div>
      </div>
    </div>
  )
})
