import { normalizeRequestStatus } from '../../utils/warrantyRequestStatus'
import {
  WARRANTY_REQUEST_STATUS_COMPLETED,
  WARRANTY_REQUEST_STATUS_IN_PROGRESS,
  WARRANTY_REQUEST_STATUS_PENDING,
} from '../../constants/warrantyRequestStatus'

const STATUS_STYLES: Record<string, string> = {
  [WARRANTY_REQUEST_STATUS_PENDING]: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
  [WARRANTY_REQUEST_STATUS_IN_PROGRESS]: 'border-accent/40 bg-accent/15 text-accent',
  [WARRANTY_REQUEST_STATUS_COMPLETED]: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
}

interface RequestStatusBadgeProps {
  status: string
  className?: string
}

export function RequestStatusBadge({ status, className = '' }: RequestStatusBadgeProps) {
  const normalized = normalizeRequestStatus(status)
  const style =
    STATUS_STYLES[normalized] ?? 'border-border bg-bg-tertiary text-text-secondary'

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style} ${className}`}
    >
      {normalized}
    </span>
  )
}
