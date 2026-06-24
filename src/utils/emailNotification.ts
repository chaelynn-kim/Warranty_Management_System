import emailjs from '@emailjs/browser'
import type { WarrantyIssuanceRequest } from '../types'
import { formatDisplayDate } from './helpers'
import {
  formatRequestDetailRegion,
  formatRequestResin,
} from './warrantyRequestStorage'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID ?? ''
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID ?? ''
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY ?? ''

if (PUBLIC_KEY) {
  emailjs.init({ publicKey: PUBLIC_KEY })
}

export function isEmailJsConfigured(): boolean {
  return Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY)
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
}

export function buildWarrantyRequestEmailParams(
  request: WarrantyIssuanceRequest,
  options?: { requesterEmail?: string }
): WarrantyRequestEmailParams {
  const requesterEmail = options?.requesterEmail?.trim() ?? ''
  const fromName = '세아씨엠 보증서 시스템'

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
  }
}

/** 보증서 의뢰 등록(접수 대기) 시 품질팀 알림 메일 */
export async function sendWarrantyRequestPendingEmail(
  request: WarrantyIssuanceRequest,
  options?: { requesterEmail?: string }
): Promise<void> {
  if (!isEmailJsConfigured()) {
    throw new Error('EmailJS 환경 변수(VITE_EMAILJS_*)가 설정되지 않았습니다.')
  }

  const templateParams = buildWarrantyRequestEmailParams(request, options)

  await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, { publicKey: PUBLIC_KEY })
}
