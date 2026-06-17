import type { Auth } from 'firebase/auth'
import { signOut } from 'firebase/auth'

export const COMPANY_EMAIL_SUFFIX = '@seah.co.kr'

export function isCompanyEmail(email: string | undefined | null): boolean {
  return typeof email === 'string' && email.endsWith(COMPANY_EMAIL_SUFFIX)
}

export async function enforceCompanyEmail(
  auth: Auth,
  email: string | undefined | null
): Promise<boolean> {
  if (!isCompanyEmail(email)) {
    await signOut(auth)
    window.alert('회사 계정(@seah.co.kr)만 로그인 가능합니다.')
    return false
  }
  return true
}
