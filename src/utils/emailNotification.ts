import emailjs from '@emailjs/browser'
import { EMBEDDED_EMAILJS_CONFIG } from '../lib/emailjs.embedded'
import type { WarrantyIssuanceRequest } from '../types'
import {
  WARRANTY_ADMIN_EMAIL,
  WARRANTY_SITE_OWNER_SENDER_NAME,
  WARRANTY_SITE_URL,
  isWarrantyAdmin,
} from './authValidation'
import {
  applyEmailTemplatePlaceholders,
  loadWarrantyEmailMailConfig,
  parseEmailList,
} from './emailMailConfigStorage'
import type {
  WarrantyEmailTemplateConfig,
  WarrantyEmailTemplateId,
} from './emailMailConfigTypes'
import { formatDisplayDate } from './helpers'
import {
  formatRequestDetailRegion,
  formatRequestResin,
} from './warrantyRequestStorage'

function envOr(raw: string | undefined, fallback: string): string {
  const trimmed = typeof raw === 'string' ? raw.trim() : ''
  return trimmed !== '' ? trimmed : fallback
}

const SERVICE_ID = envOr(import.meta.env.VITE_EMAILJS_SERVICE_ID, EMBEDDED_EMAILJS_CONFIG.serviceId)
const PENDING_TEMPLATE_ID = envOr(
  import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  EMBEDDED_EMAILJS_CONFIG.pendingTemplateId
)
const COMPLETED_TEMPLATE_ID = envOr(
  import.meta.env.VITE_EMAILJS_COMPLETED_TEMPLATE_ID,
  EMBEDDED_EMAILJS_CONFIG.completedTemplateId
)
const PUBLIC_KEY = envOr(import.meta.env.VITE_EMAILJS_PUBLIC_KEY, EMBEDDED_EMAILJS_CONFIG.publicKey)

const TEST_SUBJECT = '[TEST] Warranty Management System'
const TEST_MESSAGE = '관리자가 테스트 메일을 발송했습니다.'

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

type SharedFieldValues = {
  request_date: string
  requester_name: string
  color_name: string
  resin: string
  detail_region: string
  requester_email: string
  website_url: string
  website_link_label: string
  name: string
  from_name: string
  reply_to: string
}

/** EmailJS로 전달하는 파라미터 — 제목·본문은 EmailJS 템플릿, 수신·참조만 웹 설정 */
export type WarrantyManagedEmailParams = SharedFieldValues & {
  to_email: string
  cc_email: string
  /** 테스트 발송 시에만 설정 */
  subject?: string
  message?: string
  message_html?: string
}

/** @deprecated 하위 호환 — WarrantyManagedEmailParams 사용 */
export type WarrantyRequestEmailParams = WarrantyManagedEmailParams

/** @deprecated 하위 호환 — WarrantyManagedEmailParams 사용 */
export type WarrantyCompletedEmailParams = WarrantyManagedEmailParams

function buildFieldValues(
  request: WarrantyIssuanceRequest,
  requesterEmail: string
): SharedFieldValues {
  const fromName = getEmailSenderDisplayName()
  return {
    request_date: formatDisplayDate(request.requestDate),
    requester_name: request.requesterName.trim() || '-',
    color_name: request.colorName.trim() || '-',
    resin: formatRequestResin(request),
    detail_region: formatRequestDetailRegion(request),
    requester_email: requesterEmail,
    website_url: WARRANTY_SITE_URL,
    website_link_label: '보증서 관리 시스템 바로가기',
    name: fromName,
    from_name: fromName,
    reply_to: requesterEmail,
  }
}

function toHtmlBody(plain: string): string {
  return plain
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}

