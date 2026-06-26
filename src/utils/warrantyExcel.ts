import * as XLSX from 'xlsx'
import type { WarrantyIssuanceRequestRecord, WarrantyRecord } from '../types'
import { normalizeDate } from './helpers'
import { formatAttachmentNames } from './warrantyAttachments'
import { formatRequestDetailRegion, formatRequestPaintCompany, formatRequestResin } from './warrantyRequestStorage'

export function downloadWarrantyRequestExcel(records: WarrantyIssuanceRequestRecord[]) {
  const rows = records.map((record) => ({
    요청일자: record.requestDate ? normalizeDate(record.requestDate) : '',
    발행일자: record.issueDate ? normalizeDate(record.issueDate) : '',
    요청자: record.requesterName,
    색상명: record.colorName,
    도료사: formatRequestPaintCompany(record),
    수지: formatRequestResin(record),
    세부국가명: formatRequestDetailRegion(record),
    수요가명: record.customer,
    '당사 Warranty (국문)': formatAttachmentNames(record.companyWarrantyAttachmentKo),
    '당사 Warranty (영문)': formatAttachmentNames(record.companyWarrantyAttachmentEn),
    '도료사 Warranty (국문)': formatAttachmentNames(record.supplierWarrantyAttachmentKo),
    '도료사 Warranty (영문)': formatAttachmentNames(record.supplierWarrantyAttachmentEn),
    상태: record.status,
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '보증서 발행 의뢰')

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  XLSX.writeFile(workbook, `보증서_발행_의뢰_${date}.xlsx`)
}

export function downloadWarrantyExcel(records: WarrantyRecord[]) {
  const rows = records.map((record) => ({
    요청일자: record.requestDate ? normalizeDate(record.requestDate) : '',
    요청자: record.requester,
    국가: record.region,
    세부국가명: record.detailRegion,
    수요가명: record.customer,
    색상명: record.colorName,
    도료사: record.paintCompany,
    수지: record.resin,
    '추가 요청 사항': record.additionalRequest,
    파일첨부: formatAttachmentNames(record.fileAttachment),
    발행일자: record.issueDate ? normalizeDate(record.issueDate) : '',
    검토결과: record.reviewResult,
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '보증서 발행 내역')

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  XLSX.writeFile(workbook, `보증서_발행_관리_${date}.xlsx`)
}
