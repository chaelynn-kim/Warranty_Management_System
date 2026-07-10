import type { CSSProperties, ReactNode } from 'react'

interface PageHeaderProps {
  subtitle?: string
  title: ReactNode
  description: ReactNode
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

export function PageHeader({ subtitle, title, description, actions }: PageHeaderProps) {
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

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          {subtitleEl}
          <h1 className="text-xl font-bold text-text-primary sm:text-2xl lg:text-3xl">{title}</h1>
          {descriptionEl}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-start justify-end lg:pt-8">{actions}</div>
        ) : null}
      </div>
    </div>
  )
}
