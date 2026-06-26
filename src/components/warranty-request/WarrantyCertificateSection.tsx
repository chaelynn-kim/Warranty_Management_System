import { useMemo, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
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
  { value: 'pdf', label: 'PDF' },
  { value: 'pptx', label: 'PPTX' },
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
  const [format, setFormat] = useState<WarrantyCertificateFormat>('pdf')
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
    <div className="space-y-3 rounded-lg border border-border bg-bg-primary/30 p-4">
      <div>
        <p className="text-sm font-medium text-text-primary">보증서 작성</p>
        <p className="mt-1 text-xs leading-relaxed text-text-muted">
          의뢰서·검토 결과를 바탕으로 보증서를 자동 작성합니다. 파일 형식과 발행 언어를 선택하세요.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-text-secondary">파일 형식</p>
        <div className="inline-flex rounded-lg border border-fuchsia-400/30 bg-bg-primary/40 p-1">
          {FORMAT_OPTIONS.map((option) => {
            const selected = format === option.value
            return (
              <button
                key={option.value}
                type="button"
                disabled={isLoading}
                onClick={() => setFormat(option.value)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  selected
                    ? 'bg-fuchsia-400/20 text-fuchsia-200'
                    : 'text-text-muted hover:bg-fuchsia-400/20 hover:text-fuchsia-200'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-text-secondary">발행 언어</p>
        <div className="inline-flex flex-wrap gap-1 rounded-lg border border-fuchsia-400/30 bg-bg-primary/40 p-1">
          {(['ko', 'en'] as const).map((language) => {
            const label = language === 'ko' ? '국문' : '영문'
            const active = loadingKey === `${language}-${format}`

            return (
              <button
                key={language}
                type="button"
                disabled={!validation.ok || isLoading}
                onClick={() => void handleGenerate(language)}
                className="inline-flex items-center gap-2.5 rounded-md px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-fuchsia-400/20 hover:text-fuchsia-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {active ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {!validation.ok && validation.message && (
        <p className="text-xs text-amber-400">{validation.message}</p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
