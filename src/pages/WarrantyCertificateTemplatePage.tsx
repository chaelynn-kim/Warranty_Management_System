import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Download, FileDown, Loader2, RotateCcw, Upload } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/layout/PageHeader'
import { filterActionButtonClass } from '../components/ui/FilterActions'
import type { WarrantyCertificateTemplateEntry } from '../utils/warrantyCertificate/certificateTemplateTypes'
import { downloadFileAttachment, formatFileSize } from '../utils/warrantyAttachments'
import {
  clearWarrantyCertificateTemplate,
  getBundledTemplateUrl,
  loadWarrantyCertificateTemplates,
  migrateCertificateTemplatesBase64,
  replaceWarrantyCertificateTemplate,
} from '../utils/warrantyCertificate/certificateTemplateStorage'
import {
  WARRANTY_CERTIFICATE_TEMPLATE_SLOTS,
  type WarrantyCertificateTemplateSlot,
} from '../utils/warrantyCertificate/certificateTemplateTypes'
import {
  buildSampleWarrantyCertificateInput,
} from '../utils/warrantyCertificate/sampleWarrantyCertificateInput'
import {
  buildWarrantyCertificateFilename,
  downloadWarrantyCertificate,
  generateWarrantyCertificateFile,
  type WarrantyCertificateFormat,
} from '../utils/warrantyCertificate/generateWarrantyCertificate'

interface TemplateSlotCardProps {
  slot: WarrantyCertificateTemplateSlot
  label: string
  productItem: 'PAINT' | 'PRINT'
  language: 'ko' | 'en'
  file: WarrantyCertificateTemplateEntry | null | undefined
  bundledName: string
  onUpdated: () => void
  userEmail?: string
}

