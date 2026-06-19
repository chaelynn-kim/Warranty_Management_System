import { useEffect } from 'react'

interface ConfirmDialogProps {
  open: boolean
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="닫기"
        onClick={onCancel}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-message"
        className="relative w-full max-w-sm rounded-xl border border-border bg-bg-secondary p-6 shadow-2xl"
      >
        <p id="confirm-dialog-message" className="text-center text-base font-medium text-text-primary">
          {message}
        </p>

        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-[38px] min-w-[88px] items-center justify-center rounded-lg border border-border bg-bg-tertiary px-4 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-[38px] min-w-[88px] items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition-colors hover:bg-accent-hover"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
