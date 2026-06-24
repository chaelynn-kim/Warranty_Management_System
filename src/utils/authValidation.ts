import type { Auth } from 'firebase/auth'
import { signOut } from 'firebase/auth'

export const COMPANY_EMAIL_SUFFIX = '@seah.co.kr'
export const WARRANTY_ADMIN_EMAIL = 'chaelynn.kim@seah.co.kr'
/** 이 웹사이트 자동 발송 메일의 발신자 표시명 */
export const WARRANTY_SITE_OWNER_SENDER_NAME = '김채린/세아씨엠'
export const EXTERNAL_TEST_TAB_ALLOWED_EMAIL = WARRANTY_ADMIN_EMAIL

const WARRANTY_ISSUANCE_QUALITY_ADMIN_EMAILS = new Set([
  'sachunsa@seah.co.kr',
  'kss2000@seah.co.kr',
  'jeongyeon.hwang@seah.co.kr',
  'jonghyuk.lee@seah.co.kr',
  'jeongkyu.choi@seah.co.kr',
  'chaelynn.kim@seah.co.kr',
])

export const QUALITY_MANAGEMENT_ONLY_MESSAGE = '품질경영팀만 수정 가능합니다.'
export const TEAM_LEADER_APPROVE_ONLY_MESSAGE = '품질경영팀 팀장님만 승인 가능합니다.'
export const RECEIPT_ASSIGNEE_ONLY_MESSAGE = '담당자만 접수 가능합니다.'

const WARRANTY_TEAM_LEADER_EMAILS = new Set([
  'sachunsa@seah.co.kr',
  'chaelynn.kim@seah.co.kr',
])
const WARRANTY_RECEIPT_ASSIGNEE_EMAILS = new Set([
  'jonghyuk.lee@seah.co.kr',
  'chaelynn.kim@seah.co.kr',
])

function normalizeEmail(email: string | undefined | null): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

export function canManageWarrantyIssuanceQuality(email: string | undefined | null): boolean {
  return WARRANTY_ISSUANCE_QUALITY_ADMIN_EMAILS.has(normalizeEmail(email))
}

export function canTeamLeaderApproveWarrantyRequest(email: string | undefined | null): boolean {
  return WARRANTY_TEAM_LEADER_EMAILS.has(normalizeEmail(email))
}

export function canReceiveWarrantyRequest(email: string | undefined | null): boolean {
  return WARRANTY_RECEIPT_ASSIGNEE_EMAILS.has(normalizeEmail(email))
}

export function isCompanyEmail(email: string | undefined | null): boolean {
  return typeof email === 'string' && email.endsWith(COMPANY_EMAIL_SUFFIX)
}

export function isWarrantyAdmin(email: string | undefined | null): boolean {
  return normalizeEmail(email) === normalizeEmail(WARRANTY_ADMIN_EMAIL)
}

export function canAccessExternalTestTab(email: string | undefined | null): boolean {
  return isWarrantyAdmin(email)
}

export function canEditWarrantyPeriod(email: string | undefined | null): boolean {
  return isWarrantyAdmin(email)
}

export function canEditWarrantyIssuanceLog(email: string | undefined | null): boolean {
  return isWarrantyAdmin(email)
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
