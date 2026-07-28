import type { ReactNode } from 'react'
import { periodCardHeaderClass, periodCardLabelClass, periodCardTitleHeadingClass } from '../warranty-period/periodTheme'

interface CardProps {
  label?: string
  title?: ReactNode
  titleActions?: ReactNode
  headerNotice?: ReactNode
  children: ReactNode
  className?: string
}

export function Card({ label, title, titleActions, headerNotice, children, className = '' }: CardProps) {
  const hasHeader =
    Boolean(label) ||
    title != null ||
    titleActions != null ||
    headerNotice != null

  return (
    <section className={`rounded-xl border border-border bg-bg-secondary p-4 sm:p-6 ${className}`}>
      {hasHeader ? (
        <div className={periodCardHeaderClass}>
          {label ? <p className={periodCardLabelClass}>{label}</p> : null}
          <div className={headerNotice ? 'space-y-4' : undefined}>
            {(title != null || titleActions) && (
              <div className="flex items-start justify-between gap-3">
                {title != null ? <h2 className={periodCardTitleHeadingClass}>{title}</h2> : <span />}
                {titleActions ? (
                  <div className="flex shrink-0 items-center gap-2">{titleActions}</div>
                ) : null}
              </div>
            )}
            {headerNotice}
          </div>
        </div>
      ) : null}
      {children}
    </section>
  )
}
