type RiskBadgeVariant = 'high' | 'low'

const badgeStyles: Record<
  RiskBadgeVariant,
  { label: string; className: string }
> = {
  high: {
    label: 'HIGH RISK',
    className:
      'border-[#9c5c4a] bg-[#1a1412] text-[#f2e8dc] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
  },
  low: {
    label: 'LOW RISK',
    className:
      'border-[#4a7ab0] bg-[#101820] text-[#b3d4f5] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
  },
}

export function RiskBadge({ variant }: { variant: RiskBadgeVariant }) {
  const { label, className } = badgeStyles[variant]
  return (
    <span
      className={`inline-block rounded-md border px-3 py-1 text-[11px] font-bold tracking-[0.12em] sm:text-xs ${className}`}
    >
      {label}
    </span>
  )
}
