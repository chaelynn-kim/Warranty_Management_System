import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/layout/PageHeader'
import { filterActionButtonClass } from '../components/ui/FilterActions'
import {
  deleteActivityLog,
  fetchActivityLogs,
} from '../utils/activityLogStorage'
import {
  ACTIVITY_ACTION_LABELS,
  type ActivityAction,
  type ActivityLogEntry,
} from '../utils/activityLogTypes'

function formatLogTime(iso: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
}

const fieldClass =
  'rounded-lg border border-border bg-bg-primary/50 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent'

export function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [emailFilter, setEmailFilter] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const rows = await fetchActivityLogs()
      setLogs(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : '이력을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const actionOptions = useMemo(() => {
    const fromData = new Set(logs.map((item) => item.action))
    const known = Object.keys(ACTIVITY_ACTION_LABELS) as ActivityAction[]
    for (const action of known) fromData.add(action)
    return [...fromData].sort((a, b) => a.localeCompare(b))
  }, [logs])

  const filtered = useMemo(() => {
    const email = emailFilter.trim().toLowerCase()
    return logs.filter((item) => {
      if (actionFilter && item.action !== actionFilter) return false
      if (email && !item.userEmail.toLowerCase().includes(email)) return false
      return true
    })
  }, [logs, actionFilter, emailFilter])

  const handleDelete = async (id: string) => {
    if (!window.confirm('이 이력 로그를 삭제할까요?')) return
    setDeletingId(id)
    try {
      await deleteActivityLog(id)
      setLogs((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '삭제에 실패했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="이력 로그"
        iconSrc="/icons/warranty-activity-log.png?v=2"
        iconMaskScale={88}
        description="사용자 기능 이용 이력을 Firebase에 기록·조회합니다. (최근 300건)"
        actions={
          <button
            type="button"
            onClick={() => void reload()}
            disabled={loading}
            className={`${filterActionButtonClass} border-border bg-bg-tertiary text-text-secondary hover:text-text-primary disabled:opacity-50`}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            새로고침
          </button>
        }
      />

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            className={`${fieldClass} min-w-[12rem]`}
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            aria-label="액션"
          >
            <option value="">액션</option>
            {actionOptions.map((action) => (
              <option key={action} value={action}>
                {ACTIVITY_ACTION_LABELS[action as ActivityAction] ?? action}
              </option>
            ))}
          </select>
          <input
            className={`${fieldClass} min-w-[16rem]`}
            value={emailFilter}
            onChange={(event) => setEmailFilter(event.target.value)}
            placeholder="사용자 이메일 검색"
            aria-label="사용자 이메일 검색"
          />
          <p className="text-xs text-text-muted">
            표시 {filtered.length}건 / 전체 {logs.length}건
          </p>
        </div>

        {error ? (
          <p className="mb-3 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            이력 불러오는 중…
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-text-muted">기록이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-bg-tertiary text-text-secondary">
                <tr>
                  <th className="px-3 py-2 font-medium whitespace-nowrap">시각</th>
                  <th className="px-3 py-2 font-medium whitespace-nowrap">사용자</th>
                  <th className="px-3 py-2 font-medium whitespace-nowrap">액션</th>
                  <th className="px-3 py-2 font-medium">상세</th>
                  <th className="px-3 py-2 font-medium whitespace-nowrap">관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-t border-border/70">
                    <td className="px-3 py-2 whitespace-nowrap text-text-secondary">
                      {formatLogTime(item.createdAt)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="font-mono text-xs text-text-primary">{item.userEmail || '—'}</div>
                      {item.userName ? (
                        <div className="text-xs text-text-muted">{item.userName}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="rounded-md border border-border bg-bg-tertiary/70 px-2 py-0.5 text-xs">
                        {item.actionLabel}
                      </span>
                    </td>
                    <td className="max-w-[28rem] px-3 py-2 text-text-secondary">
                      <div className="truncate" title={item.detail || ''}>
                        {item.detail || '—'}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => void handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-text-muted transition-colors hover:border-red-400/50 hover:text-red-300 disabled:opacity-50"
                        title="삭제"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
