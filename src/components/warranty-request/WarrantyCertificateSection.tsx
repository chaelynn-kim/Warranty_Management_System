import { useMemo, useState } from 'react'
import { Download, FileText, Loader2 } from 'lucide-react'
import type { ProductWarranty } from '../../types'
import {
  lookupCompanyWarrantyTerms,
  parseCompanyWarrantyTerms,
} from '../../utils/companyWarrantyTerms'
import {
  buildWarrantyCertificateFilename,
  downloadWarrantyCertificate,
  generateWarrantyCertificateFile,
  validateWarrantyCertificateInput,
  type WarrantyCertificateFormat,
  type WarrantyCertificateLanguage,
} from '../../utils/warrantyCertificate/generateWarrantyCertificate'

interface WarrantyCertificateSectionProps {
  productItem: string
  resin: string
  resinCustom: string
  colorName: string
  region: string
  coatingStructure: string
  detailRegionLabel: string
  issueDate: string
  totalCoatingThickness: string
  primerThickness: string
  companyWarrantyTerms: string
}

const FORMAT_OPTIONS: { value: WarrantyCertificateFormat; label: string }[] = [
  { value: 'pptx', label: 'PPTX' },
  { value: 'pdf', label: 'PDF' },
]

export function WarrantyCertificateSection({
  productItem,
  resin,
  resinCustom,
  colorName,
  region,
  coatingStructure,
  detailRegionLabel,
  issueDate,
  totalCoatingThickness,
  primerThickness,
  companyWarrantyTerms,
}: WarrantyCertificateSectionProps) {
  const [format, setFormat] = useState<WarrantyCertificateFormat>('pptx')
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [error, setError] = useState('')

  const products: ProductWarranty[] = useMemo(() => {
    const stored = parseCompanyWarrantyTerms(companyWarrantyTerms)
    if (stored.length > 0) return stored
    return lookupCompanyWarrantyTerms({
      productItem,
      resin,
      region,
      coatingStructure,
    })
  }, [companyWarrantyTerms, productItem, resin, region, coatingStructure])

  const input = {
    productItem,
    resin,
    resinCustom,
    colorName,
    coatingStructure,
    detailRegionLabel,
    issueDate,
    totalCoatingThickness,
    primerThickness,
    companyWarrantyTerms: products,
  }

  const validation = validateWarrantyCertificateInput(input)
  const isLoading = loadingKey !== null

  const handleGenerate = async (language: WarrantyCertificateLanguage) => {
    setError('')
    setLoadingKey(`${language}-${format}`)

    try {
      const blob = await generateWarrantyCertificateFile(input, language, format)
      const filename = buildWarrantyCertificateFilename(input, language, format)
      downloadWarrantyCertificate(blob, filename)
    } catch (err) {
      const message = err instanceof Error ? err.message : '보증서 생성에 실패했습니다.'
      setError(message)
    } finally {
      setLoadingKey(null)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-fuchsia-500/25 bg-fuchsia-500/5 p-4">
      <div className="flex items-start gap-2">
        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary">보증서 작성</p>
          <p className="mt-1 text-xs leading-relaxed text-text-muted">
            의뢰서·검토 결과를 바탕으로 보증서 양식을 자동 작성합니다. PPTX는 PowerPoint
            양식 그대로이며, PDF는 동일한 PPTX를 서버에서 변환합니다. 품목에 따라
            PAINT/PRINT 양식이 적용됩니다.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-text-secondary">파일 형식</p>
        <div className="inline-flex rounded-lg border border-fuchsia-400/30 bg-bg-primary/40 p-0.5">
          {FORMAT_OPTIONS.map((option) => {
            const selected = format === option.value
            return (
              <button
                key={option.value}
                type="button"
                disabled={isLoading}
                onClick={() => setFormat(option.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  selected
                    ? 'bg-fuchsia-400/20 text-fuchsia-200'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['ko', 'en'] as const).map((language) => {
          const label = language === 'ko' ? '국문' : '영문'
          const active = loadingKey === `${language}-${format}`

          return (
            <button
              key={language}
              type="button"
              disabled={!validation.ok || isLoading}
              onClick={() => void handleGenerate(language)}
              className="inline-flex items-center gap-2 rounded-lg border border-fuchsia-400/40 bg-fuchsia-400/10 px-4 py-2 text-sm font-medium text-fuchsia-200 transition-colors hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {active ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {label}
            </button>
          )
        })}
      </div>

      {!validation.ok && validation.message && (
        <p className="text-xs text-amber-400">{validation.message}</p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
