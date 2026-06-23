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
  from_name: string
  reply_to: string
}

export function buildWarrantyRequestEmailParams(
  request: WarrantyIssuanceRequest,
  options?: { replyToEmail?: string }
): WarrantyRequestEmailParams {
  return {
    request_date: formatDisplayDate(request.requestDate),
    requester_name: request.requesterName.trim() || '-',
    color_name: request.colorName.trim() || '-',
    resin: formatRequestResin(request),
    detail_region: formatRequestDetailRegion(request),
    from_name: '세아씨엠 보증서 시스템',
    reply_to: options?.replyToEmail?.trim() || '',
  }
}

/** 보증서 의뢰 등록(접수 대기) 시 품질팀 알림 메일 */
export async function sendWarrantyRequestPendingEmail(
  request: WarrantyIssuanceRequest,
  options?: { replyToEmail?: string }
): Promise<void> {
  if (!isEmailJsConfigured()) {
    console.warn('[EmailJS] VITE_EMAILJS_* 환경 변수가 설정되지 않았습니다.')
    return
  }

  const templateParams = buildWarrantyRequestEmailParams(request, options)

  await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, { publicKey: PUBLIC_KEY })
}
