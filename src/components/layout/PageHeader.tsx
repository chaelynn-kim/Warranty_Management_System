import type { CSSProperties, ReactNode } from 'react'

interface PageHeaderProps {
  subtitle?: string
  title: ReactNode
  description: ReactNode
  /** 설명 하단 주의 문구 — actions와 같은 줄에 배치 */
  descriptionNote?: ReactNode
  actions?: ReactNode
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

export function PageHeader({ subtitle, title, description, descriptionNote, actions }: PageHeaderProps) {
  const subtitleEl = subtitle ? (
    <p className="mb-1.5 text-[10px] font-semibold tracking-widest text-text-muted uppercase sm:text-xs">
      {subtitle}
    </p>
  ) : null

  const descriptionEl = (
    <div className="mt-3 max-w-3xl space-y-1.5 text-sm leading-relaxed text-text-secondary">
      {typeof description === 'string' ? <p>{description}</p> : description}
    </div>
  )

  const noteRow =
    descriptionNote != null || actions ? (
      <div className="mt-1.5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {descriptionNote != null ? (
          <div className="min-w-0 max-w-3xl text-sm leading-relaxed text-text-secondary">
            {descriptionNote}
          </div>
        ) : (
          <div className="hidden lg:block lg:min-w-0 lg:flex-1" aria-hidden />
        )}
        {actions ? <div className="flex shrink-0 items-center justify-end">{actions}</div> : null}
      </div>
    ) : null

  return (
    <div className="mb-6 sm:mb-8">
      <div className="min-w-0">
        {subtitleEl}
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl lg:text-3xl">{title}</h1>
        {descriptionEl}
        {noteRow}
      </div>
    </div>
  )
}
