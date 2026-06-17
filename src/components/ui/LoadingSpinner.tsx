interface LoadingSpinnerProps {
  label?: string
}

export function LoadingSpinner({ label = '로딩 중' }: LoadingSpinnerProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg-primary text-text-secondary">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent"
        aria-hidden="true"
      />
      <p className="text-sm">{label}</p>
    </div>
  )
}
