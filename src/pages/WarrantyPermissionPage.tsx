import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import {
  ClipboardCheck,
  Info,
  Loader2,
  Mail,
  Plus,
  RotateCcw,
  Save,
  UserCheck,
  X,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/layout/PageHeader'
import { NeonTitleIcon } from '../components/ui/NeonTitleIcon'
import { FormSectionHeader } from '../components/warranty-request/FormSectionHeader'
import { filterActionButtonClass, filterSearchButtonClass } from '../components/ui/FilterActions'
import {
  loadPermissionConfig,
  parsePermissionEmailInput,
  savePermissionConfig,
} from '../utils/permissionConfigStorage'
import {
  PERMISSION_ROLE_ORDER,
  PERMISSION_ROLE_UI,
  createDefaultPermissionConfig,
  type PermissionConfigRecord,
  type PermissionRoleId,
} from '../utils/permissionConfigTypes'
import { logActivity } from '../utils/activityLogStorage'

const saveButtonClass = `${filterSearchButtonClass} shadow-md shadow-accent/25 disabled:cursor-not-allowed disabled:opacity-50`

const editButtonClass = `${filterActionButtonClass} border-border bg-bg-tertiary text-text-primary transition-all hover:border-accent hover:text-accent hover:shadow-[0_0_12px_rgba(59,130,246,0.45)] hover:ring-2 hover:ring-accent/30 disabled:opacity-50`

const ROLE_ICONS = {
  teamLeader: UserCheck,
  receiptAssignee: ClipboardCheck,
} as const

const ROLE_MASK_ICONS: Partial<Record<PermissionRoleId, { src: string; maskScale: number }>> = {
  admin: { src: '/icons/warranty-admin.png', maskScale: 88 },
  quality: { src: '/icons/warranty-issuance-docs.png', maskScale: 82 },
}

interface WarrantyPermissionPageProps {
  userEmail?: string | null
}

function RoleEmailChips({
  emails,
  editing,
  onRemove,
  onAdd,
}: {
  emails: string[]
  editing: boolean
  onRemove: (email: string) => void
  onAdd: (email: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) {
      setAdding(false)
      setInput('')
    }
  }, [editing])

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  const commitInput = () => {
    const parsed = parsePermissionEmailInput(input)
    if (parsed.length === 0) {
      setInput('')
      setAdding(false)
      return
    }
    for (const email of parsed) onAdd(email)
    setInput('')
    setAdding(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      commitInput()
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setInput('')
      setAdding(false)
    }
  }

  return (
    <div className="flex min-h-[46px] flex-wrap items-center gap-2 rounded-lg border border-border bg-bg-primary/50 px-3 py-2">
      {emails.map((email) => (
        <span
          key={email}
          className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-bg-tertiary px-2 py-1 text-xs text-text-primary"
        >
          <Mail className="h-3.5 w-3.5 shrink-0 text-text-muted" />
          <span className="truncate font-mono">{email}</span>
          {editing ? (
            <button
              type="button"
              onClick={() => onRemove(email)}
              className="ml-0.5 rounded p-0.5 text-text-muted transition-colors hover:bg-bg-secondary hover:text-text-primary"
              aria-label={`${email} 제거`}
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </span>
      ))}

      {editing ? (
        adding ? (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commitInput}
            placeholder="이메일 입력 후 Enter"
            className="min-w-[12rem] flex-1 rounded-md border border-accent/50 bg-bg-secondary px-2 py-1 text-sm text-text-primary outline-none placeholder:text-text-muted"
            aria-label="이메일 추가"
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent"
          >
            <Plus className="h-3.5 w-3.5" />
            추가
          </button>
        )
      ) : emails.length === 0 ? (
        <span className="text-sm text-text-muted">등록된 이메일이 없습니다.</span>
      ) : null}
    </div>
  )
}

function RoleCard({
  roleId,
  label,
  emails,
  editing,
  onRemoveEmail,
  onAddEmail,
}: {
  roleId: PermissionRoleId
  label: string
  emails: string[]
  editing: boolean
  onRemoveEmail: (email: string) => void
  onAddEmail: (email: string) => void
}) {
  const ui = PERMISSION_ROLE_UI[roleId]
  const maskIcon = ROLE_MASK_ICONS[roleId]
  const Icon =
    roleId === 'teamLeader' || roleId === 'receiptAssignee' ? ROLE_ICONS[roleId] : undefined

  return (
    <div className="rounded-xl border border-border bg-bg-secondary/40 p-4 sm:p-5">
      <FormSectionHeader
        title={label}
        icon={Icon}
        accent={ui.accent}
        iconNode={
          maskIcon ? (
            <NeonTitleIcon
              src={maskIcon.src}
              maskScale={maskIcon.maskScale}
              className="h-4.5 w-4.5"
            />
          ) : undefined
        }
      />

      <div className="-mt-2 flex flex-wrap gap-1.5">
        {ui.capabilities.map((item) => (
          <span
            key={item}
            className="inline-flex rounded-md border border-border bg-bg-tertiary/80 px-2.5 py-1 text-xs text-text-secondary"
          >
            {item}
          </span>
        ))}
      </div>

      <div className="mt-4 space-y-1.5">
        <span className="text-sm font-medium text-text-muted">허용 이메일</span>
        <RoleEmailChips
          emails={emails}
          editing={editing}
          onRemove={onRemoveEmail}
          onAdd={onAddEmail}
        />
      </div>
    </div>
  )
}

export function WarrantyPermissionPage({ userEmail }: WarrantyPermissionPageProps) {
  const [draft, setDraft] = useState<PermissionConfigRecord>(() => createDefaultPermissionConfig())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')

  const applyRecord = (record: PermissionConfigRecord) => {
    setDraft(record)
    setDirty(false)
  }

  const reload = async () => {
    setLoading(true)
    setError('')
    try {
      const record = await loadPermissionConfig()
      applyRecord(record)
    } catch (err) {
      setError(err instanceof Error ? err.message : '권한 설정을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const setRoleEmails = (id: PermissionRoleId, emails: string[]) => {
    if (!editing) return
    setDraft((prev) => ({
      ...prev,
      roles: {
        ...prev.roles,
        [id]: {
          ...prev.roles[id],
          emails: parsePermissionEmailInput(emails.join('\n')),
        },
      },
    }))
    setDirty(true)
  }

  const handleAddEmail = (id: PermissionRoleId, email: string) => {
    const current = draft.roles[id].emails
    if (current.includes(email)) return
    setRoleEmails(id, [...current, email])
  }

  const handleRemoveEmail = (id: PermissionRoleId, email: string) => {
    setRoleEmails(
      id,
      draft.roles[id].emails.filter((item) => item !== email)
    )
  }

  const handleSave = async () => {
    const next = draft
    const normalizedUser = (userEmail ?? '').trim().toLowerCase()
    if (normalizedUser && !next.roles.admin.emails.includes(normalizedUser)) {
      if (
        !window.confirm(
          '현재 로그인 계정이 시스템 관리자 목록에 없습니다.\n저장하면 이 탭에 다시 접근하지 못할 수 있습니다. 계속할까요?'
        )
      ) {
        return
      }
    }

    setSaving(true)
    setError('')
    try {
      await savePermissionConfig(next, userEmail ?? undefined)
      applyRecord(next)
      setEditing(false)
      logActivity({
        action: 'permission.save',
        detail: '권한 설정 저장',
        userEmail,
      })
      window.alert('권한 설정이 저장되었습니다.')
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleResetDefaults = () => {
    if (!window.confirm('기본 권한 목록으로 되돌리시겠습니까? (저장 전까지는 반영되지 않습니다)')) {
      return
    }
    setDraft(createDefaultPermissionConfig())
    setDirty(true)
  }

  return (
    <div>
      <PageHeader
        title="권한 관리"
        iconSrc="/icons/warranty-permission.png"
        iconMaskScale={90}
        description="권한이 부여된 사용자 계정을 관리합니다. 이메일 계정을 추가하거나 삭제할 수 있습니다."
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={loading}
                className={editButtonClass}
              >
                <NeonTitleIcon
                  src="/icons/warranty-certificate-template.png"
                  maskScale={75}
                  className="h-4 w-4"
                />
                수정
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  disabled={loading || saving}
                  className={`${filterActionButtonClass} border-border bg-bg-tertiary text-text-secondary hover:text-text-primary disabled:opacity-50`}
                >
                  <RotateCcw className="h-4 w-4" />
                  초기화
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={loading || saving || !dirty}
                  className={saveButtonClass}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  저장
                </button>
              </>
            )}
          </div>
        }
      />

      <Card>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            권한 설정을 불러오는 중…
          </div>
        ) : (
          <div className="space-y-4">
            {error ? (
              <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            <div className="flex items-start gap-2.5 rounded-xl border border-border bg-bg-secondary/50 px-3.5 py-3 text-sm text-text-secondary">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" aria-hidden />
              <p>
                회사 계정(@seah.co.kr)은 로그인·의뢰서 작성·의뢰 본문 수정이 가능합니다. 아래 권한은 별도 부여되는 권한입니다.

              </p>
            </div>

            <div className="space-y-4">
              {PERMISSION_ROLE_ORDER.map((id) => {
                const role = draft.roles[id]
                return (
                  <RoleCard
                    key={id}
                    roleId={id}
                    label={role.label}
                    emails={role.emails}
                    editing={editing}
                    onRemoveEmail={(email) => handleRemoveEmail(id, email)}
                    onAddEmail={(email) => handleAddEmail(id, email)}
                  />
                )
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
