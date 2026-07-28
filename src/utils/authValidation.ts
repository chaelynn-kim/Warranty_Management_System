import type { Auth } from 'firebase/auth'
import { signOut } from 'firebase/auth'
import { getRoleEmailSet } from './permissionConfigStorage'

export const COMPANY_EMAIL_SUFFIX = '@seah.co.kr'
/** 기본 관리자·메일 테스트 수신 (권한 설정의 관리자 목록과 별도로 메일 테스트에 사용) */
export const WARRANTY_ADMIN_EMAIL = 'chaelynn.kim@seah.co.kr'
/** 이 웹사이트 자동 발송 메일의 발신자 표시명 */
export const WARRANTY_SITE_OWNER_SENDER_NAME = '김채린/세아씨엠'
/** 배포된 보증서 시스템 URL (메일 링크용) */
export const WARRANTY_SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.trim() ||
  'https://warranty-management-common.web.app'
export const EXTERNAL_TEST_TAB_ALLOWED_EMAIL = WARRANTY_ADMIN_EMAIL

export const QUALITY_MANAGEMENT_ONLY_MESSAGE = '품질경영팀만 수정 가능합니다.'
export const TEAM_LEADER_APPROVE_ONLY_MESSAGE = '품질경영팀 팀장님만 승인 가능합니다.'
export const RECEIPT_ASSIGNEE_ONLY_MESSAGE = '담당자만 접수 가능합니다.'

function normalizeEmail(email: string | undefined | null): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

export function canManageWarrantyIssuanceQuality(email: string | undefined | null): boolean {
  return getRoleEmailSet('quality').has(normalizeEmail(email))
}

export function canTeamLeaderApproveWarrantyRequest(email: string | undefined | null): boolean {
  return getRoleEmailSet('teamLeader').has(normalizeEmail(email))
}

export function canReceiveWarrantyRequest(email: string | undefined | null): boolean {
  return getRoleEmailSet('receiptAssignee').has(normalizeEmail(email))
}

export function isCompanyEmail(email: string | undefined | null): boolean {
  return typeof email === 'string' && email.endsWith(COMPANY_EMAIL_SUFFIX)
}

export function isWarrantyAdmin(email: string | undefined | null): boolean {
  return getRoleEmailSet('admin').has(normalizeEmail(email))
}

export function canAccessExternalTestTab(email: string | undefined | null): boolean {
  return isWarrantyAdmin(email)
}

export function canEditWarrantyPeriod(email: string | undefined | null): boolean {
  return isWarrantyAdmin(email)
}

/** Warranty Guide 파일 업로드 — 관리자 전용 */
export function canUploadWarrantyGuide(email: string | undefined | null): boolean {
  return isWarrantyAdmin(email)
}

/** 보증서 PPTX 양식 관리 — 관리자 전용 */
export function canEditWarrantyCertificateTemplate(email: string | undefined | null): boolean {
  return isWarrantyAdmin(email)
}

/** 메일 수신인·템플릿 관리 — 관리자 전용 */
export function canEditWarrantyEmailMail(email: string | undefined | null): boolean {
  return isWarrantyAdmin(email)
}

/** 권한 관리 탭 — 관리자 전용 */
export function canEditPermissionConfig(email: string | undefined | null): boolean {
  return isWarrantyAdmin(email)
}

export function canEditWarrantyIssuanceLog(email: string | undefined | null): boolean {
  return isWarrantyAdmin(email)
}

/** 보증 발행 의뢰서 본문(의뢰 영역) 수정 — 세아 회사 계정 전원 */
export function canEditWarrantyRequestContent(email: string | undefined | null): boolean {
  return isCompanyEmail(email)
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
