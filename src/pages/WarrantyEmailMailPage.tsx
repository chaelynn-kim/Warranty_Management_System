import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import {
  BadgeCheck,
  Inbox,
  Loader2,
  Mail,
  Plus,
  RotateCcw,
  Save,
  Send,
  X,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/layout/PageHeader'
import { NeonTitleIcon } from '../components/ui/NeonTitleIcon'
import { FormSectionHeader } from '../components/warranty-request/FormSectionHeader'
import { filterActionButtonClass, filterSearchButtonClass } from '../components/ui/FilterActions'
import { WARRANTY_ADMIN_EMAIL, canEditWarrantyEmailMail } from '../utils/authValidation'
import {
  loadWarrantyEmailMailConfig,
  parseEmailList,
  saveWarrantyEmailMailConfig,
} from '../utils/emailMailConfigStorage'
import {
  WARRANTY_EMAIL_TEMPLATE_META,
  createDefaultWarrantyEmailMailConfig,
  type WarrantyEmailMailConfigRecord,
  type WarrantyEmailTemplateConfig,
  type WarrantyEmailTemplateId,
} from '../utils/emailMailConfigTypes'
import { formatEmailJsError, sendWarrantyEmailTest } from '../utils/emailNotification'
import { logActivity } from '../utils/activityLogStorage'

/** PPTX 업로드와 동일 — 호버 시 파란 네온 */
const accentNeonButtonClass = `${filterActionButtonClass} border-border bg-bg-tertiary text-text-primary transition-all hover:border-accent hover:text-accent hover:shadow-[0_0_12px_rgba(59,130,246,0.45)] hover:ring-2 hover:ring-accent/30 active:border-accent active:text-accent active:shadow-[0_0_14px_rgba(59,130,246,0.55)] active:ring-2 active:ring-accent/45 disabled:cursor-not-allowed disabled:opacity-50`

const saveButtonClass = `${filterSearchButtonClass} shadow-md shadow-accent/25 disabled:cursor-not-allowed disabled:opacity-50`

const editButtonClass = `${filterActionButtonClass} border-border bg-bg-tertiary text-text-primary transition-all hover:border-accent hover:text-accent hover:shadow-[0_0_12px_rgba(59,130,246,0.45)] hover:ring-2 hover:ring-accent/30 disabled:opacity-50`

const TEMPLATE_UI: Record<
  WarrantyEmailTemplateId,
  { accent: 'blue' | 'green'; icon: typeof Inbox }
> = {
  pending: { accent: 'blue', icon: Inbox },
  completed: { accent: 'green', icon: BadgeCheck },
}

function normalizeRecipients(items: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of items) {
    const trimmed = raw.trim()
    if (!trimmed) continue
    const isPlaceholder = /^\{\{.+\}\}$/.test(trimmed)
    const normalized = isPlaceholder ? trimmed : trimmed.toLowerCase()
    const key = normalized.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(normalized)
  }
  return result
}

function recipientsFromRaw(raw: string): string[] {
  return normalizeRecipients(parseEmailList(raw))
}

function recipientsToRaw(items: string[]): string {
  return items.join(', ')
}

interface WarrantyEmailMailPageProps {
  userEmail?: string | null
}

function RecipientChips({
  items,
  editing,
  onChange,
  emptyLabel,
}: {
  items: string[]
  editing: boolean
  onChange: (next: string[]) => void
  emptyLabel: string
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
    const parsed = normalizeRecipients(parseEmailList(input))
    if (parsed.length === 0) {
      setInput('')
      setAdding(false)
      return
    }
    onChange(normalizeRecipients([...items, ...parsed]))
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
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-bg-tertiary px-2 py-1 text-xs text-text-primary"
        >
          <Mail className="h-3.5 w-3.5 shrink-0 text-text-muted" />
          <span className="truncate font-mono">{item}</span>
          {editing ? (
            <button
              type="button"
              onClick={() => onChange(items.filter((email) => email !== item))}
              className="ml-0.5 rounded p-0.5 text-text-muted transition-colors hover:bg-bg-secondary hover:text-text-primary"
              aria-label={`${item} 제거`}
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
            placeholder="이메일 또는 {{requester_email}}"
            className="min-w-[12rem] flex-1 rounded-md border border-accent/50 bg-bg-secondary px-2 py-1 text-sm text-text-primary outline-none placeholder:text-text-muted"
            aria-label="수신인 추가"
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
      ) : items.length === 0 ? (
        <span className="text-sm text-text-muted">{emptyLabel}</span>
      ) : null}
    </div>
  )
}

