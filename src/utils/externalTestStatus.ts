import { EXTERNAL_TEST_STATUSES, normalizeExternalTestStatus } from '../constants/externalTestOptions'

export function countExternalTestByStatus(records: { status: string }[]): Record<string, number> {
  const counts: Record<string, number> = {
    진행대기: 0,
    진행중: 0,
    종결: 0,
    취소: 0,
  }

  for (const record of records) {
    const status = normalizeExternalTestStatus(record.status)
    if (status in counts) {
      counts[status] += 1
    }
  }

  return counts
}

export { EXTERNAL_TEST_STATUSES, normalizeExternalTestStatus }
