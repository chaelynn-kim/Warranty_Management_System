import type { ReactNode } from 'react'
import { Pencil, Plus, RotateCcw, Save } from 'lucide-react'

export type PeriodSectionId =
  | 'highRisk:countries'
  | 'highRisk:paint'
  | 'highRisk:print'
  | 'lowRisk:countries'
  | 'lowRisk:paint'
  | 'lowRisk:print'
  | 'coastalAl'
  | 'notCovered'

function EditingToolbar({
  canAdd,
  onSave,
  onAdd,
  onReset,
}: {
  canAdd: boolean
  onSave: () => void
  onAdd: () => void
  onReset: () => void
}) {
  return (
    <div className="mb-3 flex flex-wrap justify-end gap-2">
      <button
        type="button"
        onClick={onAdd}
        disabled={!canAdd}
        aria-label="행 추가"
        title={canAdd ? '행 추가' : '행을 선택한 뒤 추가할 수 있습니다'}
        className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-border bg-bg-tertiary text-text-primary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onSave}
        className="inline-flex h-[38px] items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        <Save className="h-4 w-4" />
        저장
      </button>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex h-[38px] items-center gap-2 rounded-lg border border-border bg-bg-tertiary px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        <RotateCcw className="h-4 w-4" />
        초기화
      </button>
    </div>
  )
}

interface PeriodSectionProps {
  title: ReactNode
  canEdit: boolean
  editing: boolean
  saveMessage?: string
  canAdd?: boolean
  onEdit: () => void
  onSave: () => void
  onReset: () => void
  onAdd?: () => void
  children: ReactNode
  className?: string
}

export function PeriodSection({
  title,
  canEdit,
  editing,
  saveMessage = '',
  canAdd = false,
  onEdit,
  onSave,
  onReset,
  onAdd,
  children,
  className = 'mb-6',
}: PeriodSectionProps) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="min-w-0 text-sm font-semibold text-text-primary sm:text-base">{title}</h3>
        {canEdit && (
          <button
            type="button"
            onClick={onEdit}
            disabled={editing}
            aria-label="수정"
            title="수정"
            className={`inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg border bg-bg-tertiary transition-all disabled:cursor-not-allowed ${
              editing
                ? 'border-accent text-accent shadow-[0_0_14px_rgba(59,130,246,0.55)] ring-2 ring-accent/45 disabled:opacity-100'
                : 'border-border text-text-primary hover:border-accent hover:text-accent hover:shadow-[0_0_12px_rgba(59,130,246,0.45)] hover:ring-2 hover:ring-accent/30 active:border-accent active:text-accent active:shadow-[0_0_14px_rgba(59,130,246,0.55)] active:ring-2 active:ring-accent/45 focus-visible:border-accent focus-visible:text-accent focus-visible:shadow-[0_0_12px_rgba(59,130,246,0.45)] focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-50'
            }`}
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      {editing && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold tracking-wide text-accent ring-1 ring-accent/40">
            수정 중
          </span>
          {onAdd && <EditingToolbar canAdd={canAdd} onSave={onSave} onAdd={onAdd} onReset={onReset} />}
          {!onAdd && (
            <div className="ml-auto flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onSave}
                className="inline-flex h-[38px] items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                <Save className="h-4 w-4" />
                저장
              </button>
              <button
                type="button"
                onClick={onReset}
                className="inline-flex h-[38px] items-center gap-2 rounded-lg border border-border bg-bg-tertiary px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                <RotateCcw className="h-4 w-4" />
                초기화
              </button>
            </div>
          )}
        </div>
      )}

      {saveMessage && !editing && (
        <p className="mb-3 text-sm font-medium text-emerald-400">{saveMessage}</p>
      )}

      {children}
    </section>
  )
}

export function PeriodSectionEditButton({
  canEdit,
  editing,
  onEdit,
}: {
  canEdit: boolean
  editing: boolean
  onEdit: () => void
}) {
  if (!canEdit) return null

  return (
    <button
      type="button"
      onClick={onEdit}
      disabled={editing}
      aria-label="수정"
      title="수정"
      className={`inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border bg-bg-tertiary transition-all disabled:cursor-not-allowed ${
        editing
          ? 'border-accent text-accent shadow-[0_0_14px_rgba(59,130,246,0.55)] ring-2 ring-accent/45 disabled:opacity-100'
          : 'border-border text-text-primary hover:border-accent hover:text-accent hover:shadow-[0_0_12px_rgba(59,130,246,0.45)] hover:ring-2 hover:ring-accent/30 active:border-accent active:text-accent active:shadow-[0_0_14px_rgba(59,130,246,0.55)] active:ring-2 active:ring-accent/45 focus-visible:border-accent focus-visible:text-accent focus-visible:shadow-[0_0_12px_rgba(59,130,246,0.45)] focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-50'
      }`}
    >
      <Pencil className="h-4 w-4" />
    </button>
  )
}

export function CardSectionToolbar({
  editing,
  saveMessage,
  canAdd,
  onSave,
  onAdd,
  onReset,
}: {
  editing: boolean
  saveMessage: string
  canAdd: boolean
  onSave: () => void
  onAdd: () => void
  onReset: () => void
}) {
  if (!editing && !saveMessage) return null

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-3">
        {editing && (
          <span className="inline-flex items-center rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold tracking-wide text-accent ring-1 ring-accent/40">
            수정 중
          </span>
        )}
        {saveMessage && (
          <span className="text-sm font-medium text-emerald-400">{saveMessage}</span>
        )}
      </div>
      {editing && (
        <EditingToolbar canAdd={canAdd} onSave={onSave} onAdd={onAdd} onReset={onReset} />
      )}
    </div>
  )
}
