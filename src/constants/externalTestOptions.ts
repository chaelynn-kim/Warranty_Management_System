import { normalizeOptionValue } from './warrantyOptions'

export const EXTERNAL_TEST_STATUSES = ['진행대기', '진행중', '종결', '취소'] as const

export type ExternalTestStatus = (typeof EXTERNAL_TEST_STATUSES)[number]

export function normalizeExternalTestStatus(status: string): string {
  const trimmed = status.trim()
  if (!trimmed) return '진행중'
  if ((EXTERNAL_TEST_STATUSES as readonly string[]).includes(trimmed)) return trimmed
  return trimmed
}

export function isExternalTestStatus(status: string): status is ExternalTestStatus {
  return (EXTERNAL_TEST_STATUSES as readonly string[]).includes(normalizeExternalTestStatus(status))
}

export const EXTERNAL_TEST_INSTITUTIONS = ['KTR', 'KCL', 'FITI', 'INTERTEK'] as const

export const EXTERNAL_TEST_INSTITUTION_OTHER = '기타(직접입력)'

export function isPresetInstitution(value: string): boolean {
  const normalized = normalizeOptionValue(value)
  return (EXTERNAL_TEST_INSTITUTIONS as readonly string[]).includes(normalized)
}

export function institutionSelectValue(institution: string): string {
  const normalized = normalizeOptionValue(institution)
  if (!normalized) return ''
  if (isPresetInstitution(normalized)) return normalized
  return EXTERNAL_TEST_INSTITUTION_OTHER
}

export function institutionCustomValue(institution: string): string {
  const normalized = normalizeOptionValue(institution)
  if (!normalized || isPresetInstitution(normalized)) return ''
  return normalized
}
