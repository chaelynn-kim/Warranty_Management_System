import type { LucideIcon } from 'lucide-react'

type StatCardVariant = 'red' | 'green' | 'amber' | 'blue' | 'sky'

interface StatCardProps {
  label: string
  value: string | number
  subtext?: string
  icon: LucideIcon
  variant: StatCardVariant
  progressPercent?: number
}

const variantStyles: Record<
  StatCardVariant,
  { bg: string; icon: string; value: string; bar: string; hover: string }
> = {
  red: {
    bg: 'bg-red-950/60 border-red-900/50',
    icon: 'text-red-400 bg-red-900/40',
    value: 'text-red-300',
    bar: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.45)]',
    hover:
      'hover:border-red-500/70 hover:bg-red-950/85 hover:shadow-[0_0_22px_rgba(248,113,113,0.28)] hover:ring-1 hover:ring-red-500/30',
  },
  green: {
    bg: 'bg-emerald-950/60 border-emerald-900/50',
    icon: 'text-emerald-400 bg-emerald-900/40',
    value: 'text-emerald-300',
    bar: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.45)]',
    hover:
      'hover:border-emerald-500/70 hover:bg-emerald-950/85 hover:shadow-[0_0_22px_rgba(52,211,153,0.28)] hover:ring-1 hover:ring-emerald-500/30',
  },
  amber: {
    bg: 'bg-amber-950/60 border-amber-900/50',
    icon: 'text-amber-400 bg-amber-900/40',
    value: 'text-amber-300',
    bar: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.45)]',
    hover:
      'hover:border-amber-500/70 hover:bg-amber-950/85 hover:shadow-[0_0_22px_rgba(251,191,36,0.28)] hover:ring-1 hover:ring-amber-500/30',
  },
  blue: {
    bg: 'bg-blue-950/60 border-blue-900/50',
    icon: 'text-blue-400 bg-blue-900/40',
    value: 'text-blue-300',
    bar: 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.45)]',
    hover:
      'hover:border-blue-500/70 hover:bg-blue-950/85 hover:shadow-[0_0_22px_rgba(96,165,250,0.28)] hover:ring-1 hover:ring-blue-500/30',
  },
  sky: {
    bg: 'bg-sky-950/60 border-sky-900/50',
    icon: 'text-sky-400 bg-sky-900/40',
    value: 'text-sky-300',
    bar: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.45)]',
    hover:
      'hover:border-sky-500/70 hover:bg-sky-950/85 hover:shadow-[0_0_22px_rgba(56,189,248,0.28)] hover:ring-1 hover:ring-sky-500/30',
  },
}

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  variant,
  progressPercent,
}: StatCardProps) {
  const styles = variantStyles[variant]
  const showProgress = progressPercent != null

  return (
    <div
      className={`group flex items-start gap-3 rounded-xl border p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 sm:p-5 ${styles.bg} ${styles.hover}`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110 ${styles.icon}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-text-secondary sm:text-sm">{label}</p>
        <p className={`mt-1 text-2xl font-bold tabular-nums sm:text-3xl ${styles.value}`}>{value}</p>
        {subtext && <p className="mt-1 text-xs leading-relaxed text-text-muted">{subtext}</p>}
        {showProgress && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg-primary/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${styles.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
