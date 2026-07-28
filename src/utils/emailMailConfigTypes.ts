export type WarrantyEmailTemplateId = 'pending' | 'completed'

export interface WarrantyEmailTemplateConfig {
  /** 수신 (쉼표/세미콜론 구분). {{requester_email}} 사용 가능 */
  to: string
  /** 참조 (쉼표/세미콜론 구분). {{requester_email}} 사용 가능 */
  cc: string
}

export interface WarrantyEmailMailConfigRecord {
  templates: Record<WarrantyEmailTemplateId, WarrantyEmailTemplateConfig>
}

export const WARRANTY_EMAIL_TEMPLATE_META: {
  id: WarrantyEmailTemplateId
  label: string
  emailJsHint: string
}[] = [
  {
    id: 'pending',
    label: '의뢰 접수 처리 시',
    emailJsHint: ' * EmailJS_template_ksmludl (pending)',
  },
  {
    id: 'completed',
    label: '발행 완료·보증 불가 처리 시',
    emailJsHint: ' * EmailJS_template_j83vyvd (completed)',
  },
]

export function createDefaultWarrantyEmailMailConfig(): WarrantyEmailMailConfigRecord {
  return {
    templates: {
      pending: {
        to: 'sachunsa@seah.co.kr, chaelynn.kim@seah.co.kr',
        cc: '{{requester_email}}',
      },
      completed: {
        to: '{{requester_email}}',
        cc: '',
      },
    },
  }
}
