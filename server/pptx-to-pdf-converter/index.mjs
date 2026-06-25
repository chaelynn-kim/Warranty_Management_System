import { execFile } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import cors from 'cors'
import express from 'express'
import multer from 'multer'

const execFileAsync = promisify(execFile)
const app = express()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
})

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }
      callback(new Error('Not allowed by CORS'))
    },
  })
)

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/convert', upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'PPTX 파일이 필요합니다.' })
    return
  }

  const apiKey = process.env.API_KEY?.trim()
  if (apiKey && req.header('x-api-key') !== apiKey) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const workDir = path.join('/tmp', `pptx-${randomUUID()}`)
  const inputPath = path.join(workDir, 'certificate.pptx')
  const outputPath = path.join(workDir, 'certificate.pdf')

  try {
    await fs.mkdir(workDir, { recursive: true })
    await fs.writeFile(inputPath, req.file.buffer)

    const pdfFilter =
      'pdf:impress_pdf_Export:{"EmbedStandardFonts":{"type":"boolean","value":"true"},"Quality":{"type":"long","value":"100"}}'

    await execFileAsync(
      'soffice',
      [
        '--headless',
        '--nologo',
        '--nofirststartwizard',
        '--convert-to',
        pdfFilter,
        '--outdir',
        workDir,
        inputPath,
      ],
      {
        timeout: 120_000,
        env: {
          ...process.env,
          HOME: '/tmp',
          LANG: 'ko_KR.UTF-8',
          LC_ALL: 'ko_KR.UTF-8',
        },
      }
    )

    const pdf = await fs.readFile(outputPath)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename="certificate.pdf"')
    res.send(pdf)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PDF 변환에 실패했습니다.'
    res.status(500).json({ error: message })
  } finally {
    await fs.rm(workDir, { recursive: true, force: true })
  }
})

const port = Number(process.env.PORT ?? 8080)
app.listen(port, () => {
  console.log(`pptx-to-pdf converter listening on ${port}`)
})
