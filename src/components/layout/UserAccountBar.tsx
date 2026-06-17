import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Clock, LogOut, Mail, Shield } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getUserInitials, getUserProfileLabel } from '../../utils/userDisplay'

function formatLastLogin(lastSignInTime: string | undefined): string {
  if (!lastSignInTime) return '-'
  return new Date(lastSignInTime).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function UserAccountBar() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!user) return null

  const profileLabel = getUserProfileLabel(user)
  const initials = getUserInitials(user)
  const email = user.email ?? ''
  const lastLoginText = formatLastLogin(user.metadata.lastSignInTime)

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="계정 메뉴 열기"
        className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-tertiary py-0.5 pr-2 pl-0.5 transition-colors hover:border-accent/40 hover:bg-bg-secondary ${
          open ? 'border-accent/40 bg-bg-secondary' : ''
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg-primary">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-accent">{initials}</span>
          )}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className="absolute top-[calc(100%+0.5rem)] right-0 z-50 w-[min(92vw,21rem)] rounded-xl border border-border bg-bg-secondary p-4 shadow-xl"
          role="menu"
          aria-label="계정 메뉴"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-bg-tertiary">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-accent">{initials}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-text-primary">{profileLabel}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{email}</span>
              </p>
            </div>
          </div>

          <div className="my-3 h-px bg-border" />

          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted">
                <Clock className="h-3.5 w-3.5" />
                마지막 접속
              </span>
              <span className="text-xs font-semibold text-text-primary">{lastLoginText}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted">
                <Shield className="h-3.5 w-3.5" />
                인증
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-bg-tertiary px-2 py-0.5 text-xs font-semibold text-text-primary">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-[#4285f4]">
                  G
                </span>
                Google Workspace
              </span>
            </div>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              void signOut()
            }}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-bold text-text-primary transition-colors hover:border-accent/35 hover:bg-bg-tertiary"
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </button>
        </div>
      )}
    </div>
  )
}