function TemplateEditor({
  templateId,
  label,
  emailJsHint,
  value,
  onChange,
  editing,
  canSendTest,
  testBusy,
  onTestSend,
}: {
  templateId: WarrantyEmailTemplateId
  label: string
  emailJsHint: string
  value: WarrantyEmailTemplateConfig
  onChange: (next: WarrantyEmailTemplateConfig) => void
  editing: boolean
  canSendTest: boolean
  testBusy: boolean
  onTestSend: () => void
}) {
  const ui = TEMPLATE_UI[templateId]
  const toItems = recipientsFromRaw(value.to)
  const ccItems = recipientsFromRaw(value.cc)

  return (
    <div className="rounded-xl border border-border bg-bg-secondary/40 p-4 sm:p-5">
      <FormSectionHeader
        title={label}
        icon={ui.icon}
        accent={ui.accent}
        actions={
          canSendTest ? (
            <button
              type="button"
              onClick={onTestSend}
              disabled={testBusy}
              title={`${WARRANTY_ADMIN_EMAIL} 로만 발송됩니다`}
              className={accentNeonButtonClass}
            >
              {testBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              테스트 발송
            </button>
          ) : null
        }
      />

      <div className="-mt-2 space-y-1.5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-text-muted">수신 (To)</span>
            <RecipientChips
              items={toItems}
              editing={editing}
              onChange={(next) => onChange({ ...value, to: recipientsToRaw(next) })}
              emptyLabel="수신인이 없습니다."
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-sm font-medium text-text-muted">참조 (Cc)</span>
            <RecipientChips
              items={ccItems}
              editing={editing}
              onChange={(next) => onChange({ ...value, cc: recipientsToRaw(next) })}
              emptyLabel="참조가 없습니다."
            />
          </div>
        </div>
        <span className="block text-xs text-text-muted">{emailJsHint}</span>
      </div>
    </div>
  )
}

export function WarrantyEmailMailPage({ userEmail }: WarrantyEmailMailPageProps) {
  const canSendTest = canEditWarrantyEmailMail(userEmail)
  const [draft, setDraft] = useState<WarrantyEmailMailConfigRecord>(() =>
    createDefaultWarrantyEmailMailConfig()
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [testingId, setTestingId] = useState<WarrantyEmailTemplateId | null>(null)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')

  const reload = async () => {
    setLoading(true)
    setError('')
    try {
      const record = await loadWarrantyEmailMailConfig()
      setDraft(record)
      setDirty(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '메일 설정을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const updateTemplate = (id: WarrantyEmailTemplateId, next: WarrantyEmailTemplateConfig) => {
    if (!editing) return
    setDraft((prev) => ({
      ...prev,
      templates: { ...prev.templates, [id]: next },
    }))
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await saveWarrantyEmailMailConfig(draft, userEmail ?? undefined)
      setDirty(false)
      setEditing(false)
      logActivity({
        action: 'email_mail.save',
        detail: '메일 수신인 설정 저장',
        userEmail,
      })
      window.alert('수신·참조 설정이 저장되었습니다.')
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleResetDefaults = () => {
    if (!window.confirm('기본 수신·참조로 되돌리시겠습니까? (저장 전까지는 반영되지 않습니다)')) {
      return
    }
    setDraft(createDefaultWarrantyEmailMailConfig())
    setDirty(true)
  }

  const handleTestSend = async (templateId: WarrantyEmailTemplateId) => {
    if (!canSendTest) {
      window.alert('테스트 발송은 관리자 계정만 사용할 수 있습니다.')
      return
    }
    if (
      !window.confirm(
        `테스트 메일을 ${WARRANTY_ADMIN_EMAIL} 로만 발송할까요?\n` +
          '제목/내용은 고정 테스트 문구입니다.'
      )
    ) {
      return
    }

    setTestingId(templateId)
    setError('')
    try {
      const result = await sendWarrantyEmailTest(templateId, {
        actorEmail: userEmail,
        draftTemplate: draft.templates[templateId],
      })
      logActivity({
        action: 'email_mail.test',
        detail: `메일 테스트 발송: ${templateId}`,
        meta: { templateId },
        userEmail,
      })
      window.alert(`테스트 메일을 발송했습니다.\n수신: ${result.to}`)
    } catch (err) {
      const message = `테스트 발송 실패\n${formatEmailJsError(err)}`
      console.error('[EmailJS] 테스트 발송 실패', err)
      setError(message)
      window.alert(message)
    } finally {
      setTestingId(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="메일 수신인 관리"
        iconSrc="/icons/warranty-email-mail.png"
        iconMaskScale={90}
        description="자동 발송되는 메일의 수신·참조를 추가·삭제할 수 있습니다."
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={loading || testingId != null}
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
                  disabled={loading || saving || testingId != null}
                  className={`${filterActionButtonClass} border-border bg-bg-tertiary text-text-secondary hover:text-text-primary disabled:opacity-50`}
                >
                  <RotateCcw className="h-4 w-4" />
                  초기화
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={loading || saving || testingId != null || !dirty}
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
            메일 설정을 불러오는 중…
          </div>
        ) : (
          <div className="space-y-4">
            {error ? (
              <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            <div className="space-y-4">
              {WARRANTY_EMAIL_TEMPLATE_META.map((meta) => (
                <TemplateEditor
                  key={meta.id}
                  templateId={meta.id}
                  label={meta.label}
                  emailJsHint={meta.emailJsHint}
                  value={draft.templates[meta.id]}
                  onChange={(next) => updateTemplate(meta.id, next)}
                  editing={editing}
                  canSendTest={canSendTest}
                  testBusy={testingId === meta.id}
                  onTestSend={() => void handleTestSend(meta.id)}
                />
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