function resolveRecipients(
  template: WarrantyEmailTemplateConfig,
  fields: SharedFieldValues,
  options?: { forceToEmail?: string; forceCcEmail?: string }
): { to_email: string; cc_email: string } {
  const toResolved =
    options?.forceToEmail !== undefined
      ? options.forceToEmail
      : applyEmailTemplatePlaceholders(template.to, fields)
  const ccResolved =
    options?.forceCcEmail !== undefined
      ? options.forceCcEmail
      : applyEmailTemplatePlaceholders(template.cc, fields)

  const toList = parseEmailList(toResolved)
  const ccList = parseEmailList(ccResolved).filter((email) => !toList.includes(email))

  if (toList.length === 0) {
    throw new Error('수신 이메일이 비어 있습니다. 메일 수신인 관리에서 설정해 주세요.')
  }

  return {
    to_email: toList.join(', '),
    cc_email: ccList.join(', '),
  }
}

function buildManagedEmailParamsFromTemplate(
  template: WarrantyEmailTemplateConfig,
  request: WarrantyIssuanceRequest,
  requesterEmail: string,
  options?: { forceToEmail?: string; forceCcEmail?: string }
): WarrantyManagedEmailParams {
  const fields = buildFieldValues(request, requesterEmail)
  const recipients = resolveRecipients(template, fields, options)
  return { ...fields, ...recipients }
}

async function buildManagedEmailParams(
  templateId: WarrantyEmailTemplateId,
  request: WarrantyIssuanceRequest,
  requesterEmail: string
): Promise<WarrantyManagedEmailParams> {
  const config = await loadWarrantyEmailMailConfig()
  return buildManagedEmailParamsFromTemplate(config.templates[templateId], request, requesterEmail)
}

function createSampleRequestForEmailTest(): WarrantyIssuanceRequest {
  return {
    requestDate: new Date().toISOString().slice(0, 10),
    requestTeam: '품질보증팀',
    requestTeamCustom: '',
    requesterName: '테스트 요청자',
    colorName: '테스트 색상명',
    resin: 'PE',
    resinCustom: '',
    paintCompany: '',
    paintCompanyCustom: '',
    material: '',
    materialCustom: '',
    coatingStructure: '',
    productItem: 'PAINT',
    region: '국내',
    detailRegion: '대한민국',
    detailRegionCustom: '',
    customer: '',
    usage: '',
    language: '국문',
    warrantyTermMode: '',
    warrantyTermCustom: '',
    warrantyTermAttachments: '',
    additionalRequest: '',
    additionalRequestAttachments: '',
    companyWarrantyAttachmentKo: '',
    companyWarrantyAttachmentEn: '',
    supplierWarrantyAttachmentKo: '',
    supplierWarrantyAttachmentEn: '',
    issueDate: '',
    qualityAuthor: '',
    totalCoatingThickness: '',
    primerThickness: '',
    companyWarrantyTerms: '',
    companyWarrantyTermsLookupKey: '',
    reviewResult: '',
  }
}

function emailJsTemplateIdFor(templateId: WarrantyEmailTemplateId): string {
  return templateId === 'pending' ? PENDING_TEMPLATE_ID : COMPLETED_TEMPLATE_ID
}

export function formatEmailJsError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim()
  if (typeof error === 'string' && error.trim()) return error.trim()
  if (error && typeof error === 'object') {
    const item = error as { text?: unknown; message?: unknown; status?: unknown }
    const text =
      (typeof item.text === 'string' && item.text.trim()) ||
      (typeof item.message === 'string' && item.message.trim()) ||
      ''
    if (text && item.status != null) return `EmailJS(${String(item.status)}): ${text}`
    if (text) return text
    try {
      return JSON.stringify(error)
    } catch {
      // fall through
    }
  }
  return '알 수 없는 오류로 메일 발송에 실패했습니다.'
}

/** 빈 Cc는 EmailJS/Gmail에서 수신자 오류를 유발할 수 있어 제외 */
function toEmailJsPayload(params: WarrantyManagedEmailParams): Record<string, string> {
  const payload: Record<string, string> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue
    if (key === 'cc_email' && !String(value).trim()) continue
    if (key === 'subject' || key === 'message' || key === 'message_html') {
      if (!String(value).trim()) continue
    }
    payload[key] = String(value)
  }
  return payload
}

