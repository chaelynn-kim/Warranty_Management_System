import emailjs from '@emailjs/browser'
import type { WarrantyIssuanceRequest } from '../types'
import { WARRANTY_SITE_OWNER_SENDER_NAME, WARRANTY_SITE_URL } from './authValidation'
import { formatDisplayDate } from './helpers'
import {
  formatRequestDetailRegion,
  formatRequestResin,
} from './warrantyRequestStorage'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID ?? ''
const PENDING_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID ?? ''
const COMPLETED_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_COMPLETED_TEMPLATE_ID ?? ''
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY ?? ''

if (PUBLIC_KEY) {
  emailjs.init({ publicKey: PUBLIC_KEY })
}

export function isEmailJsConfigured(): boolean {
  return Boolean(SERVICE_ID && PENDING_TEMPLATE_ID && PUBLIC_KEY)
}

export function isEmailJsCompletionConfigured(): boolean {
  return Boolean(SERVICE_ID && COMPLETED_TEMPLATE_ID && PUBLIC_KEY)
}

/** 모든 자동 발송 메일의 From Name (EmailJS {{name}} / {{from_name}}) */
export function getEmailSenderDisplayName(): string {
  return WARRANTY_SITE_OWNER_SENDER_NAME
}

/** EmailJS 템플릿 변수명과 1:1로 맞춥니다. */
export type WarrantyRequestEmailParams = {
  request_date: string
  requester_name: string
  color_name: string
  resin: string
  detail_region: string
  /** From Name — 템플릿이 {{name}} 이면 이 값 사용 */
  name: string
  from_name: string
  reply_to: string
  /** Cc — 템플릿 Cc 필드에 {{cc_email}} */
  cc_email: string
  /** 링크 href — 템플릿: <a href="{{website_url}}">{{website_link_label}}</a> */
  website_url: string
  website_link_label: string
}

export type WarrantyCompletedEmailParams = {
  request_date: string
  requester_name: string
  color_name: string
  resin: string
  detail_region: string
  name: string
  from_name: string
  /** To — 템플릿 To 필드에 {{to_email}} (의뢰 등록자) */
  to_email: string
  website_url: string
  website_link_label: string
}

function buildSharedEmailParams(
  request: WarrantyIssuanceRequest,
  requesterEmail: string
): WarrantyRequestEmailParams {
  const fromName = getEmailSenderDisplayName()

  return {
    request_date: formatDisplayDate(request.requestDate),
    requester_name: request.requesterName.trim() || '-',
    color_name: request.colorName.trim() || '-',
    resin: formatRequestResin(request),
    detail_region: formatRequestDetailRegion(request),
    name: fromName,
    from_name: fromName,
    reply_to: requesterEmail,
    cc_email: requesterEmail,
    website_url: WARRANTY_SITE_URL,
    website_link_label: '보증서 관리 시스템 바로가기',
  }
}

export function buildWarrantyRequestEmailParams(
  request: WarrantyIssuanceRequest,
  options?: { requesterEmail?: string }
): WarrantyRequestEmailParams {
  const requesterEmail = options?.requesterEmail?.trim() ?? ''
  return buildSharedEmailParams(request, requesterEmail)
}

export function buildWarrantyCompletedEmailParams(
  request: WarrantyIssuanceRequest,
  options: { requesterEmail: string }
): WarrantyCompletedEmailParams {
  const requesterEmail = options.requesterEmail.trim()
  const fromName = getEmailSenderDisplayName()

  return {
    request_date: formatDisplayDate(request.requestDate),
    requester_name: request.requesterName.trim() || '-',
    color_name: request.colorName.trim() || '-',
    resin: formatRequestResin(request),
    detail_region: formatRequestDetailRegion(request),
    name: fromName,
    from_name: fromName,
    to_email: requesterEmail,
    website_url: WARRANTY_SITE_URL,
    website_link_label: '보증서 관리 시스템 바로가기',
  }
}

/** 보증서 의뢰 등록(승인 대기) 시 품질팀 알림 메일 */
export async function sendWarrantyRequestPendingEmail(
  request: WarrantyIssuanceRequest,
  options?: { requesterEmail?: string }
): Promise<void> {
  if (!isEmailJsConfigured()) {
    throw new Error('EmailJS 환경 변수(VITE_EMAILJS_*)가 설정되지 않았습니다.')
  }

  const templateParams = buildWarrantyRequestEmailParams(request, options)

  await emailjs.send(SERVICE_ID, PENDING_TEMPLATE_ID, templateParams, { publicKey: PUBLIC_KEY })
}

/** 품질 작성 후 발행 완료·보증 불가 최초 저장 시 요청자 알림 메일 */
export async function sendWarrantyRequestCompletedEmail(
  request: WarrantyIssuanceRequest,
  options?: { requesterEmail?: string }
): Promise<void> {
  if (!isEmailJsCompletionConfigured()) {
    throw new Error(
      'EmailJS 발행 완료 템플릿(VITE_EMAILJS_COMPLETED_TEMPLATE_ID)이 설정되지 않았습니다.'
    )
  }

  const requesterEmail = options?.requesterEmail?.trim() ?? ''
  if (!requesterEmail) {
    throw new Error('요청자 이메일이 없어 발행 완료 알림을 보낼 수 없습니다.')
  }

  const templateParams = buildWarrantyCompletedEmailParams(request, { requesterEmail })

  await emailjs.send(SERVICE_ID, COMPLETED_TEMPLATE_ID, templateParams, { publicKey: PUBLIC_KEY })
}
