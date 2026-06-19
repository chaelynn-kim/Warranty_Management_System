import type { LucideIcon } from 'lucide-react'

export type FormSectionAccent = 'blue' | 'purple' | 'green' | 'orange' | 'pink'

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
}

interface FormSectionHeaderProps {
  title: string
  icon: LucideIcon
  accent: FormSectionAccent
}

export function FormSectionHeader({ title, icon: Icon, accent }: FormSectionHeaderProps) {
  const styles = accentStyles[accent]

  return (
    <div className="mb-5 flex items-center gap-3 border-b border-border/60 pb-3">
      <span className={`h-6 w-1 shrink-0 rounded-full ${styles.bar}`} aria-hidden />
      <span
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${styles.iconRing}`}
        aria-hidden
      >
        <Icon className="h-4 w-4" />
      </span>
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
    </div>
  )
}