async function sendWithEmailJs(
  templateId: string,
  params: WarrantyManagedEmailParams
): Promise<void> {
  try {
    await emailjs.send(SERVICE_ID, templateId, toEmailJsPayload(params), {
      publicKey: PUBLIC_KEY,
    })
  } catch (error) {
    throw new Error(formatEmailJsError(error))
  }
}

/**
 * 관리자 전용 테스트 발송 — 수신은 항상 chaelynn.kim@seah.co.kr 만.
 * 제목·본문은 고정 테스트 문구. (EmailJS Subject/Content가 {{subject}}/{{message}} 일 때 반영)
 */
export async function sendWarrantyEmailTest(
  templateId: WarrantyEmailTemplateId,
  options: {
    actorEmail: string | undefined | null
    draftTemplate?: WarrantyEmailTemplateConfig
  }
): Promise<{ to: string }> {
  if (!isWarrantyAdmin(options.actorEmail)) {
    throw new Error('테스트 발송은 관리자 계정만 사용할 수 있습니다.')
  }

  const configured =
    templateId === 'pending' ? isEmailJsConfigured() : isEmailJsCompletionConfigured()
  if (!configured) {
    throw new Error('EmailJS가 설정되지 않았습니다.')
  }

  const template =
    options.draftTemplate ??
    (await loadWarrantyEmailMailConfig()).templates[templateId]

  const sample = createSampleRequestForEmailTest()
  const templateParams = buildManagedEmailParamsFromTemplate(
    template,
    sample,
    WARRANTY_ADMIN_EMAIL,
    {
      forceToEmail: WARRANTY_ADMIN_EMAIL,
      forceCcEmail: '',
    }
  )

  templateParams.subject = TEST_SUBJECT
  templateParams.message = TEST_MESSAGE
  templateParams.message_html = toHtmlBody(TEST_MESSAGE)

  await sendWithEmailJs(emailJsTemplateIdFor(templateId), templateParams)

  return { to: WARRANTY_ADMIN_EMAIL }
}

export async function buildWarrantyRequestEmailParams(
  request: WarrantyIssuanceRequest,
  options?: { requesterEmail?: string }
): Promise<WarrantyManagedEmailParams> {
  const requesterEmail = options?.requesterEmail?.trim() ?? ''
  return buildManagedEmailParams('pending', request, requesterEmail)
}

export async function buildWarrantyCompletedEmailParams(
  request: WarrantyIssuanceRequest,
  options: { requesterEmail: string }
): Promise<WarrantyManagedEmailParams> {
  return buildManagedEmailParams('completed', request, options.requesterEmail.trim())
}

/** 보증서 의뢰 등록(승인 대기) 시 품질팀 알림 메일 */
export async function sendWarrantyRequestPendingEmail(
  request: WarrantyIssuanceRequest,
  options?: { requesterEmail?: string }
): Promise<{ to: string; cc: string }> {
  if (!isEmailJsConfigured()) {
    throw new Error('EmailJS 환경 변수(VITE_EMAILJS_*)가 설정되지 않았습니다.')
  }

  const templateParams = await buildWarrantyRequestEmailParams(request, options)
  console.info('[EmailJS] pending 발송', {
    to: templateParams.to_email,
    cc: templateParams.cc_email || '(없음)',
  })

  await sendWithEmailJs(PENDING_TEMPLATE_ID, templateParams)
  return { to: templateParams.to_email, cc: templateParams.cc_email }
}

/** 품질 작성 후 발행 완료·보증 불가로 전환 저장 시 요청자 알림 메일 */
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

  const templateParams = await buildWarrantyCompletedEmailParams(request, { requesterEmail })

  await sendWithEmailJs(COMPLETED_TEMPLATE_ID, templateParams)
}
