/** Shared dark-theme styles for warranty period (보증연한) tab */

export const periodThClass =
  'border border-border/60 bg-bg-tertiary px-2 py-2.5 text-center text-xs font-semibold whitespace-nowrap text-text-secondary sm:px-3 sm:py-3 sm:text-sm'

/** Two-line EN/KO headers (PEEL/FLAKE, PERFORATION) — shrinks on narrow widths */
export const periodThStackedClass =
  'border border-border/60 bg-bg-tertiary px-1 py-2 text-center font-semibold text-text-secondary align-middle whitespace-normal leading-[1.15] text-[clamp(0.5625rem,2.5vw,0.875rem)] min-w-[3.25rem] sm:px-2 sm:py-2.5'

/** Group headers spanning multiple columns (COLOR FADING, CHALK) */
export const periodThGroupClass =
  'border border-border/60 bg-bg-tertiary px-1 py-2 text-center font-semibold text-text-secondary whitespace-normal leading-[1.15] text-[clamp(0.5625rem,2.2vw,0.875rem)] sm:px-2 sm:py-2.5'

export const periodThSubClass =
  'border border-border/60 bg-bg-tertiary/80 px-1 py-1.5 text-center font-medium whitespace-normal text-text-secondary leading-tight text-[clamp(0.5rem,2vw,0.6875rem)] sm:px-2 sm:py-2'

export const periodThStickyRow1 =
  'sticky top-0 z-20 bg-bg-tertiary shadow-[inset_0_-1px_0_0_var(--color-border)]'

export const periodThStickyRowSpan = 'z-30'

export const periodThStickyRow2 =
  'sticky z-20 bg-bg-tertiary/95 shadow-[inset_0_-1px_0_0_var(--color-border)] backdrop-blur-sm'

// 보증연한 표의 셀 높이를 행마다 동일하게 유지합니다.
// (특히 view 모드에서 텍스트 줄바꿈에 의해 행 높이가 달라지는 문제 대응)
export const periodTdClass = 'border border-border/50 px-2 py-1 align-middle min-w-0 h-[72px] overflow-hidden'

export const periodTableClass =
  'w-full min-w-[36rem] table-fixed border-separate border-spacing-0 text-sm'

export const periodDataColCount = 9

export const periodInputClass =
  'w-full rounded border border-border bg-bg-primary/50 px-2 py-1.5 text-center text-sm text-text-primary outline-none focus:border-accent'

export const periodRowClass = 'even:bg-bg-tertiary/20'

export function periodRowHoverClass(variant?: 'high' | 'low') {
  if (variant === 'high') {
    return 'hover:bg-[#9c5c4a]/22 hover:shadow-[inset_0_0_0_1px_rgba(156,92,74,0.45)]'
  }
  if (variant === 'low') {
    return 'hover:bg-[#4a7ab0]/22 hover:shadow-[inset_0_0_0_1px_rgba(74,122,176,0.45)]'
  }
  return 'hover:bg-bg-tertiary/35'
}

export function periodCardHoverClass(variant?: 'high' | 'low') {
  if (variant === 'high') {
    return 'transition-colors duration-200 hover:border-[#9c5c4a]/45 hover:bg-[#9c5c4a]/14 hover:shadow-sm'
  }
  if (variant === 'low') {
    return 'transition-colors duration-200 hover:border-[#4a7ab0]/45 hover:bg-[#4a7ab0]/14 hover:shadow-sm'
  }
  return 'transition-colors duration-200 hover:bg-bg-tertiary/55'
}

export function periodRiskBorderClass(variant?: 'high' | 'low') {
  if (variant === 'high') return 'border-[#9c5c4a]/60'
  if (variant === 'low') return 'border-[#4a7ab0]/60'
  return 'border-border'
}

export function periodRiskHeaderBorderClass(variant?: 'high' | 'low') {
  if (variant === 'high') return 'border-[#9c5c4a]/30'
  if (variant === 'low') return 'border-[#4a7ab0]/30'
  return 'border-border'
}
