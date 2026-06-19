import { useMemo } from 'react'
import { CheckCircle2, Clock, Pencil } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { WarrantyIssuanceRequestRecord } from '../../types'
import {
  WARRANTY_REQUEST_STATUS_COMPLETED,
  WARRANTY_REQUEST_STATUS_IN_PROGRESS,
  WARRANTY_REQUEST_STATUS_PENDING,
} from '../../constants/warrantyRequestStatus'
import { countRequestsByStatus } from '../../utils/warrantyRequestStatus'

interface StatusCardConfig {
  status: string
  label: string
  badge: string
  icon: LucideIcon
  cardClass: string
  iconWrapClass: string
  iconClass: string
  numberClass: string
  badgeClass: string
  barClass: string
}

const STATUS_CARDS: StatusCardConfig[] = [
  {
    status: WARRANTY_REQUEST_STATUS_PENDING,
    label: WARRANTY_REQUEST_STATUS_PENDING,
    badge: '대기중',
    icon: Clock,
    cardClass: 'border-amber-500/30 bg-amber-500/5',
    iconWrapClass: 'bg-amber-500/15',
    iconClass: 'text-amber-400',
    numberClass: 'text-amber-400',
    badgeClass: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    barClass: 'bg-amber-400',
  },
  {
    status: WARRANTY_REQUEST_STATUS_IN_PROGRESS,
    label: WARRANTY_REQUEST_STATUS_IN_PROGRESS,
    badge: '진행중',
    icon: Pencil,
    cardClass: 'border-accent/30 bg-accent/5',
    iconWrapClass: 'bg-accent/15',
    iconClass: 'text-accent',
    numberClass: 'text-accent',
    badgeClass: 'border-accent/30 bg-accent/10 text-accent',
    barClass: 'bg-accent',
  },
  {
    status: WARRANTY_REQUEST_STATUS_COMPLETED,
    label: WARRANTY_REQUEST_STATUS_COMPLETED,
    badge: '완료',
    icon: CheckCircle2,
    cardClass: 'border-emerald-500/30 bg-emerald-500/5',
    iconWrapClass: 'bg-emerald-500/15',
    iconClass: 'text-emerald-400',
    numberClass: 'text-emerald-400',
    badgeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    barClass: 'bg-emerald-400',
  },
]

interface WarrantyRequestStatusSummaryProps {
  records: WarrantyIssuanceRequestRecord[]
}

export function WarrantyRequestStatusSummary({ records }: WarrantyRequestStatusSummaryProps) {
  const counts = useMemo(() => countRequestsByStatus(records), [records])
  const total = records.length

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {STATUS_CARDS.map((card) => {
        const count = counts[card.status] ?? 0
        const percent = total > 0 ? Math.round((count / total) * 100) : 0
        const Icon = card.icon

        return (
          <div
            key={card.status}
            className={`rounded-xl border p-4 sm:p-5 ${card.cardClass}`}
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${card.iconWrapClass}`}
              >
                <Icon className={`h-4 w-4 ${card.iconClass}`} />
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium sm:text-xs ${card.badgeClass}`}
              >
                {card.badge}
              </span>
            </div>

            <p className={`text-3xl font-bold tabular-nums sm:text-4xl ${card.numberClass}`}>{count}</p>
            <p className="mt-1 text-sm font-medium text-text-primary">{card.label}</p>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-bg-primary/50">
              <div
                className={`h-full rounded-full transition-all ${card.barClass}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
