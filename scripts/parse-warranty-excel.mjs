import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import XLSX from 'xlsx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const input = process.argv[2] || path.join(process.env.HOME || '', 'Downloads', '보증 연한.xlsx')
const output = path.join(root, 'src/data/warrantyPeriodFromExcel.json')

const workbook = XLSX.readFile(input, { cellDates: true })
const sheets = {}

for (const name of workbook.SheetNames) {
  const sheet = workbook.Sheets[name]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false })
  sheets[name] = rows.filter((row) => row.some((cell) => cell !== null && String(cell).trim() !== ''))
}

const payload = { source: input, parser: 'xlsx', sheets }
fs.writeFileSync(output, JSON.stringify(payload, null, 2), 'utf8')
console.log('Wrote', output)
console.log('Sheets:', Object.keys(sheets).join(', '))
for (const [name, rows] of Object.entries(sheets)) {
  console.log(`\n=== ${name} (${rows.length} rows) ===`)
  rows.forEach((row, index) => console.log(index + 1, JSON.stringify(row)))
}
