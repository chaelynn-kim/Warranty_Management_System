/**
 * 개인정보 기밀화(마스킹) — 사내 마스킹 규칙 예시 기준
 * 이메일: ID 앞 2자리 제외 나머지 * 처리, 도메인은 첫 글자 + ...
 * 예) hr****@e...
 */

const EMAIL_RE =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

export function maskEmail(email: string | undefined | null): string {
  const trimmed = typeof email === 'string' ? email.trim() : ''
  if (!trimmed) return ''

  const at = trimmed.indexOf('@')
  if (at <= 0 || at === trimmed.length - 1) return '****'

  const local = trimmed.slice(0, at)
  const domain = trimmed.slice(at + 1)
  const head = local.slice(0, Math.min(2, local.length))
  const maskedLocal = `${head}${'*'.repeat(Math.max(4, local.length - head.length))}`
  const domainHead = domain.charAt(0) || '*'
  return `${maskedLocal}@${domainHead}...`
}

/** 성명: 첫 글자만 남기고 나머지 * */
export function maskPersonName(name: string | undefined | null): string {
  const trimmed = typeof name === 'string' ? name.trim() : ''
  if (!trimmed) return ''
  if (trimmed.length === 1) return '*'
  return `${trimmed.charAt(0)}${'*'.repeat(Math.max(2, trimmed.length - 1))}`
}

/** 본문 안 이메일도 동일 규칙으로 치환 */
export function maskEmailsInText(text: string | undefined | null): string {
  if (typeof text !== 'string' || !text) return text ?? ''
  return text.replace(EMAIL_RE, (match) => maskEmail(match))
}

export function isMaskedEmail(value: string | undefined | null): boolean {
  if (typeof value !== 'string' || !value.includes('@')) return false
  return value.includes('*') && value.includes('...')
}
