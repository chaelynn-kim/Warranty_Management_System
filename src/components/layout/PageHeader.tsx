interface PageHeaderProps {
  subtitle: string
  title: string
  description: string
}

export function PageHeader({ subtitle, title, description }: PageHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8">
      <p className="mb-1 text-[10px] font-semibold tracking-widest text-text-muted uppercase sm:text-xs">
        {subtitle}
      </p>
      <h1 className="text-xl font-bold text-text-primary sm:text-2xl lg:text-3xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm text-text-secondary">{description}</p>
    </div>
  )
}
