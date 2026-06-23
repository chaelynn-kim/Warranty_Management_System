import type { ReactNode } from 'react'
import { periodCardHeaderClass, periodCardLabelClass, periodCardTitleHeadingClass } from '../warranty-period/periodTheme'

interface CardProps {
  label?: string
  title: ReactNode
  titleActions?: ReactNode
  headerNotice?: ReactNode
  children: ReactNode
  className?: string
}

export function Card({ label, title, titleActions, headerNotice, children, className = '' }: CardProps) {
  return (
    <section className={`rounded-xl border border-border bg-bg-secondary p-4 sm:p-6 ${className}`}>
      <div className={periodCardHeaderClass}>
        {label && <p className={periodCardLabelClass}>{label}</p>}
        <div className={headerNotice ? 'space-y-4' : undefined}>
          <div className="flex items-start justify-between gap-3">
            <h2 className={periodCardTitleHeadingClass}>{title}</h2>
            {titleActions && (
              <div className="flex shrink-0 items-center gap-2">{titleActions}</div>
            )}
          </div>
          {headerNotice}
        </div>
      </div>
      {children}
    </section>
  )
}
