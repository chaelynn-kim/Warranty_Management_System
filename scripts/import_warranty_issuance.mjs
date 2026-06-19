/**
 * 보증서 발행 관리 Excel → src/data/warrantyIssuance.json
 *
 * Usage: node scripts/import_warranty_issuance.mjs [path/to/file.xlsx]
 */
import * as XLSX from 'xlsx'
import { readFileSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const defaultInput = resolve(__dirname, '../../Downloads/보증서 발행 관리_개발.xlsx')
const outputPath = resolve(__dirname, '../src/data/warrantyIssuance.json')
const inputPath = process.argv[2] ? resolve(process.argv[2]) : defaultInput

function subtractDays(dateStr, days) {
  const normalized = normalizeDate(dateStr)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return ''
  const [year, month, day] = normalized.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() - days)
  return date.toISOString().slice(0, 10)
}

function normalizeDate(dateStr) {
  if (!dateStr) return ''
  const cleaned = String(dateStr).trim().replace(/-/g, '')
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`
  }
  return String(dateStr).trim()
}

function formatFadeDisplay(value) {
  if (!value) return ''
  let text = String(value).replace(/\r/g, '').trim().replace(/△/g, 'Δ')
  if (text.includes('\n')) return text
  const parenMatch = text.match(/^(.+?)(\([^)]*\))\s*$/)
  if (parenMatch) return `${parenMatch[1].trim()}\n${parenMatch[2].trim()}`
  return text
}

function formatPeelValue(raw) {
  const trimmed = String(raw ?? '').trim()
  if (!trimmed) return ''
  if (/^x$/i.test(trimmed)) return 'X'
  const digits = trimmed.replace(/y$/i, '')
  if (/^\d+$/.test(digits)) return `${digits}Y`
  return trimmed
}

function cleanText(v) {
  return String(v ?? '').replace(/\r/g, '').trim()
}

function cleanCustomer(v) {
  const t = cleanText(v)
  return t === '-' ? '' : t
}

const wb = XLSX.read(readFileSync(inputPath))
const sheetName = wb.SheetNames.includes('Sheet1') ? 'Sheet1' : wb.SheetNames[0]
const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '', raw: false })
const dataRows = rows.filter((r, i) => i >= 4 && cleanText(r[5]) !== '')

const records = dataRows.map((row) => {
  const issueDate = normalizeDate(cleanText(row[23]) || cleanText(row[0]))
  const requestDateFromExcel = normalizeDate(cleanText(row[0]))
  const requestDate =
    requestDateFromExcel && requestDateFromExcel !== issueDate
      ? requestDateFromExcel
      : subtractDays(issueDate, 7)

  return {
    id: randomUUID(),
    requestDate,
    requester: cleanText(row[1]),
    region: cleanText(row[2]),
    detailRegion: cleanText(row[3]),
    customer: cleanCustomer(row[4]),
    colorName: cleanText(row[5]),
    paintCompany: cleanText(row[6]),
    resin: cleanText(row[7]),
    perforation: formatPeelValue(row[8]),
    peelFlake: formatPeelValue(row[9]),
    colorFadingRoof: formatFadeDisplay(row[10]),
    colorFadingWall: formatFadeDisplay(row[11]),
    chalkRoof: formatFadeDisplay(row[12]),
    chalkWall: formatFadeDisplay(row[13]),
    additionalRequest: cleanText(row[14]),
    fileAttachment: cleanText(row[21]),
    issueDate,
    reviewResult: cleanText(row[24]),
  }
})

writeFileSync(outputPath, `${JSON.stringify(records, null, 2)}\n`)
console.log(`Imported ${records.length} records from ${inputPath}`)
console.log(`Written to ${outputPath}`)
