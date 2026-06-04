import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  subtext?: string
  icon: LucideIcon
  variant: 'red' | 'green' | 'amber' | 'blue'
}

const variantStyles = {
  red: {
    bg: 'bg-red-950/60 border-red-900/50',
    icon: 'text-red-400 bg-red-900/40',
    value: 'text-red-300',
  },
  green: {
    bg: 'bg-emerald-950/60 border-emerald-900/50',
    icon: 'text-emerald-400 bg-emerald-900/40',
    value: 'text-emerald-300',
  },
  amber: {
    bg: 'bg-amber-950/60 border-amber-900/50',
    icon: 'text-amber-400 bg-amber-900/40',
    value: 'text-amber-300',
  },
  blue: {
    bg: 'bg-blue-950/60 border-blue-900/50',
    icon: 'text-blue-400 bg-blue-900/40',
    value: 'text-blue-300',
  },
}

export function StatCard({ label, value, subtext, icon: Icon, variant }: StatCardProps) {
  const styles = variantStyles[variant]

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 sm:p-5 ${styles.bg}`}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-text-secondary sm:text-sm">{label}</p>
        <p className={`mt-1 text-2xl font-bold sm:text-3xl ${styles.value}`}>{value}</p>
        {subtext && <p className="mt-1 text-xs text-text-muted">{subtext}</p>}
      </div>
    </div>
  )
}
