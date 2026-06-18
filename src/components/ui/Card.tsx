import type { ReactNode } from 'react'

interface CardProps {
  label?: string
  title: ReactNode
  children: ReactNode
  className?: string
}

export function Card({ label, title, children, className = '' }: CardProps) {
  return (
    <section className={`rounded-xl border border-border bg-bg-secondary p-4 sm:p-6 ${className}`}>
      {label && (
        <p className="mb-1 text-[10px] font-semibold tracking-widest text-text-muted uppercase">
          {label}
        </p>
      )}
      <h2 className="mb-4 text-base font-semibold text-text-primary sm:text-lg">{title}</h2>
      {children}
    </section>
  )
}
