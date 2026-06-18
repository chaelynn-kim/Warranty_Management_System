import * as XLSX from 'xlsx'
import type { WarrantyRecord } from '../types'
import { normalizeDate } from './helpers'

export function downloadWarrantyExcel(records: WarrantyRecord[]) {
  const rows = records.map((record) => ({
    발행일자: record.issueDate ? normalizeDate(record.issueDate) : '',
    지역: record.region,
      수요가: record.customer,
      색상명: record.colorName,
      도료사: record.paintCompany,
      수지: record.resin,
      '총 도막두께': record.totalThickness,
      프라이머: record.primerThickness,
      COAT: record.coat,
      BAKE: record.bake,
      '보증 연한-박리': record.supplierPeel,
      '보증 연한-변색(지붕)': record.supplierFadeRoof,
      '보증 연한-변색(벽체)': record.supplierFadeWall,
      '보증 연한-백화(지붕)': record.supplierChalkRoof,
      '보증 연한-백화(벽체)': record.supplierChalkWall,
      비고: record.notes,
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '보증서 발행 내역')

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  XLSX.writeFile(workbook, `보증서_발행_관리_${date}.xlsx`)
}