function TemplateSlotCard({
  slot,
  label,
  productItem,
  language,
  file,
  bundledName,
  onUpdated,
  userEmail,
}: TemplateSlotCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [testFormat, setTestFormat] = useState<WarrantyCertificateFormat>('pptx')
  const [error, setError] = useState('')

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0]
    event.target.value = ''
    if (!selected) return

    setBusy(true)
    setError('')
    try {
      await replaceWarrantyCertificateTemplate(slot, selected, file ?? null, userEmail)
      onUpdated()
      window.alert(`양식이 업로드되었습니다.\n${selected.name}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : '업로드에 실패했습니다.'
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  const handleDownloadCurrent = async () => {
    if (!file) {
      const bundledUrl = getBundledTemplateUrl(productItem, language)
      if (!bundledUrl) return
      window.open(bundledUrl, '_blank', 'noopener,noreferrer')
      return
    }

    setBusy(true)
    setError('')
    try {
      await downloadFileAttachment(file)
    } catch (err) {
      const message = err instanceof Error ? err.message : '다운로드에 실패했습니다.'
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  const handleResetToBundled = async () => {
    if (!file) return
    if (!window.confirm('업로드한 양식을 삭제하고 기본 번들 양식으로 되돌리시겠습니까?')) return

    setBusy(true)
    setError('')
    try {
      await clearWarrantyCertificateTemplate(slot, userEmail)
      onUpdated()
      window.alert('기본 번들 양식으로 되돌렸습니다.')
    } catch (err) {
      const message = err instanceof Error ? err.message : '되돌리기에 실패했습니다.'
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  const handleTestGenerate = async () => {
    setBusy(true)
    setError('')
    try {
      const input = buildSampleWarrantyCertificateInput(productItem)
      const blob = await generateWarrantyCertificateFile(input, language, testFormat)
      const filename = buildWarrantyCertificateFilename(input, language, testFormat)
      downloadWarrantyCertificate(blob, `TEST_${filename}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : '테스트 생성에 실패했습니다.'
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  const sourceLabel = file ? '업로드된 양식' : '기본 번들 양식'
  const fileLabel = file ? `${file.name} (${formatFileSize(file.size)})` : bundledName

  return (
    <div className="rounded-xl border border-border bg-bg-primary/30 p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">{label}</p>
          <p className="mt-1 text-xs text-text-muted">
            {sourceLabel}: <span className="text-text-secondary">{fileLabel}</span>
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${
            file
              ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
              : 'bg-bg-tertiary text-text-muted ring-1 ring-border'
          }`}
        >
          {file ? '커스텀 적용 중' : '기본 양식'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          className="hidden"
          onChange={(event) => void handleFileChange(event)}
        />
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={busy}
          className={`${filterActionButtonClass} border-border bg-bg-tertiary text-text-primary hover:border-accent hover:text-accent disabled:opacity-50`}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          PPTX 업로드
        </button>
        <button
          type="button"
          onClick={() => void handleDownloadCurrent()}
          disabled={busy}
          className={`${filterActionButtonClass} border-border bg-bg-tertiary text-text-secondary hover:text-text-primary disabled:opacity-50`}
        >
          <Download className="h-4 w-4" />
          현재 양식
        </button>
        {file ? (
          <button
            type="button"
            onClick={() => void handleResetToBundled()}
            disabled={busy}
            className={`${filterActionButtonClass} border-border bg-bg-tertiary text-text-secondary hover:text-text-primary disabled:opacity-50`}
          >
            <RotateCcw className="h-4 w-4" />
            기본으로 되돌리기
          </button>
        ) : null}
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <p className="mb-1 text-xs font-medium text-text-secondary">양식 테스트</p>
        <p className="mb-2 text-[11px] leading-relaxed text-text-muted">
          예시 의뢰 데이터로 보증서를 만들어, 업로드한 양식이 정상인지 확인합니다. (실제 의뢰서가
          필요하지 않습니다.)
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-border bg-bg-tertiary/60 p-0.5">
            {(['pptx', 'pdf'] as const).map((format) => (
              <button
                key={format}
                type="button"
                disabled={busy || !file}
                onClick={() => setTestFormat(format)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  testFormat === format
                    ? 'bg-accent/20 text-accent'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {format}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void handleTestGenerate()}
            disabled={busy || !file}
            title={file ? undefined : 'PPTX 업로드 후 사용할 수 있습니다'}
            className={`${filterActionButtonClass} border-emerald-800/50 bg-emerald-950/40 text-emerald-300 hover:border-emerald-400 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            테스트 다운로드
          </button>
        </div>
        {!file ? (
          <p className="mt-2 text-[11px] text-text-muted">PPTX를 업로드한 뒤 테스트할 수 있습니다.</p>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}
    </div>
  )
}

interface WarrantyCertificateTemplatePageProps {
  userEmail?: string | null
}

const BUNDLED_NAMES: Record<WarrantyCertificateTemplateSlot, string> = {
  'PAINT:ko': 'PAINT_국문_260427.pptx',
  'PAINT:en': 'PAINT_영문_260427.pptx',
  'PRINT:ko': 'PRINT_국문_250624.pptx',
  'PRINT:en': 'PRINT_영문_250624.pptx',
}

export function WarrantyCertificateTemplatePage({ userEmail }: WarrantyCertificateTemplatePageProps) {
  const [loading, setLoading] = useState(true)
  const [record, setRecord] = useState<Awaited<ReturnType<typeof loadWarrantyCertificateTemplates>> | null>(
    null
  )

  const reload = () => {
    void loadWarrantyCertificateTemplates()
      .then((loaded) => migrateCertificateTemplatesBase64(loaded, userEmail ?? undefined))
      .then(setRecord)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [])

  return (
    <div>
      <PageHeader
        subtitle="CERTIFICATE TEMPLATE"
        title="보증서 양식 관리"
        iconSrc="/icons/warranty-request-document.png"
        iconMaskScale={90}
        description={
          <p>
            PowerPoint에서 수정한 PPTX 양식을 업로드하면 보증서 자동 작성에 즉시 반영됩니다. 업로드 후
            양식 테스트로 결과를 확인해 주세요.
          </p>
        }
        descriptionNote={
          <p>
            빨간 글씨 위치·슬라이드 구조를 크게 바꾸면 기존 치환 규칙과 맞지 않을 수 있습니다.
          </p>
        }
      />

      <Card label="TEMPLATE SLOTS" title="품목·언어별 양식">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            양식 정보를 불러오는 중…
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {WARRANTY_CERTIFICATE_TEMPLATE_SLOTS.map((item) => (
              <TemplateSlotCard
                key={item.slot}
                slot={item.slot}
                label={item.label}
                productItem={item.productItem}
                language={item.language}
                file={record?.templates[item.slot]}
                bundledName={BUNDLED_NAMES[item.slot]}
                onUpdated={reload}
                userEmail={userEmail ?? undefined}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
