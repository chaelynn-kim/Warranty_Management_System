import * as XLSX from 'xlsx'
import type { ExternalTestRecord } from '../types'
import { normalizeDate } from './helpers'

export function downloadExternalTestExcel(records: ExternalTestRecord[]) {
  const rows = records.map((record) => ({
    NO: record.no,
    용도: record.purpose,
    규격명: record.sampleName,
    색상명: record.colorName,
    작업장: record.workshop,
    생산일자: record.productionDate ? normalizeDate(record.productionDate) : '',
    품목코드: record.itemCode,
    품목명: record.itemName,
    수지: record.resin,
    의뢰날짜: record.requestDate ? normalizeDate(record.requestDate) : '',
    접수일자: record.receiptDate ? normalizeDate(record.receiptDate) : '',
    완료일자: record.completionDate ? normalizeDate(record.completionDate) : '',
    진행여부: record.status,
    의뢰기관: record.institution,
    비고: record.notes,
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '외부공인기관시험')

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  XLSX.writeFile(workbook, `외부공인기관_시험_${date}.xlsx`)
}
