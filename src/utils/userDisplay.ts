import type { User } from 'firebase/auth'

const COMPANY_LABEL = '세아씨엠'

function splitProfileSegments(raw: string): string[] {
  return raw
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
}

function getUserNameOnly(rawDisplayName: string): string {
  const nameParts = splitProfileSegments(rawDisplayName).filter(
    (segment) => segment !== COMPANY_LABEL
  )
  return nameParts[0] ?? rawDisplayName.trim()
}

export function getUserDisplayName(user: User): string {
  const displayName = user.displayName?.trim()
  if (displayName) return getUserNameOnly(displayName)

  const localPart = user.email?.split('@')[0] ?? ''
  if (!localPart) return '사용자'

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

export function getUserInitials(user: User): string {
  const name = getUserDisplayName(user)
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function getUserProfileLabel(user: User): string {
  return `${getUserDisplayName(user)}/${COMPANY_LABEL}`
}
