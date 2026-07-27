import type { CSSProperties } from 'react'

function iconMaskStyle(src: string, maskScale = 100): CSSProperties {
  const maskSize = `${maskScale}%`
  return {
    maskImage: `url(${src})`,
    WebkitMaskImage: `url(${src})`,
    maskSize,
    WebkitMaskSize: maskSize,
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
  }
}

export function NeonTitleIcon({
  src,
  className = 'h-4 w-4',
  /** PNG 여백 차이 보정 — 100이 기준, 작을수록 아이콘이 작게 보임 */
  maskScale = 100,
}: {
  src: string
  className?: string
  maskScale?: number
}) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-current ${className}`}
      style={iconMaskStyle(src, maskScale)}
    />
  )
}
