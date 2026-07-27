import type { WarrantyFileAttachment } from '../../types'

export type WarrantyCertificateTemplateProduct = 'PAINT' | 'PRINT'
export type WarrantyCertificateTemplateLanguage = 'ko' | 'en'

export type WarrantyCertificateTemplateSlot =
  `${WarrantyCertificateTemplateProduct}:${WarrantyCertificateTemplateLanguage}`

/** Firestore에 함께 저장되는 PPTX 바이트 (웹 Storage getBytes CORS 회피) */
export interface WarrantyCertificateTemplateEntry extends WarrantyFileAttachment {
  dataBase64?: string
}

export interface WarrantyCertificateTemplatesRecord {
  templates: Partial<Record<WarrantyCertificateTemplateSlot, WarrantyCertificateTemplateEntry | null>>
}

export const WARRANTY_CERTIFICATE_TEMPLATE_SLOTS: {
  slot: WarrantyCertificateTemplateSlot
  productItem: WarrantyCertificateTemplateProduct
  language: WarrantyCertificateTemplateLanguage
  label: string
}[] = [
  { slot: 'PAINT:ko', productItem: 'PAINT', language: 'ko', label: 'PAINT · 국문' },
  { slot: 'PAINT:en', productItem: 'PAINT', language: 'en', label: 'PAINT · 영문' },
  { slot: 'PRINT:ko', productItem: 'PRINT', language: 'ko', label: 'PRINT · 국문' },
  { slot: 'PRINT:en', productItem: 'PRINT', language: 'en', label: 'PRINT · 영문' },
]

export function buildCertificateTemplateSlot(
  productItem: string,
  language: WarrantyCertificateTemplateLanguage
): WarrantyCertificateTemplateSlot | null {
  if (productItem !== 'PAINT' && productItem !== 'PRINT') return null
  return `${productItem}:${language}`
}
