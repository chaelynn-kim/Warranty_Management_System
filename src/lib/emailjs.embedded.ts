/**
 * EmailJS public client config (browser에서 사용하는 공개 키·템플릿 ID).
 * .env 값이 있으면 우선하고, 비어 있을 때 이 폴백을 사용합니다.
 */
export const EMBEDDED_EMAILJS_CONFIG = {
  serviceId: 'service_jzk2ieo',
  pendingTemplateId: 'template_ksmludl',
  completedTemplateId: 'template_j83vyvd',
  publicKey: 'qVWk-kEBfUt9y7nAa',
} as const
