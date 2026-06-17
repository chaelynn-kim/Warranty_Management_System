import type { Auth } from 'firebase/auth'
import { signOut } from 'firebase/auth'

export const COMPANY_EMAIL_SUFFIX = '@seah.co.kr'
export const WARRANTY_ADMIN_EMAIL = 'chaelynn.kim@seah.co.kr'
export const EXTERNAL_TEST_TAB_ALLOWED_EMAIL = WARRANTY_ADMIN_EMAIL

export function isCompanyEmail(email: string | undefined | null): boolean {
  return typeof email === 'string' && email.endsWith(COMPANY_EMAIL_SUFFIX)
}

export function canAccessExternalTestTab(email: string | undefined | null): boolean {
  return email === EXTERNAL_TEST_TAB_ALLOWED_EMAIL
}

export function canEditWarrantyPeriod(email: string | undefined | null): boolean {
  return email === WARRANTY_ADMIN_EMAIL
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
