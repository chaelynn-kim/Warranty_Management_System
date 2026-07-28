import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type FormSectionAccent = 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'yellow'

const accentStyles: Record<
  FormSectionAccent,
  { bar: string; iconRing: string }
> = {
  blue: {
    bar: 'bg-blue-400',
    iconRing: 'border-blue-400/60 text-blue-400',
  },
  purple: {
    bar: 'bg-purple-400',
    iconRing: 'border-purple-400/60 text-purple-400',
  },
  green: {
    bar: 'bg-emerald-400',
    iconRing: 'border-emerald-400/60 text-emerald-400',
  },
  orange: {
    bar: 'bg-amber-400',
    iconRing: 'border-amber-400/60 text-amber-400',
  },
  pink: {
    bar: 'bg-fuchsia-400',
    iconRing: 'border-fuchsia-400/60 text-fuchsia-400',
  },
  yellow: {
    bar: 'bg-yellow-400',
    iconRing: 'border-yellow-400/60 text-yellow-400',
  },
}

interface FormSectionHeaderProps {
  title: string
  accent: FormSectionAccent
  icon?: LucideIcon
  /** Lucide 대신 커스텀 아이콘(마스크 PNG 등) */
  iconNode?: ReactNode
  actions?: ReactNode
}

export function FormSectionHeader({
  title,
  icon: Icon,
  iconNode,
  accent,
  actions,
}: FormSectionHeaderProps) {
  const styles = accentStyles[accent]

  return (
    <div className="mb-5 flex items-center gap-3 border-b border-border/60 pb-3">
      <span className={`h-6 w-1 shrink-0 rounded-full ${styles.bar}`} aria-hidden />
      <span
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${styles.iconRing}`}
        aria-hidden
      >
        {iconNode ?? (Icon ? <Icon className="h-4 w-4" /> : null)}
      </span>
      <h3 className="min-w-0 flex-1 text-base font-semibold text-text-primary">{title}</h3>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  )
}
