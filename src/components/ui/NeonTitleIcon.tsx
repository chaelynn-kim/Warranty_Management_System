import type { CSSProperties } from 'react'

function iconMaskStyle(src: string): CSSProperties {
  return {
    maskImage: `url(${src})`,
    WebkitMaskImage: `url(${src})`,
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
  }
}

export function NeonTitleIcon({
  src,
  className = 'h-4 w-4',
}: {
  src: string
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-current ${className}`}
      style={iconMaskStyle(src)}
    />
  )
}
