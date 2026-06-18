import type { CSSProperties, ReactNode } from 'react'

interface PageHeaderProps {
  subtitle?: string
  title: string
  description: ReactNode
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

export function PageHeader({ subtitle, title, description }: PageHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8">
      {subtitle && (
        <p className="mb-1.5 text-[10px] font-semibold tracking-widest text-text-muted uppercase sm:text-xs">
          {subtitle}
        </p>
      )}
      <h1 className="text-xl font-bold text-text-primary sm:text-2xl lg:text-3xl">{title}</h1>
      <div className="mt-3 max-w-3xl space-y-1.5 text-sm leading-relaxed text-text-secondary">
        {typeof description === 'string' ? <p>{description}</p> : description}
      </div>
    </div>
  )
}
