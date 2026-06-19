import type { WarrantyIssuanceRequestRecord } from '../types'
import { warrantyRecordToRequest } from './warrantyRecordToRequest'
import { loadWarrantyRecordsForMigration, saveWarrantyRecords } from './warrantyStorage'
import { loadWarrantyRequestRecords, saveWarrantyRequestRecords } from './warrantyRequestStorage'

const MIGRATION_FLAG = 'warranty-log-to-requests-v1'

function readExistingRequests(): WarrantyIssuanceRequestRecord[] {
  return loadWarrantyRequestRecords()
}

export function runWarrantyLogMigrationIfNeeded(): number {
  if (localStorage.getItem(MIGRATION_FLAG)) return 0

  try {
    const logRecords = loadWarrantyRecordsForMigration()
    if (logRecords.length === 0) {
      localStorage.setItem(MIGRATION_FLAG, '1')
      return 0
    }

    const existingRequests = readExistingRequests()
    const existingIds = new Set(existingRequests.map((record) => record.id))
    const migrated = logRecords
      .filter((record) => !existingIds.has(record.id))
      .map(warrantyRecordToRequest)

    saveWarrantyRequestRecords([...migrated, ...existingRequests])
    saveWarrantyRecords([])
    localStorage.setItem(MIGRATION_FLAG, '1')
    return migrated.length
  } catch (error) {
    console.error('발행 내역 → 의뢰 이관 중 오류가 발생했습니다.', error)
    return 0
  }
}
