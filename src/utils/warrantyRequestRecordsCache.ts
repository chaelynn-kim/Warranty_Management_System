import type { WarrantyIssuanceRequestRecord } from '../types'
import { loadWarrantyRequestRecords, saveWarrantyRequestRecords } from './warrantyRequestStorage'
import { runWarrantyLogMigrationIfNeeded } from './warrantyLogMigration'

let cache: WarrantyIssuanceRequestRecord[] | null = null

export function getWarrantyRequestRecords(): WarrantyIssuanceRequestRecord[] {
  if (!cache) {
    try {
      runWarrantyLogMigrationIfNeeded()
      cache = loadWarrantyRequestRecords()
    } catch (error) {
      console.error('발행 의뢰 데이터를 불러오지 못했습니다.', error)
      cache = []
    }
  }
  return cache
}

export function persistWarrantyRequestRecords(records: WarrantyIssuanceRequestRecord[]): void {
  saveWarrantyRequestRecords(records)
  cache = records
}

export function reloadWarrantyRequestRecords(): WarrantyIssuanceRequestRecord[] {
  cache = null
  return getWarrantyRequestRecords()
}
